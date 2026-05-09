import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useProjectStore } from '../projectStore';

const get = () => useProjectStore.getState();

beforeEach(() => {
  useProjectStore.getState().reset();
});

afterEach(() => {
  useProjectStore.getState().reset();
});

describe('projectStore — tasks', () => {
  it('addTask appends to taskOrder and recalculates schedule', () => {
    const id = get().addTask();
    expect(get().tasks.has(id)).toBe(true);
    expect(get().taskOrder).toEqual([id]);
    expect(get().schedule.scheduled.get(id)).toBeDefined();
  });

  it('addTask after a sibling inserts directly after it', () => {
    const a = get().addTask();
    const b = get().addTask();
    const c = get().addTask(a);
    expect(get().taskOrder).toEqual([a, c, b]);
  });

  it('updateTask flips milestone flag based on duration', () => {
    const id = get().addTask(undefined, { durationDays: 3 });
    expect(get().tasks.get(id)!.isMilestone).toBe(false);
    get().updateTask(id, { durationDays: 0 });
    expect(get().tasks.get(id)!.isMilestone).toBe(true);
  });

  it('deleteTask removes the task, dependencies, and assignments', () => {
    const a = get().addTask();
    const b = get().addTask();
    get().addDependency(a, b);
    const r = get().addResource();
    const asn = get().assignResource(b, r);
    expect(asn).toBeDefined();
    get().deleteTask(b);
    expect(get().tasks.has(b)).toBe(false);
    expect([...get().dependencies.values()].some(d => d.successorId === b)).toBe(false);
    expect([...get().assignments.values()].some(a2 => a2.taskId === b)).toBe(false);
  });

  it('duplicateTask copies a task with " (copy)" suffix', () => {
    const id = get().addTask(undefined, { name: 'Original' });
    const copyId = get().duplicateTask(id)!;
    expect(get().tasks.get(copyId)!.name).toBe('Original (copy)');
    // Original immediately followed by the copy
    expect(get().taskOrder.indexOf(copyId)).toBe(get().taskOrder.indexOf(id) + 1);
  });

  it('duplicateTask returns undefined for unknown id', () => {
    expect(get().duplicateTask('nope')).toBeUndefined();
  });

  it('moveTask reorders adjacent siblings up/down', () => {
    const a = get().addTask();
    const b = get().addTask();
    const c = get().addTask();
    get().moveTask(c, 'up');
    expect(get().taskOrder).toEqual([a, c, b]);
    get().moveTask(a, 'down');
    expect(get().taskOrder).toEqual([c, a, b]);
  });

  it('moveTask is a no-op at the boundary', () => {
    const a = get().addTask();
    const b = get().addTask();
    get().moveTask(a, 'up'); // already first
    expect(get().taskOrder).toEqual([a, b]);
    get().moveTask(b, 'down'); // already last
    expect(get().taskOrder).toEqual([a, b]);
  });

  it('indentTask sets parentId to the previous sibling', () => {
    const a = get().addTask();
    const b = get().addTask();
    get().indentTask(b);
    expect(get().tasks.get(b)!.parentId).toBe(a);
  });

  it('indentTask is a no-op for the very first task', () => {
    const a = get().addTask();
    get().indentTask(a);
    expect(get().tasks.get(a)!.parentId).toBeUndefined();
  });

  it('outdentTask promotes one level toward the root', () => {
    const a = get().addTask();
    const b = get().addTask();
    get().indentTask(b);
    expect(get().tasks.get(b)!.parentId).toBe(a);
    get().outdentTask(b);
    expect(get().tasks.get(b)!.parentId).toBeUndefined();
  });

  it('insertTask without an anchor appends to the end', () => {
    const a = get().addTask();
    const b = get().insertTask(null);
    expect(get().taskOrder).toEqual([a, b]);
  });

  it('insertTask with placement: child sets the parentId and promotes a milestone', () => {
    const parent = get().addTask(undefined, { durationDays: 0, isMilestone: true });
    expect(get().tasks.get(parent)!.isMilestone).toBe(true);
    const child = get().insertTask({ id: parent, placement: 'child' });
    expect(get().tasks.get(child)!.parentId).toBe(parent);
    // Parent gets demoted from milestone
    expect(get().tasks.get(parent)!.isMilestone).toBe(false);
    expect(get().tasks.get(parent)!.durationDays).toBeGreaterThan(0);
  });

  it('insertTask with placement: before puts the new row above the anchor', () => {
    const a = get().addTask();
    const b = get().addTask();
    const before = get().insertTask({ id: b, placement: 'before' });
    expect(get().taskOrder).toEqual([a, before, b]);
  });

  it('insertTask with placement: after skips past the anchor’s descendants', () => {
    const a = get().addTask();
    const child = get().insertTask({ id: a, placement: 'child' });
    const after = get().insertTask({ id: a, placement: 'after' });
    expect(get().taskOrder).toEqual([a, child, after]);
  });

  it('moveTaskToPosition rejects making a task its own descendant', () => {
    const a = get().addTask();
    const b = get().insertTask({ id: a, placement: 'child' });
    // Try to make `a` a child of `b` (its own descendant) — should be a no-op
    get().moveTaskToPosition(a, 0, b);
    expect(get().tasks.get(a)!.parentId).toBeUndefined();
  });
});

