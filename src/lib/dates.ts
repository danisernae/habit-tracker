/** Fechas en hora local. Un día se guarda como texto 'AAAA-MM-DD'. */

export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Igual que `fromKey`, pero devuelve null si el texto no es una fecha 'AAAA-MM-DD' real. */
export function parseKey(key: string | undefined): Date | null {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const d = fromKey(key);
  return toKey(d) === key ? d : null;
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Letras de lunes a domingo. */
export const WEEK_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const WEEK_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
/** De la posición L..D al número de `Date.getDay()` (0 = domingo). */
export const WEEK_TO_GETDAY = [1, 2, 3, 4, 5, 6, 0];

/** Lunes a domingo de la semana de `ref`. */
export function weekDays(ref: Date): Date[] {
  const offset = (ref.getDay() + 6) % 7;
  const monday = addDays(ref, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Todos los días del mes de `ref`. */
export function monthDays(ref: Date): Date[] {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const count = new Date(y, m + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => new Date(y, m, i + 1));
}

/** Casillas vacías antes del día 1 en una cuadrícula que empieza el lunes. */
export function leadingBlanks(ref: Date): number {
  return (new Date(ref.getFullYear(), ref.getMonth(), 1).getDay() + 6) % 7;
}

export function isFuture(d: Date, today: Date): boolean {
  return toKey(d) > toKey(today);
}

export function sameDay(a: Date, b: Date): boolean {
  return toKey(a) === toKey(b);
}

/** "domingo, 18 de octubre" */
export function longDate(d: Date): string {
  return new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
}

/** "Hoy", "Ayer" o el día de la semana: "Jueves" */
export function dayTitle(d: Date, today: Date): string {
  if (sameDay(d, today)) return 'Hoy';
  if (sameDay(d, addDays(today, -1))) return 'Ayer';
  return WEEK_NAMES[(d.getDay() + 6) % 7];
}

/** "Octubre" */
export function monthName(d: Date): string {
  const name = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(d);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** "26 oct 2026" */
export function shortDate(d: Date): string {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(d).replace('.', '');
}
