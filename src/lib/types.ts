import type { DateKey } from './dates';
import type { HabitColor, HabitIcon } from './palette';

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
