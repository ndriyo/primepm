import type { Task } from '../engine';

/**
 * Derive the rendered task list from the absolute order, hiding any task
 * whose ancestor chain contains a collapsed summary.
 *
 * The absolute index of a task in `taskOrder` is preserved on its row number
 * column ("# 25", "# 31") — collapsing only filters out rows.
 */
export function computeVisibleOrder(
  taskOrder: string[],
  tasks: Map<string, Task>,
  collapsed: Set<string>,
): string[] {
  if (collapsed.size === 0) return taskOrder;
  const result: string[] = [];
  for (const id of taskOrder) {
    let cur = tasks.get(id);
    let hidden = false;
    while (cur && cur.parentId) {
      if (collapsed.has(cur.parentId)) {
        hidden = true;
        break;
      }
      cur = tasks.get(cur.parentId);
    }
    if (!hidden) result.push(id);
  }
  return result;
}
