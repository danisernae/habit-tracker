/** Los 5 colores de hábito. Cada hábito se reconoce por su color en toda la app. */
export const HABIT_COLORS = {
  cielo: { hex: '#A9CCEA', label: 'Azul cielo', lightText: false },
  mora: { hex: '#BC3157', label: 'Mora', lightText: true },
  avena: { hex: '#EAD6AE', label: 'Avena', lightText: false },
  rosa: { hex: '#EBB6C9', label: 'Rosa chicle', lightText: false },
  lila: { hex: '#C6B5E2', label: 'Lila', lightText: false },
} as const;

export type HabitColor = keyof typeof HABIT_COLORS;
export const COLOR_KEYS = Object.keys(HABIT_COLORS) as HabitColor[];

export const INK = '#3B1424';

export function colorHex(c: HabitColor): string {
  return HABIT_COLORS[c].hex;
}

/** Color del texto encima del color del hábito (solo "mora" lleva texto blanco). */
export function colorInk(c: HabitColor): string {
  return HABIT_COLORS[c].lightText ? '#FFFFFF' : INK;
}

export const ICON_KEYS = ['agua', 'ejercicio', 'dieta', 'sinAzucar', 'skincare', 'lectura'] as const;
export type HabitIcon = (typeof ICON_KEYS)[number];

export const ICON_LABELS: Record<HabitIcon, string> = {
  agua: 'Gota de agua',
  ejercicio: 'Pesa',
  dieta: 'Hoja',
  sinAzucar: 'Sin azúcar',
  skincare: 'Brillo',
  lectura: 'Libro',
};
