/**
 * Grupos de alimentos, equivalencias y plan por comida.
 * Todo esto son los valores de fábrica: la persona puede cambiarlos en "Mi plan" (se guardan en `settings`).
 * Una equivalencia vale 1 porción de su grupo, salvo que diga otra cosa (`portions`).
 * Calorías, proteína y grasa por porción salen de la tabla del plan (total del grupo / porciones).
 */

export const FOOD_GROUPS = ['lacteos', 'proteinas', 'harinas', 'grasas', 'frutas', 'verduras', 'dulce', 'agua'] as const;
export type FoodGroup = (typeof FOOD_GROUPS)[number];

export const MEALS = ['desayuno', 'mediaManana', 'almuerzo', 'mediaTarde', 'cena'] as const;
export type Meal = (typeof MEALS)[number];

export const MEAL_LABELS: Record<Meal, string> = {
  desayuno: 'Desayuno',
  mediaManana: 'Media mañana',
  almuerzo: 'Almuerzo',
  mediaTarde: 'Media tarde',
  cena: 'Cena',
};

/** Cómo se ve cada grupo. No se configura. */
export interface GroupLook {
  label: string;
  /** Nombre en singular para frases: "1 harina", "2 grasas". */
  short: [singular: string, plural: string];
  hex: string;
  lightText?: boolean;
  unit: [singular: string, plural: string];
}

export const GROUPS: Record<FoodGroup, GroupLook> = {
  lacteos: { label: 'Lácteos y sustitutos', short: ['lácteo', 'lácteos'], hex: '#F4E2A6', unit: ['porción', 'porciones'] },
  proteinas: { label: 'Proteínas', short: ['proteína', 'proteínas'], hex: '#BC3157', lightText: true, unit: ['porción', 'porciones'] },
  harinas: { label: 'Harinas', short: ['harina', 'harinas'], hex: '#E2B583', unit: ['porción', 'porciones'] },
  grasas: { label: 'Grasas', short: ['grasa', 'grasas'], hex: '#EBB6C9', unit: ['porción', 'porciones'] },
  frutas: { label: 'Frutas', short: ['fruta', 'frutas'], hex: '#C6B5E2', unit: ['porción', 'porciones'] },
  verduras: { label: 'Verduras', short: ['verdura', 'verduras'], hex: '#B9D4A7', unit: ['porción', 'porciones'] },
  dulce: { label: 'Dulce', short: ['dulce', 'dulces'], hex: '#F2C59B', unit: ['porción', 'porciones'] },
  agua: { label: 'Agua', short: ['vaso de agua', 'vasos de agua'], hex: '#A9CCEA', unit: ['vaso', 'vasos'] },
};

/** Lo que aporta 1 porción de un grupo. */
export interface GroupValues {
  kcal: number;
  protein: number;
  fat: number;
}

/** Una equivalencia: "Arroz cocido" · "80 g". Si vale más de una porción, `portions` lo dice. */
export interface Equivalent {
  food: string;
  amount: string;
  portions?: number;
}

export type MealPlan = Record<Meal, Record<FoodGroup, number>>;

/** Todo lo que se puede cambiar en "Mi plan". */
export interface NutritionSettings {
  kcalGoal: number;
  plan: MealPlan;
  values: Record<FoodGroup, GroupValues>;
  foods: Record<FoodGroup, Equivalent[]>;
  /** Código para usar la IA (si el servidor tiene APP_ACCESS_CODE). */
  aiCode?: string;
}

const g = (food: string, amount: string, portions?: number): Equivalent => (portions ? { food, amount, portions } : { food, amount });

const row = (partial: Partial<Record<FoodGroup, number>>): Record<FoodGroup, number> =>
  Object.fromEntries(FOOD_GROUPS.map((k) => [k, partial[k] ?? 0])) as Record<FoodGroup, number>;

