import { addDays, isFuture, monthDays, toKey } from './dates';
import type { AppData, Habit } from './types';

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
