import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/estimate  { "food": "1 rebanada de pizza" }
 * Devuelve un aproximado de calorías y macros, y a cuántas porciones del plan equivale.
 * Para marcas comunes (Bimbo, Alpina, Zenú…) Claude busca en internet la etiqueta nutricional.
 *
 * Variables de entorno (en Vercel → Settings → Environment Variables):
 * - ANTHROPIC_API_KEY  (obligatoria)
 * - APP_ACCESS_CODE    (opcional, recomendada: si existe, la app debe mandar el mismo código;
 *                       así nadie más puede gastar tu saldo con el link público)
 */

const MODEL = 'claude-opus-5-5';

/** La búsqueda en internet puede tardar varios segundos. */
export const maxDuration = 60;

const GROUP_KEYS = ['lacteos', 'proteinas', 'harinas', 'grasas', 'frutas', 'verduras', 'dulce'] as const;

const SYSTEM = `You estimate the nutrition of foods for a Colombian user who follows an exchange-list meal plan (about 1400 kcal per day).
Reply in Colombian Spanish.

The plan's exchange groups, with what one portion contains:
- lacteos (dairy and substitutes: cheese, eggs, milk, yogurt, cold cuts): 90 kcal, 5.3 g protein, 5.4 g fat
- proteinas (100 g cooked lean meat, chicken, fish, 1 can of tuna): 170 kcal, 25 g protein
- harinas (starches: 80 g cooked rice, 80 g potato, 50 g arepa, 30 g bread, 30 g raw pasta): 90 kcal, 2.85 g protein, 0.9 g fat
- grasas (1/2 tbsp butter, 1 tsp oil, 1 tbsp nuts): 42 kcal, 4.7 g fat
- frutas: 80 kcal
- verduras: almost no calories
- dulce (sweets: 2 Festival cookies, 1 scoop of ice cream): 90 kcal

How to answer:
1. If the food is a specific brand or packaged product (for example "pan Bimbo fit", "yogurt Alpina", "Chocoramo"), search the web for its nutrition label and use the real values per serving the user described. Prefer the brand's Colombian site or label.
2. For generic or home-made foods, estimate from typical values without searching.
3. Scale to the amount the user wrote. If no amount is given, assume one usual serving and say which.
4. Express the food as portions of the groups above (halves allowed, e.g. 1.5). Fried foods add grasas; sugary foods count as dulce.
5. Call the report_estimate tool exactly once with the result. Do not write anything else.`;

const REPORT_TOOL = {
  name: 'report_estimate',
  description: 'Report the nutrition estimate for the food the user described.',
  strict: true,
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Short name with the amount, in Spanish. Ej: "Papas fritas (30 g)"' },
      kcal: { type: 'number' },
      protein_g: { type: 'number' },
      fat_g: { type: 'number' },
      carbs_g: { type: 'number' },
      portions: {
        type: 'object',
        description: 'Equivalent portions per exchange group (0 when it does not apply).',
        properties: Object.fromEntries(GROUP_KEYS.map((g) => [g, { type: 'number' }])),
        required: [...GROUP_KEYS],
        additionalProperties: false,
      },
      source: { type: 'string', description: 'Where the numbers come from: the label or site consulted, or "Estimación".' },
      note: { type: 'string', description: 'One short sentence for the user (assumed serving size, tip). Empty if nothing to add.' },
    },
    required: ['name', 'kcal', 'protein_g', 'fat_g', 'carbs_g', 'portions', 'source', 'note'],
    additionalProperties: false,
  },
};

export interface Estimate {
  name: string;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  portions: Record<(typeof GROUP_KEYS)[number], number>;
  source: string;
  note: string;
}

function isEstimate(x: unknown): x is Estimate {
  const e = x as Estimate;
  return (
    !!e &&
    typeof e.name === 'string' &&
    [e.kcal, e.protein_g, e.fat_g, e.carbs_g].every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0) &&
    !!e.portions &&
    GROUP_KEYS.every((g) => typeof e.portions[g] === 'number' && e.portions[g] >= 0)
  );
}

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) return fail(500, 'Falta configurar ANTHROPIC_API_KEY en el servidor.');
  const code = process.env.APP_ACCESS_CODE;
  if (code && request.headers.get('x-access-code') !== code) return fail(401, 'Código de acceso incorrecto.');

  let food = '';
  try {
    food = String(((await request.json()) as { food?: unknown }).food ?? '').trim();
  } catch {
    /* cuerpo inválido: se responde abajo */
  }
  if (!food) return fail(400, 'Escribe qué comiste.');
  if (food.length > 200) return fail(400, 'Descríbelo en menos de 200 letras.');

  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: food }];

  try {
    // La búsqueda web corre en los servidores de Anthropic; si el turno se pausa, se reanuda (máx. 3 veces).
    for (let i = 0; i < 4; i++) {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low' },
        system: SYSTEM,
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }, REPORT_TOOL],
        messages,
      });

      if (response.stop_reason === 'refusal') return fail(422, 'No pude calcular ese alimento. Prueba describiéndolo de otra forma.');
      if (response.stop_reason === 'pause_turn') {
        messages.push({ role: 'assistant', content: response.content });
        continue;
      }
      const call = response.content.find((b) => b.type === 'tool_use' && b.name === 'report_estimate');
      if (call && call.type === 'tool_use' && isEstimate(call.input)) return Response.json(call.input);
      return fail(502, 'La IA no devolvió un cálculo. Intenta de nuevo.');
    }
    return fail(504, 'La búsqueda tardó demasiado. Intenta de nuevo.');
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return fail(429, 'Hay muchas consultas seguidas. Espera un momento.');
    if (error instanceof Anthropic.AuthenticationError) return fail(500, 'La clave ANTHROPIC_API_KEY no es válida.');
    if (error instanceof Anthropic.APIError) return fail(502, `Error de la IA (${error.status ?? 'sin conexión'}).`);
    throw error;
  }
}