describe('projectStore — dependencies', () => {
  it('addDependency rejects self-loops', () => {
    const a = get().addTask();
    expect(get().addDependency(a, a)).toBeUndefined();
    expect(get().dependencies.size).toBe(0);
  });

  it('addDependency rejects duplicate predecessor/successor pairs', () => {
    const a = get().addTask();
    const b = get().addTask();
    const first = get().addDependency(a, b);
    const second = get().addDependency(a, b);
    expect(first).toBeDefined();
    expect(second).toBeUndefined();
  });

  it('addDependency reverts the successor to auto schedule mode', () => {
    const a = get().addTask();
    const b = get().addTask();
    get().updateTask(b, { scheduleMode: 'manual', manualStart: new Date(2030, 0, 1) });
    get().addDependency(a, b);
    expect(get().tasks.get(b)!.scheduleMode).toBe('auto');
    expect(get().tasks.get(b)!.manualStart).toBeUndefined();
  });

  it('updateDependency mutates type/lag and reverts successor to auto', () => {
    const a = get().addTask();
    const b = get().addTask();
    const id = get().addDependency(a, b)!;
    get().updateTask(b, { scheduleMode: 'manual' });
    get().updateDependency(id, { type: 'SS', lagDays: 2 });
    const dep = get().dependencies.get(id)!;
    expect(dep.type).toBe('SS');
    expect(dep.lagDays).toBe(2);
    expect(get().tasks.get(b)!.scheduleMode).toBe('auto');
  });

  it('deleteDependency removes the entry', () => {
    const a = get().addTask();
    const b = get().addTask();
    const id = get().addDependency(a, b)!;
    get().deleteDependency(id);
    expect(get().dependencies.has(id)).toBe(false);
  });

  it('setPredecessors replaces all incoming deps for the successor', () => {
    const a = get().addTask();
    const b = get().addTask();
    const c = get().addTask();
    get().addDependency(a, c);
    get().setPredecessors(c, [{ predecessorId: b, type: 'FS', lagDays: 1 }]);
    const incoming = [...get().dependencies.values()].filter(d => d.successorId === c);
    expect(incoming).toHaveLength(1);
    expect(incoming[0].predecessorId).toBe(b);
    expect(incoming[0].lagDays).toBe(1);
  });

  it('setPredecessors filters out unknown predecessor ids', () => {
    const a = get().addTask();
    get().setPredecessors(a, [{ predecessorId: 'GHOST', type: 'FS', lagDays: 0 }]);
    expect([...get().dependencies.values()].filter(d => d.successorId === a)).toHaveLength(0);
  });

  it('setPredecessors filters out self-references', () => {
    const a = get().addTask();
    get().setPredecessors(a, [{ predecessorId: a, type: 'FS', lagDays: 0 }]);
    expect([...get().dependencies.values()]).toHaveLength(0);
  });
});

