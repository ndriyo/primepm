import { addDays, differenceInCalendarDays } from 'date-fns';
import type { ScheduleResult, Task } from '../engine';
import { isWorkingDay } from '../engine';
import type { Assignment, Resource } from '../store/projectStore';
import type { Calendar } from '../engine';

export interface DailyUtilization {
  /** Project-relative day index where day 0 === projectStart. */
  dayIndex: number;
  date: Date;
  pct: number;
  isWorkingDay: boolean;
}

export interface ResourceUtilization {
  resourceId: string;
  byDay: DailyUtilization[];
  peakPct: number;
  overAllocDays: number; // count of days where pct > 100
  totalBookedDays: number; // Σ duration × allocation/100 across leaves
}

/**
 * For each day from projectStart..projectFinish, sum the allocation% from
 * every task this resource is assigned to that is active on that day.
 *
 * - "Active" means projectDay falls within [task.start..task.finish] (inclusive)
 * - Summary tasks are skipped (their children are the real bookings)
 * - Non-working days are still computed (allocation extends through weekends)
 *   but flagged so the UI can grey them out.
 */
export function computeResourceUtilization(
  resourceId: string,
  assignments: Map<string, Assignment>,
  tasks: Map<string, Task>,
  schedule: ScheduleResult,
  calendar: Calendar,
): ResourceUtilization {
  const projectStart = schedule.projectStart;
  const projectFinish = schedule.projectFinish;
  const totalDays = Math.max(1, differenceInCalendarDays(projectFinish, projectStart) + 1);

  // Build summary set so we skip rolled-up parents
  const summaryIds = new Set<string>();
  for (const t of tasks.values()) if (t.parentId) summaryIds.add(t.parentId);

  const pcts = new Float32Array(totalDays);

  let totalBookedDays = 0;
  for (const a of assignments.values()) {
    if (a.resourceId !== resourceId) continue;
    if (summaryIds.has(a.taskId)) continue; // rolled-up parents are not real bookings
    const task = tasks.get(a.taskId);
    const sched = schedule.scheduled.get(a.taskId);
    if (!task || !sched || sched.inCycle) continue;

    const startIdx = differenceInCalendarDays(sched.start, projectStart);
    const finishIdx = differenceInCalendarDays(sched.finish, projectStart);
    for (let i = Math.max(0, startIdx); i <= Math.min(totalDays - 1, finishIdx); i++) {
      pcts[i] += a.allocationPct;
    }
    // Booked days = working-day-effort × allocation
    const dur = task.durationDays > 0 ? task.durationDays : 1;
    totalBookedDays += dur * (a.allocationPct / 100);
  }

  let peakPct = 0;
  let overAllocDays = 0;
  const byDay: DailyUtilization[] = new Array(totalDays);
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(projectStart, i);
    const wd = isWorkingDay(date, calendar);
    const pct = wd ? pcts[i] : 0; // ignore over-alloc on non-working days
    if (pct > peakPct) peakPct = pct;
    if (wd && pct > 100) overAllocDays++;
    byDay[i] = { dayIndex: i, date, pct, isWorkingDay: wd };
  }

  return {
    resourceId,
    byDay,
    peakPct,
    overAllocDays,
    totalBookedDays,
  };
}

/**
 * Compute utilization for every resource in a single pass.
 * Returns a map of resourceId → ResourceUtilization.
 */
export function computeAllUtilization(
  resources: Map<string, Resource>,
  assignments: Map<string, Assignment>,
  tasks: Map<string, Task>,
  schedule: ScheduleResult,
  calendar: Calendar,
): Map<string, ResourceUtilization> {
  const out = new Map<string, ResourceUtilization>();
  for (const id of resources.keys()) {
    out.set(id, computeResourceUtilization(id, assignments, tasks, schedule, calendar));
  }
  return out;
}
