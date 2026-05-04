import { addWorkingDays, computeFinish, computeStartFromFinish, prevWorkingDay, workingDaysBetween } from './calendar';
import type { AdjacencyMaps } from './graph';
import type { Calendar, Dependency, ScheduledTask, Task } from './types';

/**
 * Backward pass: compute Latest Start / Latest Finish from project finish.
 * Slack = LS - ES (in working days). Critical = slack === 0.
 *
 * Walks reverse topo order. Late finish = min over successor relationships.
 */
export function backwardPass(
  topoOrder: string[],
  tasks: Map<string, Task>,
  adj: AdjacencyMaps,
  cal: Calendar,
  projectFinish: Date,
  earliest: Map<string, { start: Date; finish: Date }>,
  scheduled: Map<string, ScheduledTask>,
): void {
  const lateStart = new Map<string, Date>();
  const lateFinish = new Map<string, Date>();

  const reverse = [...topoOrder].reverse();

  const lateFinishFromSucc = (dep: Dependency, succLF: Date, succLS: Date, predDuration: number): Date => {
    switch (dep.type) {
      case 'FS':
        return addWorkingDays(succLS, -(dep.lagDays + 1), cal);
      case 'SS': {
        const predLS = addWorkingDays(succLS, -dep.lagDays, cal);
        return computeFinish(predLS, predDuration, cal);
      }
      case 'FF':
        return addWorkingDays(succLF, -dep.lagDays, cal);
      case 'SF': {
        const predLS = addWorkingDays(succLF, -dep.lagDays, cal);
        return computeFinish(predLS, predDuration, cal);
      }
    }
  };

  for (const id of reverse) {
    const task = tasks.get(id);
    if (!task) continue;
    let lf = projectFinish;
    const outs = adj.out.get(id) ?? [];
    if (outs.length > 0) {
      let candidate: Date | undefined;
      for (const dep of outs) {
        const succLS = lateStart.get(dep.successorId);
        const succLF = lateFinish.get(dep.successorId);
        if (!succLS || !succLF) continue;
        const c = lateFinishFromSucc(dep, succLF, succLS, task.durationDays);
        if (!candidate || c < candidate) candidate = c;
      }
      if (candidate) lf = candidate;
    }
    lf = prevWorkingDay(lf, cal);
    const ls = computeStartFromFinish(lf, task.durationDays, cal);
    lateStart.set(id, ls);
    lateFinish.set(id, lf);

    const e = earliest.get(id);
    const sched = scheduled.get(id);
    if (e && sched) {
      const slack = workingDaysBetween(e.start, ls, cal);
      sched.slack = slack;
      sched.isCritical = slack <= 0;
    }
  }
}
