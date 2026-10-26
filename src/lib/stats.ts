import { addDays, isFuture, monthDays, toKey } from './dates';
import { FOOD_GROUPS, GROUPS, KCAL_GOAL, MEAL_PLAN, type FoodGroup, type Meal } from './foods';
import type { AppData, BodyEntry, FoodEntry, Habit } from './types';

/**
 * Todos los cálculos viven aquí; las pantallas solo los muestran.
 * - Un hábito solo cuenta los días que tiene programados y desde el día en que se creó.
 * - % = días cumplidos / días programados (hasta hoy).
 * - Día perfecto = todos los hábitos programados ese día cumplidos.
 * - Racha actual = días programados seguidos cumplidos; si hoy aún no está marcado, no la rompe.
 */

type Checks = AppData['checks'];

export function isScheduled(h: Habit, day: Date): boolean {
  return h.weekdays.includes(day.getDay()) && toKey(day) >= h.createdAt;
}

/**
 * Hábitos que se muestran para marcar un día: los que tienen programado ese día de la semana,
 * aunque ese día sea anterior a su inicio (al marcarlo, el inicio se mueve a ese día; ver store).
 */
export function habitsForDay(habits: Habit[], day: Date): Habit[] {
  return habits.filter((h) => h.weekdays.includes(day.getDay()));
}

export function isDone(checks: Checks, habitId: string, day: Date): boolean {
  return (checks[toKey(day)] ?? []).includes(habitId);
}

export function currentStreak(h: Habit, checks: Checks, today: Date): number {
  let day = isDone(checks, h.id, today) ? today : addDays(today, -1);
  let streak = 0;
  for (let i = 0; i < 3650; i++) {
    if (toKey(day) < h.createdAt) break;
    if (h.weekdays.includes(day.getDay())) {
      if (isDone(checks, h.id, day)) streak++;
      else break;
    }
    day = addDays(day, -1);
  }
  return streak;
}

export interface HabitMonth {
  habit: Habit;
  done: number;
  scheduled: number;
  bestStreak: number;
  pct: number;
}

export interface MonthSummary {
  perHabit: HabitMonth[];
  checks: number;
  scheduled: number;
  perfectDays: number;
  pct: number;
  strongest?: HabitMonth;
  weakest?: HabitMonth;
}

const percent = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

export function monthSummary(habits: Habit[], checks: Checks, month: Date, today: Date): MonthSummary {
  const days = monthDays(month).filter((d) => !isFuture(d, today));
  let total = 0;
  let scheduledTotal = 0;

  const perHabit = habits.map((h) => {
    let done = 0, scheduled = 0, best = 0, run = 0;
    for (const d of days) {
      if (!isScheduled(h, d)) continue;
      scheduled++;
      if (isDone(checks, h.id, d)) {
        done++;
        run++;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    total += done;
    scheduledTotal += scheduled;
    return { habit: h, done, scheduled, bestStreak: best, pct: percent(done, scheduled) };
  });

  let perfectDays = 0;
  for (const d of days) {
    const due = habits.filter((h) => isScheduled(h, d));
    if (due.length > 0 && due.every((h) => isDone(checks, h.id, d))) perfectDays++;
  }

  const ranked = perHabit.filter((r) => r.scheduled > 0).sort((a, b) => b.pct - a.pct);
  return {
    perHabit,
    checks: total,
    scheduled: scheduledTotal,
    perfectDays,
    pct: percent(total, scheduledTotal),
    strongest: ranked[0],
    weakest: ranked.length > 1 ? ranked[ranked.length - 1] : undefined,
  };
}

export function dayMessage(done: number, total: number): string {
  if (total === 0) return 'Hoy es día libre';
  if (done === total) return '¡Día perfecto!';
  if (done / total >= 0.6) return '¡Vas muy bien!';
  if (done >= 1) return 'Vas arrancando';
  return 'Empieza por uno';
}

export function verdict(pct: number): string {
  if (pct >= 85) return '¡Mes increíble!';
  if (pct >= 70) return '¡Muy buen mes!';
  if (pct >= 50) return 'Buen avance';
  return 'Mes para retomar';
}

export const MOODS = ['Difícil', 'Regular', 'Bien', 'Muy bien', 'Genial'];

/* ===== Nutrición ===== */

export interface DayNutrition {
  /** Porciones por grupo en todo el día. */
  count: Record<FoodGroup, number>;
  kcal: number;
  protein: number;
  fat: number;
  /** % de la meta de calorías (puede pasar de 100). */
  kcalPct: number;
  /** Grupos que aún no llegan a lo del plan. */
  missing: FoodGroup[];
}

function emptyCount(): Record<FoodGroup, number> {
  return Object.fromEntries(FOOD_GROUPS.map((g) => [g, 0])) as Record<FoodGroup, number>;
}

export function countByGroup(entries: FoodEntry[], meal?: Meal): Record<FoodGroup, number> {
  const count = emptyCount();
  for (const e of entries) if (!meal || e.meal === meal) count[e.group]++;
  return count;
}

export function dayNutrition(entries: FoodEntry[]): DayNutrition {
  const count = countByGroup(entries);
  let kcal = 0, protein = 0, fat = 0;
  for (const g of FOOD_GROUPS) {
    kcal += count[g] * GROUPS[g].kcal;
    protein += count[g] * GROUPS[g].protein;
    fat += count[g] * GROUPS[g].fat;
  }
  return {
    count,
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    fat: Math.round(fat),
    kcalPct: Math.round((kcal / KCAL_GOAL) * 100),
    missing: FOOD_GROUPS.filter((g) => count[g] < GROUPS[g].target),
  };
}

/** Porciones que el plan sugiere para un grupo en una comida (0 si no lleva). */
export function mealTarget(meal: Meal, group: FoodGroup): number {
  return MEAL_PLAN[meal][group] ?? 0;
}

export function nutritionMessage(kcal: number): string {
  const left = KCAL_GOAL - kcal;
  if (kcal === 0) return 'Registra tu primera comida';
  if (left > 300) return 'Vas bien';
  if (left >= -100) return '¡En tu meta!';
  return 'Te pasaste un poco';
}

/** IMC = peso (kg) / estatura (m)², con un decimal. */
export function bmi(weightKg: number | undefined, heightCm: number | undefined): number | undefined {
  if (!weightKg || !heightCm) return undefined;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiLabel(value: number): string {
  if (value < 18.5) return 'Bajo peso';
  if (value < 25) return 'Normal';
  if (value < 30) return 'Sobrepeso';
  return 'Obesidad';
}

/** Cambio de un campo entre el primer y el último registro que lo tienen. */
export function bodyChange(body: BodyEntry[], field: 'weight' | 'bmi' | 'fat'): number | undefined {
  const withValue = body.filter((b) => b[field] !== undefined);
  if (withValue.length < 2) return undefined;
  const diff = withValue[withValue.length - 1][field]! - withValue[0][field]!;
  return Math.round(diff * 10) / 10;
}

/** El registro anterior a `index` que tiene ese campo, para mostrar la diferencia. */
export function previousValue(body: BodyEntry[], index: number, field: 'weight' | 'bmi' | 'fat'): number | undefined {
  for (let i = index - 1; i >= 0; i--) if (body[i][field] !== undefined) return body[i][field];
  return undefined;
}