describe('projectStore — collapse / expand', () => {
  it('toggleCollapsed flips membership in the collapsed set', () => {
    const a = get().addTask();
    get().toggleCollapsed(a);
    expect(get().collapsed.has(a)).toBe(true);
    get().toggleCollapsed(a);
    expect(get().collapsed.has(a)).toBe(false);
  });

  it('expandAll clears the collapsed set', () => {
    const a = get().addTask();
    get().toggleCollapsed(a);
    get().expandAll();
    expect(get().collapsed.size).toBe(0);
  });

  it('collapseAll collapses every summary task', () => {
    const parent = get().addTask();
    get().insertTask({ id: parent, placement: 'child' });
    get().collapseAll();
    expect(get().collapsed.has(parent)).toBe(true);
  });
});

describe('projectStore — resources & assignments', () => {
  it('addResource gets sane defaults', () => {
    const id = get().addResource();
    const r = get().resources.get(id)!;
    expect(r.defaultAllocationPct).toBe(100);
    expect(r.code).toMatch(/^R\d+$/);
  });

  it('updateResource mutates only the provided fields', () => {
    const id = get().addResource();
    get().updateResource(id, { name: 'Alice' });
    expect(get().resources.get(id)!.name).toBe('Alice');
  });

  it('deleteResource cascades into assignments', () => {
    const t = get().addTask();
    const r = get().addResource();
    get().assignResource(t, r);
    get().deleteResource(r);
    expect(get().resources.has(r)).toBe(false);
    expect([...get().assignments.values()].length).toBe(0);
  });

  it('assignResource clamps allocation to [0, 100]', () => {
    const t = get().addTask();
    const r = get().addResource();
    const id = get().assignResource(t, r, 250)!;
    expect(get().assignments.get(id)!.allocationPct).toBe(100);
  });

  it('assignResource rejects unknown task or resource', () => {
    expect(get().assignResource('GHOST', 'GHOST')).toBeUndefined();
  });

  it('assignResource rejects duplicate task↔resource pairs', () => {
    const t = get().addTask();
    const r = get().addResource();
    expect(get().assignResource(t, r)).toBeDefined();
    expect(get().assignResource(t, r)).toBeUndefined();
  });

  it('updateAssignment clamps allocation', () => {
    const t = get().addTask();
    const r = get().addResource();
    const id = get().assignResource(t, r)!;
    get().updateAssignment(id, { allocationPct: 200 });
    expect(get().assignments.get(id)!.allocationPct).toBe(100);
  });

  it('unassignResource removes the assignment', () => {
    const t = get().addTask();
    const r = get().addResource();
    const id = get().assignResource(t, r)!;
    get().unassignResource(id);
    expect(get().assignments.has(id)).toBe(false);
  });
});

