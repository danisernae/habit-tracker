/**
 * Grupos de alimentos, equivalencias y plan del día (1400 kcal aprox.).
 * Una porción de cualquier equivalencia de un grupo vale lo mismo: se agrega una y se va sumando.
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

export const KCAL_GOAL = 1400;

export interface GroupInfo {
  label: string;
  /** Color del grupo (texto en ink encima, salvo `lightText`). */
  hex: string;
  lightText?: boolean;
  /** Unidad para el contador: "porciones" o "vasos". */
  unit: [singular: string, plural: string];
  kcal: number;
  protein: number;
  fat: number;
  /** Porciones al día según el plan. */
  target: number;
  equivalents: string[];
}

export const GROUPS: Record<FoodGroup, GroupInfo> = {
  lacteos: {
    label: 'Lácteos y sustitutos',
    hex: '#F4E2A6',
    unit: ['porción', 'porciones'],
    kcal: 90,
    protein: 5.3,
    fat: 5.4,
    target: 4,
    equivalents: [
      '30 g de queso',
      '1 huevo',
      '3 claras',
      '2 tajadas de queso bajo en grasa',
      '240 ml de leche',
      '200 ml de yogurt',
    ],
  },
  proteinas: {
    label: 'Proteínas',
    hex: '#BC3157',
    lightText: true,
    unit: ['porción', 'porciones'],
    kcal: 170,
    protein: 25,
    fat: 0,
    target: 2,
    equivalents: ['100 g cocido', '1 lata de atún'],
  },
  harinas: {
    label: 'Harinas',
    hex: '#E2B583',
    unit: ['porción', 'porciones'],
    kcal: 90,
    protein: 2.85,
    fat: 0.9,
    target: 4,
    equivalents: [
      'Arepa de 50 g',
      '1/2 arepa gruesita',
      '80 g de arroz',
      '1 tortilla mediana',
      '2 tajadas de pan Bimbo fit',
      '30 g de pan',
      '80 g de papa',
      '4 cucharadas de lentejas',
      '30 g de pasta cruda',
      '3 cucharadas de avena',
      '3 cucharadas de cereal (30 g)',
      '2 cucharadas de granola',
      '80 g de maduro',
      '80 g de verde',
      '1 rebanada pequeña de torta',
    ],
  },
  grasas: {
    label: 'Grasas',
    hex: '#EBB6C9',
    unit: ['porción', 'porciones'],
    kcal: 42.3,
    protein: 0.2,
    fat: 4.7,
    target: 4,
    equivalents: ['1/2 cucharada de mantequilla', '1 cucharada de aderezo', '1 cucharada de frutos secos'],
  },
  frutas: {
    label: 'Frutas',
    hex: '#C6B5E2',
    unit: ['porción', 'porciones'],
    kcal: 80,
    protein: 2,
    fat: 0.8,
    target: 1,
    equivalents: ['1 porción de fruta'],
  },
  verduras: {
    label: 'Verduras',
    hex: '#B9D4A7',
    unit: ['porción', 'porciones'],
    kcal: 0,
    protein: 1.4,
    fat: 0.3,
    target: 2,
    equivalents: ['1 porción de verduras'],
  },
  dulce: {
    label: 'Dulce',
    hex: '#F2C59B',
    unit: ['porción', 'porciones'],
    kcal: 90,
    protein: 0,
    fat: 0,
    target: 1,
    equivalents: ['2 galletas Festival', '1 bolita de helado', '1 mini Chocoramo', '1 Jet pequeña'],
  },
  agua: {
    label: 'Agua',
    hex: '#A9CCEA',
    unit: ['vaso', 'vasos'],
    kcal: 0,
    protein: 0,
    fat: 0,
    target: 8,
    equivalents: ['1 vaso de agua'],
  },
};

/** Porciones sugeridas en cada comida (tabla del plan). */
export const MEAL_PLAN: Record<Meal, Partial<Record<FoodGroup, number>>> = {
  desayuno: { lacteos: 2, harinas: 1, grasas: 1, agua: 1 },
  mediaManana: { lacteos: 1, frutas: 1, agua: 2 },
  almuerzo: { proteinas: 1, harinas: 2, grasas: 2, verduras: 1, agua: 2 },
  mediaTarde: { lacteos: 1, frutas: 1, dulce: 1, agua: 2 },
  cena: { proteinas: 1, harinas: 1, grasas: 1, verduras: 1, agua: 1 },
};

/** La comida que toca según la hora, para no tener que elegirla cada vez. */
export function mealForHour(hour: number): Meal {
  if (hour < 10) return 'desayuno';
  if (hour < 12) return 'mediaManana';
  if (hour < 15) return 'almuerzo';
  if (hour < 18) return 'mediaTarde';
  return 'cena';
}

export function unitLabel(group: FoodGroup, n: number): string {
  const [one, many] = GROUPS[group].unit;
  return n === 1 ? one : many;
}
