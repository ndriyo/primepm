import type { Dependency, Task } from './types';

export interface AdjacencyMaps {
  /** id → outgoing deps (this task is the predecessor). */
  out: Map<string, Dependency[]>;
  /** id → incoming deps (this task is the successor). */
  in: Map<string, Dependency[]>;
}

export function buildAdjacency(tasks: Map<string, Task>, deps: Map<string, Dependency>): AdjacencyMaps {
  const out = new Map<string, Dependency[]>();
  const inc = new Map<string, Dependency[]>();
  for (const id of tasks.keys()) {
    out.set(id, []);
    inc.set(id, []);
  }
  for (const dep of deps.values()) {
    if (!tasks.has(dep.predecessorId) || !tasks.has(dep.successorId)) continue;
    out.get(dep.predecessorId)!.push(dep);
    inc.get(dep.successorId)!.push(dep);
  }
  return { out, in: inc };
}

/**
 * Detect strongly connected components with size > 1 (cycles), using Tarjan's algorithm.
 * A self-loop (A → A) is also reported as a cycle.
 */
export function detectCycles(adj: AdjacencyMaps): string[][] {
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  let idx = 0;

  const strongconnect = (v: string): void => {
    indices.set(v, idx);
    lowlinks.set(v, idx);
    idx++;
    stack.push(v);
    onStack.add(v);

    for (const dep of adj.out.get(v) ?? []) {
      const w = dep.successorId;
      if (!indices.has(w)) {
        strongconnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
      } else if (onStack.has(w)) {
        lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      const isCycle = scc.length > 1 || (adj.out.get(v) ?? []).some(d => d.successorId === v);
      if (isCycle) cycles.push(scc);
    }
  };

  for (const v of adj.out.keys()) {
    if (!indices.has(v)) strongconnect(v);
  }
  return cycles;
}

/**
 * Topological sort over tasks, ignoring tasks involved in cycles.
 * Uses Kahn's algorithm; predecessors come before successors.
 */
export function topoSort(
  tasks: Map<string, Task>,
  adj: AdjacencyMaps,
  cycleNodes: ReadonlySet<string>,
): string[] {
  const indeg = new Map<string, number>();
  for (const id of tasks.keys()) {
    if (cycleNodes.has(id)) continue;
    indeg.set(id, (adj.in.get(id) ?? []).filter(d => !cycleNodes.has(d.predecessorId)).length);
  }
  const queue: string[] = [];
  for (const [id, n] of indeg) if (n === 0) queue.push(id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const dep of adj.out.get(id) ?? []) {
      const s = dep.successorId;
      if (!indeg.has(s)) continue;
      const next = (indeg.get(s) ?? 0) - 1;
      indeg.set(s, next);
      if (next === 0) queue.push(s);
    }
  }
  return order;
}