describe('projectStore — selection / UI', () => {
  it('setSelection opens the inspector when there is at least one item', () => {
    const a = get().addTask();
    get().setSelection([a]);
    expect(get().selection.has(a)).toBe(true);
    expect(get().inspectorOpen).toBe(true);
  });

  it('clearSelection closes the inspector', () => {
    get().setSelection([get().addTask()]);
    get().clearSelection();
    expect(get().selection.size).toBe(0);
    expect(get().inspectorOpen).toBe(false);
  });

  it('toggleSelection in additive mode toggles individual ids', () => {
    const a = get().addTask();
    const b = get().addTask();
    get().toggleSelection(a, true);
    get().toggleSelection(b, true);
    expect(get().selection.size).toBe(2);
    get().toggleSelection(a, true);
    expect(get().selection.has(a)).toBe(false);
    expect(get().selection.has(b)).toBe(true);
  });

  it('toggleSelection in single mode replaces previous selection', () => {
    const a = get().addTask();
    const b = get().addTask();
    get().toggleSelection(a);
    get().toggleSelection(b);
    expect(get().selection.has(a)).toBe(false);
    expect(get().selection.has(b)).toBe(true);
  });

  it('zoom and view setters update state', () => {
    get().setZoom('day');
    get().setView('resources');
    expect(get().zoom).toBe('day');
    expect(get().view).toBe('resources');
  });

  it('toggleCriticalPath flips the boolean', () => {
    const before = get().showCriticalPath;
    get().toggleCriticalPath();
    expect(get().showCriticalPath).toBe(!before);
  });

  it('inspector / command / cheatsheet / template-picker open setters work', () => {
    get().setInspectorOpen(true);
    get().setCommandOpen(true);
    get().setCheatsheetOpen(true);
    get().setTemplatePickerOpen(false);
    expect(get().inspectorOpen).toBe(true);
    expect(get().commandOpen).toBe(true);
    expect(get().cheatsheetOpen).toBe(true);
    expect(get().templatePickerOpen).toBe(false);
  });
});

describe('projectStore — project ops', () => {
  it('shiftProject moves manual starts and constraint dates', () => {
    const id = get().addTask(undefined, {
      scheduleMode: 'manual',
      manualStart: new Date(2026, 4, 4),
    });
    get().updateTask(id, {
      constraint: { kind: 'SNET', date: new Date(2026, 4, 4) },
    });
    const before = get().project.start.getTime();
    get().shiftProject(7);
    expect(get().project.start.getTime()).toBe(before + 7 * 86400_000);
    const t = get().tasks.get(id)!;
    expect(t.manualStart!.getDate()).toBe(11);
  });

  it('shiftProject is a no-op for delta 0', () => {
    const before = get().project.start.getTime();
    get().shiftProject(0);
    expect(get().project.start.getTime()).toBe(before);
  });

  it('bulkShift converts tasks to manual and shifts each anchor', () => {
    const a = get().addTask();
    get().bulkShift([a], 3);
    const t = get().tasks.get(a)!;
    expect(t.scheduleMode).toBe('manual');
    expect(t.manualStart).toBeDefined();
  });

  it('bulkShift is a no-op for delta 0', () => {
    const a = get().addTask();
    get().bulkShift([a], 0);
    expect(get().tasks.get(a)!.scheduleMode).toBe('auto');
  });

  it('setProjectName updates the project meta name', () => {
    get().setProjectName('Apollo');
    expect(get().project.name).toBe('Apollo');
  });
});

describe('projectStore — undo / redo', () => {
  it('undo reverts the last domain mutation', () => {
    const a = get().addTask();
    get().undo();
    expect(get().tasks.has(a)).toBe(false);
  });

  it('redo replays a previously undone mutation', () => {
    const a = get().addTask();
    get().undo();
    get().redo();
    expect(get().tasks.has(a)).toBe(true);
  });

  it('undo with empty history is a no-op', () => {
    get().undo();
    expect(get().tasks.size).toBe(0);
  });

  it('redo with empty future is a no-op', () => {
    get().redo();
    expect(get().tasks.size).toBe(0);
  });
});

describe('projectStore — bulk', () => {
  it('loadProject overwrites tasks and recomputes the schedule', () => {
    const start = new Date(2026, 4, 4);
    get().loadProject({
      project: { id: 'p', name: 'X', start },
      tasks: new Map([
        [
          't1',
          {
            id: 't1',
            name: 'T',
            durationDays: 2,
            scheduleMode: 'auto',
            constraint: { kind: 'ASAP' },
            isMilestone: false,
            progressPct: 0,
          },
        ],
      ]),
      taskOrder: ['t1'],
    });
    expect(get().tasks.size).toBe(1);
    expect(get().schedule.scheduled.get('t1')).toBeDefined();
  });

  it('reset returns to the initial state', () => {
    get().addTask();
    get().reset();
    expect(get().tasks.size).toBe(0);
    expect(get().taskOrder).toEqual([]);
  });
});
