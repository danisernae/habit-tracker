import type { AiFood, Portions } from './types';
import { FOOD_GROUPS } from './foods';

/** Respuesta de /api/estimate (ver api/estimate.ts). */
interface EstimateResponse {
  name: string;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  portions: Portions;
  source: string;
  note: string;
}

export interface Estimated extends AiFood {
  note: string;
}

/** Pregunta a la IA cuántas calorías tiene un alimento. Lanza un Error con un mensaje para mostrar. */
export async function estimateFood(food: string, code: string | undefined): Promise<Estimated> {
  let res: Response;
  try {
    res = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(code ? { 'x-access-code': code } : {}) },
      body: JSON.stringify({ food }),
    });
  } catch {
    throw new Error('No hay conexión. La IA necesita internet.');
  }
  const body = (await res.json().catch(() => null)) as (EstimateResponse & { error?: string }) | null;
  if (!res.ok || !body || body.error) {
    if (res.status === 404) throw new Error('La IA no está disponible en esta versión de la app.');
    throw new Error(body?.error ?? 'No se pudo calcular. Intenta de nuevo.');
  }
  const split: Portions = {};
  for (const g of FOOD_GROUPS) {
    const n = body.portions[g] ?? 0;
    if (n > 0) split[g] = Math.round(n * 2) / 2;
  }
  return {
    name: body.name,
    kcal: Math.round(body.kcal),
    protein: Math.round(body.protein_g),
    fat: Math.round(body.fat_g),
    carbs: Math.round(body.carbs_g),
    split,
    source: body.source,
    note: body.note,
  };
}
