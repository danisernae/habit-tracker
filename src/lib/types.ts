import type { DateKey } from './dates';
import type { HabitColor, HabitIcon } from './palette';
import type { FoodGroup, Meal, NutritionSettings } from './foods';

export interface Habit {
  id: string;
  name: string;
  /** Detalle opcional: "8 vasos", "30 min"… */
  detail: string;
  color: HabitColor;
  icon: HabitIcon;
  /** Días en que aplica, con la numeración de Date.getDay() (0 = domingo … 6 = sábado). */
  weekdays: number[];
  /** Día desde el que cuenta (los días anteriores no bajan el porcentaje). */
  createdAt: DateKey;
  order: number;
}

export interface Reflection {
  /** 0 Difícil … 4 Genial; -1 sin elegir */
  mood: number;
  note: string;
}

export interface AppData {
  version: 1;
  habits: Habit[];
  /** Por día, los ids de los hábitos cumplidos. Si no está, no se cumplió. */
  checks: Record<DateKey, string[]>;
  /** Evaluación por mes, clave 'AAAA-MM'. */
  reflections: Record<string, Reflection>;
}

export type Portions = Partial<Record<FoodGroup, number>>;

/**
 * Algo que se comió, en una comida. Normalmente es una equivalencia: cuenta `portions` (1 si no está) de `group`.
 * Lo que se calculó con IA trae además `split` (porciones de varios grupos) y sus propias kcal/proteína/grasa.
 */
export interface FoodEntry {
  id: string;
  /** El grupo principal (da el color). */
  group: FoodGroup;
  /** "Arroz cocido (80 g)", "Agua (1 vaso)"… */
  food: string;
  meal: Meal;
  portions?: number;
  split?: Portions;
  kcal?: number;
  protein?: number;
  fat?: number;
}

/** Un alimento que ya se calculó con IA, para volver a agregarlo sin consultar de nuevo. */
export interface AiFood {
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  split: Portions;
  source: string;
}

/** Un registro de seguimiento. Los campos que no se midieron quedan vacíos. */
export interface BodyEntry {
  date: DateKey;
  weight?: number;
  bmi?: number;
  fat?: number;
}

export interface NutritionData {
  version: 1;
  /** Por día, lo que se comió en el orden en que se agregó. */
  days: Record<DateKey, FoodEntry[]>;
  /** Un registro por fecha, ordenados de más antiguo a más reciente. */
  body: BodyEntry[];
  /** Estatura en cm, para calcular el IMC. */
  heightCm?: number;
  /** Cambios a los valores de fábrica de "Mi plan" (lib/foods.ts). Si no está, se usan los de fábrica. */
  settings?: Partial<NutritionSettings>;
  /** Lo último que se calculó con IA (máx. 12, el más reciente primero). */
  aiFoods?: AiFood[];
}
