import type { DateKey } from './dates';
import type { HabitColor, HabitIcon } from './palette';
import type { FoodGroup, Meal } from './foods';

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

/** Una porción que se comió: una equivalencia de un grupo (o algo escrito a mano) en una comida. */
export interface FoodEntry {
  id: string;
  group: FoodGroup;
  /** "80 g de arroz", "1 vaso de agua"… */
  food: string;
  meal: Meal;
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
}
