import { addWorkingDays, computeFinish, computeStartFromFinish, nextWorkingDay } from './calendar';
import type { AdjacencyMaps } from './graph';
import type { Calendar, Dependency, ScheduledTask, Task } from './types';

/**
 * Forward-pass scheduler. Computes earliest start/finish honoring all 4 dependency
 * types + lag, plus constraints (ASAP, SNET, FNET, MSO, MFO).
 *
 * Walks tasks in topological order. For each task:
 * 1. Compute candidate start from each predecessor relationship (FS/SS/FF/SF + lag).
 * 2. Take the latest such candidate (earliest the task can begin without violating any).
 * 3. Apply constraint rules (clamp / pin).
 * 4. Materialize finish = computeFinish(start, duration).
 *
 * Manual-mode tasks honor their `manualStart` regardless of predecessors.
 */
export function forwardPass(
  topoOrder: string[],
  tasks: Map<string, Task>,
  adj: AdjacencyMaps,
  cal: Calendar,
  projectStart: Date,
): Map<string, { start: Date; finish: Date }> {
  const result = new Map<string, { start: Date; finish: Date }>();

  const earliestStartFromDep = (dep: Dependency, predFinish: Date, predStart: Date, succDuration: number): Date => {
    switch (dep.type) {
      // Finish-to-Start: successor starts after predecessor finishes
      case 'FS':
        return addWorkingDays(predFinish, dep.lagDays + 1, cal);
      // Start-to-Start: successor starts when predecessor starts (+ lag)
      case 'SS':
        return addWorkingDays(predStart, dep.lagDays, cal);
      // Finish-to-Finish: successor finishes when predecessor finishes (+ lag), so derive start
      case 'FF': {
        const succFinish = addWorkingDays(predFinish, dep.lagDays, cal);
        return computeStartFromFinish(succFinish, succDuration, cal);
      }
      // Start-to-Finish: successor finishes when predecessor starts (+ lag), so derive start
      case 'SF': {
        const succFinish = addWorkingDays(predStart, dep.lagDays, cal);
        return computeStartFromFinish(succFinish, succDuration, cal);
      }
    }
  };

  for (const id of topoOrder) {
    const task = tasks.get(id);
    if (!task) continue;

    let earliestStart: Date;

    if (task.scheduleMode === 'manual' && task.manualStart) {
      earliestStart = nextWorkingDay(task.manualStart, cal);
    } else {
      // ASAP base = projectStart
      earliestStart = nextWorkingDay(projectStart, cal);
      const incoming = adj.in.get(id) ?? [];
      for (const dep of incoming) {
        const pred = result.get(dep.predecessorId);
        if (!pred) continue;
        const candidate = earliestStartFromDep(dep, pred.finish, pred.start, task.durationDays);
        if (candidate > earliestStart) earliestStart = candidate;
      }
    }

    // Apply constraint
    const c = task.constraint;
    switch (c.kind) {
      case 'ASAP':
        break;
      case 'SNET':
        if (earliestStart < c.date) earliestStart = nextWorkingDay(c.date, cal);
        break;
      case 'FNET': {
        const minFinish = nextWorkingDay(c.date, cal);
        const minStart = computeStartFromFinish(minFinish, task.durationDays, cal);
        if (earliestStart < minStart) earliestStart = minStart;
        break;
      }
      case 'MSO':
        earliestStart = nextWorkingDay(c.date, cal);
        break;
      case 'MFO': {
        const finish = nextWorkingDay(c.date, cal);
        earliestStart = computeStartFromFinish(finish, task.durationDays, cal);
        break;
      }
    }

    earliestStart = nextWorkingDay(earliestStart, cal);
    const finish = computeFinish(earliestStart, task.durationDays, cal);
    result.set(id, { start: earliestStart, finish });
  }

  return result;
}

export function buildScheduledMap(
  forward: Map<string, { start: Date; finish: Date }>,
): Map<string, ScheduledTask> {
  const out = new Map<string, ScheduledTask>();
  for (const [id, { start, finish }] of forward) {
    out.set(id, { id, start, finish, slack: 0, isCritical: false, inCycle: false });
  }
  return out;
}
