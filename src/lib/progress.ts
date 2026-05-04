import type { Task } from '../engine';

/**
 * Parse a free-form progress entry into a 0–100 integer percent.
 * Accepts "75", "75%", "0.75" (treated as fraction), "  50  ", "100%".
 * Returns null if unparseable.
 */
export function parseProgress(input: string): number | null {
  const trimmed = input.trim().replace('%', '');
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  // Treat 0–1 (with decimal) as a fraction: "0.5" → 50%
  const pct = n > 0 && n < 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function formatProgress(pct: number): string {
  return `${Math.round(pct)}%`;
}

/**
 * Compute summary progress for a parent task: a duration-weighted average of
 * its leaf descendants' progress. Milestone leaves count as weight 1.
 *
 *   summaryPct = sum(leaf.duration × leaf.pct/100) / sum(leaf.duration)
 *
 * Walks the descendant tree to find true leaves (tasks with no children).
 * Returns 0 if there are no descendants.
 */
export function computeSummaryProgress(
  parentId: string,
  tasks: Map<string, Task>,
): number {
  // Build a children index once per call (caller should memoize for repeated lookups)
  const childrenOf = new Map<string, string[]>();
  for (const t of tasks.values()) {
    if (t.parentId) {
      const arr = childrenOf.get(t.parentId);
      if (arr) arr.push(t.id);
      else childrenOf.set(t.parentId, [t.id]);
    }
  }
  return summaryProgressWithIndex(parentId, tasks, childrenOf);
}

/**
 * Same as `computeSummaryProgress` but uses a pre-built children index.
 * Use this when computing for many parents in the same render pass.
 */
export function summaryProgressWithIndex(
  parentId: string,
  tasks: Map<string, Task>,
  childrenOf: Map<string, string[]>,
): number {
  let totalWork = 0;
  let doneWork = 0;
  const stack = [parentId];
  while (stack.length) {
    const id = stack.pop()!;
    const kids = childrenOf.get(id);
    if (!kids || kids.length === 0) {
      if (id === parentId) continue; // parent has no descendants — leave at 0
      const leaf = tasks.get(id);
      if (!leaf) continue;
      const w = leaf.durationDays > 0 ? leaf.durationDays : 1;
      totalWork += w;
      doneWork += w * (Math.max(0, Math.min(100, leaf.progressPct)) / 100);
    } else {
      for (const k of kids) stack.push(k);
    }
  }
  if (totalWork === 0) return 0;
  return Math.round((doneWork / totalWork) * 100);
}

/**
 * Build a `Map<taskId, pct>` covering every task — leaves use their own
 * `progressPct`, summaries use the rolled-up value. Use once per render.
 */
export function buildProgressMap(tasks: Map<string, Task>): Map<string, number> {
  const childrenOf = new Map<string, string[]>();
  for (const t of tasks.values()) {
    if (t.parentId) {
      const arr = childrenOf.get(t.parentId);
      if (arr) arr.push(t.id);
      else childrenOf.set(t.parentId, [t.id]);
    }
  }
  const out = new Map<string, number>();
  for (const t of tasks.values()) {
    if (childrenOf.has(t.id)) {
      out.set(t.id, summaryProgressWithIndex(t.id, tasks, childrenOf));
    } else {
      out.set(t.id, Math.max(0, Math.min(100, t.progressPct)));
    }
  }
  return out;
}
