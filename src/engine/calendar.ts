import { addDays, format, startOfDay } from 'date-fns';
import type { Calendar, DayOfWeek } from './types';

/** Format a Date as a `YYYY-MM-DD` ISO date string in local time. */
export function isoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function isWorkingDay(date: Date, cal: Calendar): boolean {
  const dow = date.getDay() as DayOfWeek;
  if (!cal.workingDaysOfWeek.has(dow)) return false;
  if (cal.holidays.has(isoDate(date))) return false;
  return true;
}

/** Return the next working day on or after `date`. */
export function nextWorkingDay(date: Date, cal: Calendar): Date {
  let d = startOfDay(date);
  while (!isWorkingDay(d, cal)) d = addDays(d, 1);
  return d;
}

/** Return the previous working day on or before `date`. */
export function prevWorkingDay(date: Date, cal: Calendar): Date {
  let d = startOfDay(date);
  while (!isWorkingDay(d, cal)) d = addDays(d, -1);
  return d;
}

/**
 * Add N working days. The result is a working day.
 * `days` may be negative.
 *
 * Convention: if `days === 0`, returns the next working day on/after `from`.
 */
export function addWorkingDays(from: Date, days: number, cal: Calendar): Date {
  const start = nextWorkingDay(from, cal);
  if (days === 0) return start;
  const step = days > 0 ? 1 : -1;
  let remaining = Math.abs(days);
  let d = start;
  while (remaining > 0) {
    d = addDays(d, step);
    if (isWorkingDay(d, cal)) remaining--;
  }
  return d;
}

/**
 * Working days between `from` (inclusive) and `to` (exclusive).
 * If `from > to`, returns a negative number.
 */
export function workingDaysBetween(from: Date, to: Date, cal: Calendar): number {
  if (from.getTime() === to.getTime()) return 0;
  const sign = from < to ? 1 : -1;
  const [a, b] = sign === 1 ? [from, to] : [to, from];
  let count = 0;
  let d = startOfDay(a);
  const end = startOfDay(b);
  while (d < end) {
    if (isWorkingDay(d, cal)) count++;
    d = addDays(d, 1);
  }
  return sign * count;
}

/**
 * Compute task finish given start and a duration in working days.
 *
 * - duration === 0 → milestone, finish = start.
 * - duration > 0 → start is the first working day; finish is the LAST working day used.
 *   Visually, the bar spans [start .. finishExclusive) where finishExclusive is the
 *   working day after `finish`. But for storage we keep the inclusive `finish`.
 */
export function computeFinish(start: Date, durationDays: number, cal: Calendar): Date {
  if (durationDays <= 0) return start;
  // duration of 1 means start === finish (1 working day).
  return addWorkingDays(start, durationDays - 1, cal);
}

/**
 * Inverse of computeFinish. Given a finish and duration, return start.
 */
export function computeStartFromFinish(finish: Date, durationDays: number, cal: Calendar): Date {
  if (durationDays <= 0) return finish;
  return addWorkingDays(finish, -(durationDays - 1), cal);
}
