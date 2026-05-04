import { backwardPass } from './backwardPass';
import { buildScheduledMap, forwardPass } from './forwardPass';
import { buildAdjacency, detectCycles, topoSort } from './graph';
import type { Calendar, Dependency, ScheduleResult, ScheduledTask, Task } from './types';

/**
 * One-shot scheduler. Pure function — given (tasks, deps, calendar, projectStart),
 * returns a deterministic ScheduleResult.
 *
 * Steps:
 *   1. Build adjacency from deps.
 *   2. Detect cycles (Tarjan SCC). Cycle nodes are flagged but not scheduled.
 *   3. Topological sort over non-cycle nodes.
 *   4. Forward pass → earliest start/finish honoring FS/SS/FF/SF + lag + constraints.
 *   5. Backward pass → late start/finish, slack, critical path.
 */
export function recalculate(
  tasks: Map<string, Task>,
  deps: Map<string, Dependency>,
  calendar: Calendar,
  projectStart: Date,
): ScheduleResult {
  const adj = buildAdjacency(tasks, deps);
  const cycles = detectCycles(adj);
  const cycleNodes = new Set<string>(cycles.flat());

  const order = topoSort(tasks, adj, cycleNodes);
  const earliest = forwardPass(order, tasks, adj, calendar, projectStart);
  const scheduled = buildScheduledMap(earliest);

  // Mark cycle nodes
  for (const id of cycleNodes) {
    scheduled.set(id, {
      id,
      start: projectStart,
      finish: projectStart,
      slack: 0,
      isCritical: false,
      inCycle: true,
    });
  }

  // Project finish = max of all finish dates among scheduled (non-cycle) tasks.
  let projectFinish = projectStart;
  for (const [id, s] of scheduled) {
    if (cycleNodes.has(id)) continue;
    if (s.finish > projectFinish) projectFinish = s.finish;
  }

  backwardPass(order, tasks, adj, calendar, projectFinish, earliest, scheduled);

  // Roll up summary tasks (parent task spans = union of children).
  rollUpSummaries(tasks, scheduled);

  const criticalPath = new Set<string>();
  for (const s of scheduled.values()) {
    if (s.isCritical && !s.inCycle) criticalPath.add(s.id);
  }

  return {
    scheduled,
    cycles,
    criticalPath,
    projectStart,
    projectFinish,
  };
}

/**
 * For tasks that have children (i.e., are summary/parent tasks), set their
 * start = min(children.start) and finish = max(children.finish).
 * Walks bottom-up by computing for each parent only after its descendants.
 */
function rollUpSummaries(tasks: Map<string, Task>, scheduled: Map<string, ScheduledTask>): void {
  const childrenOf = new Map<string, string[]>();
  for (const t of tasks.values()) {
    if (t.parentId) {
      const arr = childrenOf.get(t.parentId) ?? [];
      arr.push(t.id);
      childrenOf.set(t.parentId, arr);
    }
  }
  // Compute depth of each task (root = 0). Then process deepest-first.
  const depthOf = new Map<string, number>();
  const computeDepth = (id: string): number => {
    if (depthOf.has(id)) return depthOf.get(id)!;
    const t = tasks.get(id);
    if (!t || !t.parentId) {
      depthOf.set(id, 0);
      return 0;
    }
    const d = computeDepth(t.parentId) + 1;
    depthOf.set(id, d);
    return d;
  };
  for (const id of tasks.keys()) computeDepth(id);

  const summaries = [...tasks.keys()].filter(id => childrenOf.has(id));
  summaries.sort((a, b) => (depthOf.get(b) ?? 0) - (depthOf.get(a) ?? 0));

  for (const parentId of summaries) {
    const kids = childrenOf.get(parentId) ?? [];
    let earliest: Date | undefined;
    let latest: Date | undefined;
    for (const kid of kids) {
      const s = scheduled.get(kid);
      if (!s || s.inCycle) continue;
      if (!earliest || s.start < earliest) earliest = s.start;
      if (!latest || s.finish > latest) latest = s.finish;
    }
    const cur = scheduled.get(parentId);
    if (earliest && latest && cur) {
      cur.start = earliest;
      cur.finish = latest;
    }
  }
}