export const DEFAULT_SETTINGS: NutritionSettings = {
  kcalGoal: 1400,
  plan: {
    desayuno: row({ lacteos: 2, harinas: 1, grasas: 1, agua: 1 }),
    mediaManana: row({ lacteos: 1, frutas: 1, agua: 2 }),
    almuerzo: row({ proteinas: 1, harinas: 2, grasas: 2, verduras: 1, agua: 2 }),
    mediaTarde: row({ lacteos: 1, frutas: 1, dulce: 1, agua: 2 }),
    cena: row({ proteinas: 1, harinas: 1, grasas: 1, verduras: 1, agua: 1 }),
  },
  values: {
    lacteos: { kcal: 90, protein: 5.3, fat: 5.4 },
    proteinas: { kcal: 170, protein: 25, fat: 0 },
    harinas: { kcal: 90, protein: 2.85, fat: 0.9 },
    grasas: { kcal: 42.3, protein: 0.2, fat: 4.7 },
    frutas: { kcal: 80, protein: 2, fat: 0.8 },
    verduras: { kcal: 0, protein: 1.4, fat: 0.3 },
    dulce: { kcal: 90, protein: 0, fat: 0 },
    agua: { kcal: 0, protein: 0, fat: 0 },
  },
  foods: {
    lacteos: [
      g('Queso', '30 g'),
      g('Queso bajo en grasa', '2 tajadas'),
      g('Huevo', '1 unidad'),
      g('Claras de huevo', '3 unidades'),
      g('Leche', '240 ml'),
      g('Yogurt', '200 ml'),
      g('Jamón de pavo', '2 tajadas'),
    ],
    proteinas: [
      g('Pechuga de pollo', '100 g cocida'),
      g('Muslo de pollo sin piel', '100 g cocido'),
      g('Carne de res magra', '100 g cocida'),
      g('Carne molida magra', '100 g cocida'),
      g('Lomo de cerdo', '100 g cocido'),
      g('Pescado blanco (tilapia, merluza)', '100 g cocido'),
      g('Pavo', '100 g cocido'),
      g('Camarones', '100 g cocidos'),
      g('Atún en agua', '1 lata'),
    ],
    harinas: [
      g('Arepa', '50 g'),
      g('Arepa gruesa', '½ unidad'),
      g('Arroz cocido', '80 g'),
      g('Papa cocida', '80 g'),
      g('Plátano maduro', '80 g'),
      g('Plátano verde', '80 g'),
      g('Pasta', '30 g en crudo'),
      g('Pan', '30 g'),
      g('Pan Bimbo fit', '2 tajadas'),
      g('Tortilla mediana', '1 unidad'),
      g('Lentejas cocidas', '4 cucharadas'),
      g('Avena en hojuelas', '3 cucharadas'),
      g('Cereal', '30 g (3 cucharadas)'),
      g('Granola', '2 cucharadas'),
      g('Torta', '1 rebanada pequeña'),
    ],
    grasas: [
      g('Aceite de oliva', '1 cucharadita'),
      g('Aceite de oliva', '1 cucharada', 3),
      g('Mantequilla', '½ cucharada'),
      g('Aderezo', '1 cucharada'),
      g('Frutos secos (maní, almendras, nueces)', '1 cucharada'),
      g('Aguacate', '30 g'),
      g('Mayonesa', '1 cucharadita'),
      g('Queso crema', '1 cucharada'),
      g('Mantequilla de maní', '½ cucharada'),
    ],
    frutas: [
      g('Banano', '½ unidad'),
      g('Manzana', '1 pequeña'),
      g('Pera', '1 pequeña'),
      g('Mandarina', '1 unidad'),
      g('Mango', '½ unidad pequeña'),
      g('Papaya', '1 taza'),
      g('Piña', '¾ taza'),
      g('Fresas', '1 taza'),
      g('Uvas', '15 unidades'),
      g('Patilla', '1 ¼ taza'),
    ],
    verduras: [
      g('Ensalada de hojas (lechuga, espinaca)', '1 taza'),
      g('Tomate', '1 unidad'),
      g('Pepino', '1 taza'),
      g('Brócoli o coliflor cocidos', '½ taza'),
      g('Zanahoria', '½ taza'),
      g('Habichuela cocida', '½ taza'),
      g('Verduras mixtas cocidas', '½ taza'),
    ],
    dulce: [
      g('Galletas Festival', '2 unidades'),
      g('Helado', '1 bola'),
      g('Mini Chocoramo', '1 unidad'),
      g('Chocolatina Jet pequeña', '1 unidad'),
    ],
    agua: [g('Agua', '1 vaso')],
  },
};

/** Los ajustes guardados encima de los de fábrica (un ajuste guardado puede venir incompleto). */
export function resolveSettings(saved?: Partial<NutritionSettings>): NutritionSettings {
  if (!saved) return DEFAULT_SETTINGS;
  const d = DEFAULT_SETTINGS;
  return {
    kcalGoal: saved.kcalGoal ?? d.kcalGoal,
    plan: Object.fromEntries(MEALS.map((m) => [m, { ...d.plan[m], ...saved.plan?.[m] }])) as MealPlan,
    values: Object.fromEntries(FOOD_GROUPS.map((k) => [k, { ...d.values[k], ...saved.values?.[k] }])) as NutritionSettings['values'],
    foods: Object.fromEntries(FOOD_GROUPS.map((k) => [k, saved.foods?.[k] ?? d.foods[k]])) as NutritionSettings['foods'],
    aiCode: saved.aiCode,
  };
}

/** La comida que toca según la hora, para no tener que elegirla cada vez. */
export function mealForHour(hour: number): Meal {
  if (hour < 10) return 'desayuno';
  if (hour < 12) return 'mediaManana';
  if (hour < 15) return 'almuerzo';
  if (hour < 18) return 'mediaTarde';
  return 'cena';
}

/** 1,5 → "1,5"; 2 → "2" */
export function fmtNum(n: number): string {
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

export function unitLabel(group: FoodGroup, n: number): string {
  const [one, many] = GROUPS[group].unit;
  return n === 1 ? one : many;
}

/** "2 harinas", "1 grasa", "1,5 lácteos" */
export function portionsLabel(group: FoodGroup, n: number): string {
  const [one, many] = GROUPS[group].short;
  return `${fmtNum(n)} ${n === 1 ? one : many}`;
}

/** Texto que queda guardado en el registro: "Arroz cocido (80 g)". */
export function equivalentText(e: Equivalent): string {
  return `${e.food} (${e.amount})`;
}
