import type { Calendar, Dependency, Task } from '../types';
import { DEFAULT_CALENDAR } from '../types';

export const cal: Calendar = DEFAULT_CALENDAR;

/** Monday 2026-05-04 (a working day) — used as the project anchor in fixtures. */
export const PROJECT_START = new Date(2026, 4, 4); // month is 0-indexed: May = 4

export const mkTask = (id: string, durationDays: number, name = id): Task => ({
  id,
  name,
  durationDays,
  scheduleMode: 'auto',
  constraint: { kind: 'ASAP' },
  isMilestone: durationDays === 0,
  progressPct: 0,
});

export const mkDep = (
  id: string,
  predecessorId: string,
  successorId: string,
  type: Dependency['type'],
  lagDays = 0,
): Dependency => ({ id, predecessorId, successorId, type, lagDays });

export const mapOf = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map(t => [t.id, t]));
