import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet, enablePatches, produceWithPatches, applyPatches, type Patch } from 'immer';
import {
  DEFAULT_CALENDAR,
  recalculate,
  type Calendar,
  type Dependency,
  type DepType,
  type ScheduleResult,
  type Task,
} from '../engine';
import { newId } from '../lib/ids';

enableMapSet();
enablePatches();

export type ZoomLevel = 'day' | 'week' | 'month' | 'quarter';
export type AppView = 'schedule' | 'resources';

export interface ProjectMeta {
  id: string;
  name: string;
  start: Date;
}

/**
 * A person, role, or other booked entity that can be assigned to tasks.
 * `defaultAllocationPct` is their availability *for this project* — e.g. a
 * contractor at 50% FTE this project. Per-task assignments use a separate
 * percentage (`Assignment.allocationPct`).
 */
export interface Resource {
  id: string;
  code: string;
  name: string;
  defaultAllocationPct: number; // 0–100, project-level capacity
  ratePerDay?: number; // currency per working day; default 0 (used by cost breakdown)
  color?: string;
  notes?: string;
}

/**
 * A task ↔ resource link with a per-task allocation percentage. e.g. DEV1
 * assigned 50% to Task 1 means DEV1 spends half their working time on it.
 */
export interface Assignment {
  id: string;
  taskId: string;
  resourceId: string;
  allocationPct: number; // 0–100
}

interface UndoEntry {
  label: string;
  inverse: Patch[];
  redo: Patch[];
}

export interface ProjectState {
  project: ProjectMeta;
  tasks: Map<string, Task>;
  taskOrder: string[]; // explicit display order
  dependencies: Map<string, Dependency>;
  calendar: Calendar;

  resources: Map<string, Resource>;
  resourceOrder: string[];
  assignments: Map<string, Assignment>;

  schedule: ScheduleResult;

  // UI state
  view: AppView;
  selection: Set<string>;
  collapsed: Set<string>;
  zoom: ZoomLevel;
  showCriticalPath: boolean;
  inspectorOpen: boolean;
  commandOpen: boolean;
  cheatsheetOpen: boolean;
  templatePickerOpen: boolean;

  // history
  past: UndoEntry[];
  future: UndoEntry[];
}

export type InsertPlacement = 'after' | 'before' | 'child';

export interface ProjectActions {
  // Tasks
  addTask: (afterId?: string, partial?: Partial<Task>) => string;
  insertTask: (
    anchor: { id: string; placement: InsertPlacement } | null,
    partial?: Partial<Task>,
  ) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => string | undefined;
  moveTask: (id: string, direction: 'up' | 'down') => void;
  moveTaskToPosition: (taskId: string, newIndex: number, newParentId?: string) => void;
  indentTask: (id: string) => void;
  outdentTask: (id: string) => void;

  // Dependencies
  addDependency: (
    predecessorId: string,
    successorId: string,
    type?: DepType,
    lagDays?: number,
  ) => string | undefined;
  updateDependency: (id: string, patch: Partial<Dependency>) => void;
  deleteDependency: (id: string) => void;
  setPredecessors: (
    successorId: string,
    predecessors: Array<{ predecessorId: string; type: DepType; lagDays: number }>,
  ) => void;

  // Collapse / expand
  toggleCollapsed: (taskId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Resources
  addResource: (partial?: Partial<Omit<Resource, 'id'>>) => string;
  updateResource: (id: string, patch: Partial<Resource>) => void;
  deleteResource: (id: string) => void;

  // Assignments
  assignResource: (taskId: string, resourceId: string, allocationPct?: number) => string | undefined;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
  unassignResource: (assignmentId: string) => void;

  // Selection
  setSelection: (ids: string[]) => void;
  toggleSelection: (id: string, additive?: boolean) => void;
  clearSelection: () => void;

  // Zoom & UI
  setZoom: (z: ZoomLevel) => void;
  setView: (v: AppView) => void;
  toggleCriticalPath: () => void;
  setInspectorOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setCheatsheetOpen: (open: boolean) => void;
  setTemplatePickerOpen: (open: boolean) => void;

  // Project ops
  shiftProject: (days: number) => void;
  bulkShift: (ids: string[], days: number) => void;
  setProjectName: (name: string) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Bulk
  loadProject: (snapshot: Partial<Pick<ProjectState, 'project' | 'tasks' | 'taskOrder' | 'dependencies' | 'calendar' | 'resources' | 'resourceOrder' | 'assignments' | 'collapsed'>>) => void;
  reset: () => void;
}

export type Store = ProjectState & ProjectActions;

const emptySchedule = (start: Date): ScheduleResult => ({
  scheduled: new Map(),
  cycles: [],
  criticalPath: new Set(),
  projectStart: start,
  projectFinish: start,
});

const initialProject = (): ProjectMeta => ({
  id: newId('prj'),
  name: 'Untitled Project',
  start: startOfThisWeek(),
});

function startOfThisWeek(): Date {
  const now = new Date();
  const dow = now.getDay();
  // Monday of this week
  const offset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  return monday;
}

const initialState = (): ProjectState => {
  const project = initialProject();
  return {
    project,
    tasks: new Map(),
    taskOrder: [],
    dependencies: new Map(),
    calendar: DEFAULT_CALENDAR,
    resources: new Map(),
    resourceOrder: [],
    assignments: new Map(),
    schedule: emptySchedule(project.start),
    view: 'schedule',
    selection: new Set(),
    collapsed: new Set(),
    zoom: 'week',
    showCriticalPath: false,
    inspectorOpen: false,
    commandOpen: false,
    cheatsheetOpen: false,
    templatePickerOpen: true,
    past: [],
    future: [],
  };
};

/**
 * Helper that wraps a domain-mutation block with:
 *   1. Patch capture (for undo).
 *   2. Forced engine recalculation.
 *   3. History trimming to 50.
 */
type DomainState = Pick<ProjectState, 'project' | 'tasks' | 'taskOrder' | 'dependencies' | 'calendar' | 'schedule'>;

function applyDomain<T extends DomainState & { past: UndoEntry[]; future: UndoEntry[] }>(
  state: T,
  label: string,
  mutator: (draft: T) => void,
): T {
  const [next, patches, inverse] = produceWithPatches(state, draft => {
    mutator(draft as T);
    // Always recompute schedule after a domain change.
    (draft as DomainState).schedule = recalculate(
      (draft as DomainState).tasks as Map<string, Task>,
      (draft as DomainState).dependencies as Map<string, Dependency>,
      (draft as DomainState).calendar as Calendar,
      (draft as DomainState).project.start as Date,
    );
  });
  const past = [...next.past, { label, redo: patches, inverse }].slice(-50);
  return { ...next, past, future: [] };
}

export const useProjectStore = create<Store>()(
  immer((set, get) => ({
    ...initialState(),

    addTask: (afterId, partial) => {
      const id = newId('tsk');
      set(state => {
        const task: Task = {
          id,
          name: partial?.name ?? 'New task',
          durationDays: partial?.durationDays ?? 1,
          scheduleMode: partial?.scheduleMode ?? 'auto',
          constraint: partial?.constraint ?? { kind: 'ASAP' },
          isMilestone: partial?.isMilestone ?? false,
          progressPct: partial?.progressPct ?? 0,
          parentId: partial?.parentId,
          notes: partial?.notes,
          color: partial?.color,
          manualStart: partial?.manualStart,
        };
        const next = applyDomain(state, 'Add task', d => {
          d.tasks.set(id, task);
          if (afterId && d.taskOrder.includes(afterId)) {
            const idx = d.taskOrder.indexOf(afterId);
            d.taskOrder.splice(idx + 1, 0, id);
          } else {
            d.taskOrder.push(id);
          }
        });
        Object.assign(state, next);
      });
      return id;
    },

    insertTask: (anchor, partial) => {
      const id = newId('tsk');
      set(state => {
        const next = applyDomain(state, 'Insert task', d => {
          const baseTask: Task = {
            id,
            name: partial?.name ?? 'New task',
            durationDays: partial?.durationDays ?? 1,
            scheduleMode: partial?.scheduleMode ?? 'auto',
            constraint: partial?.constraint ?? { kind: 'ASAP' },
            isMilestone: partial?.isMilestone ?? false,
            progressPct: partial?.progressPct ?? 0,
            parentId: partial?.parentId,
            notes: partial?.notes,
            color: partial?.color,
            manualStart: partial?.manualStart,
          };
          if (!anchor) {
            d.tasks.set(id, baseTask);
            d.taskOrder.push(id);
            return;
          }
          const anchorTask = d.tasks.get(anchor.id);
          if (!anchorTask) {
            d.tasks.set(id, baseTask);
            d.taskOrder.push(id);
            return;
          }
          const anchorIdx = d.taskOrder.indexOf(anchor.id);
          let insertIdx: number;
          let parentId: string | undefined;
          switch (anchor.placement) {
            case 'before':
              insertIdx = anchorIdx;
              parentId = anchorTask.parentId;
              break;
            case 'after':
              // Skip past the entire descendant block of the anchor so we
              // insert at the same level.
              insertIdx = anchorIdx + 1;
              while (insertIdx < d.taskOrder.length) {
                const next = d.tasks.get(d.taskOrder[insertIdx]);
                if (isDescendant(next, anchor.id, d.tasks)) insertIdx++;
                else break;
              }
              parentId = anchorTask.parentId;
              break;
            case 'child':
              insertIdx = anchorIdx + 1;
              parentId = anchor.id;
              break;
          }
          const finalParentId = partial?.parentId ?? parentId;
          d.tasks.set(id, { ...baseTask, parentId: finalParentId });
          d.taskOrder.splice(insertIdx, 0, id);
          if (finalParentId) promoteFromMilestone(d.tasks, finalParentId);
        });
        Object.assign(state, next);
      });
      return id;
    },

    duplicateTask: id => {
      const orig = get().tasks.get(id);
      if (!orig) return undefined;
      const newTaskId = newId('tsk');
      set(state => {
        const next = applyDomain(state, 'Duplicate task', d => {
          const copy: Task = {
            ...orig,
            id: newTaskId,
            name: `${orig.name} (copy)`,
            progressPct: 0,
          };
          d.tasks.set(newTaskId, copy);
          const idx = d.taskOrder.indexOf(id);
          d.taskOrder.splice(idx + 1, 0, newTaskId);
        });
        Object.assign(state, next);
      });
      return newTaskId;
    },

    moveTaskToPosition: (taskId, newIndex, newParentId) => {
      set(state => {
        const next = applyDomain(state, 'Move task', d => {
          const task = d.tasks.get(taskId);
          if (!task) return;
          // Avoid making yourself a descendant of yourself
          if (newParentId) {
            let p: string | undefined = newParentId;
            while (p) {
              if (p === taskId) return;
              p = d.tasks.get(p)?.parentId;
            }
          }
          // Collect this task plus all descendants, in their current order
          const block: string[] = [];
          const collect = (rootId: string) => {
            const idx = d.taskOrder.indexOf(rootId);
            if (idx === -1) return;
            block.push(rootId);
            for (let i = idx + 1; i < d.taskOrder.length; i++) {
              const t = d.tasks.get(d.taskOrder[i]);
              if (!t) break;
              if (isDescendant(t, rootId, d.tasks)) block.push(t.id);
              else break;
            }
          };
          collect(taskId);
          const blockSet = new Set(block);
          // Compute clamp index in the order WITH the block removed
          const filtered = d.taskOrder.filter(o => !blockSet.has(o));
          // Adjust newIndex because removing the block could shift it
          const origIdx = d.taskOrder.indexOf(taskId);
          const adjustedIndex = newIndex > origIdx ? newIndex - block.length : newIndex;
          const insertAt = Math.max(0, Math.min(filtered.length, adjustedIndex));
          filtered.splice(insertAt, 0, ...block);
          d.taskOrder = filtered;
          task.parentId = newParentId;
          if (newParentId) promoteFromMilestone(d.tasks, newParentId);
        });
        Object.assign(state, next);
      });
    },

    updateTask: (id, patch) => {
      set(state => {
        const next = applyDomain(state, 'Update task', d => {
          const t = d.tasks.get(id);
          if (!t) return;
          Object.assign(t, patch);
          if (patch.durationDays !== undefined) {
            t.isMilestone = patch.durationDays === 0;
          }
        });
        Object.assign(state, next);
      });
    },

    deleteTask: id => {
      set(state => {
        const next = applyDomain(state, 'Delete task', d => {
          d.tasks.delete(id);
          d.taskOrder = d.taskOrder.filter(x => x !== id);
          // Remove child references
          for (const t of d.tasks.values()) {
            if (t.parentId === id) t.parentId = undefined;
          }
          // Remove dependencies touching this task
          for (const [depId, dep] of d.dependencies) {
            if (dep.predecessorId === id || dep.successorId === id) {
              d.dependencies.delete(depId);
            }
          }
        });
        Object.assign(state, next);
        // Cascade: remove assignments for this task (UI state, not in patch buffer)
        for (const [aid, a] of [...state.assignments]) {
          if (a.taskId === id) state.assignments.delete(aid);
        }
        state.selection.delete(id);
      });
    },

    moveTask: (id, direction) => {
      set(state => {
        const next = applyDomain(state, 'Reorder task', d => {
          const idx = d.taskOrder.indexOf(id);
          if (idx === -1) return;
          const swap = direction === 'up' ? idx - 1 : idx + 1;
          if (swap < 0 || swap >= d.taskOrder.length) return;
          [d.taskOrder[idx], d.taskOrder[swap]] = [d.taskOrder[swap], d.taskOrder[idx]];
        });
        Object.assign(state, next);
      });
    },

    indentTask: id => {
      set(state => {
        const next = applyDomain(state, 'Indent task', d => {
          const idx = d.taskOrder.indexOf(id);
          if (idx <= 0) return;
          const t = d.tasks.get(id);
          if (!t) return;
          // New parent = previous sibling at same level (simple model: prior task)
          const prevId = d.taskOrder[idx - 1];
          const prev = d.tasks.get(prevId);
          if (!prev) return;
          // Avoid making yourself an ancestor of your own parent
          let p: string | undefined = prev.parentId;
          while (p) {
            if (p === id) return;
            p = d.tasks.get(p)?.parentId;
          }
          t.parentId = prevId;
          promoteFromMilestone(d.tasks, prevId);
        });
        Object.assign(state, next);
      });
    },

    outdentTask: id => {
      set(state => {
        const next = applyDomain(state, 'Outdent task', d => {
          const t = d.tasks.get(id);
          if (!t || !t.parentId) return;
          const parent = d.tasks.get(t.parentId);
          t.parentId = parent?.parentId;
        });
        Object.assign(state, next);
      });
    },

    addDependency: (predecessorId, successorId, type = 'FS', lagDays = 0) => {
      if (predecessorId === successorId) return undefined;
      const id = newId('dep');
      let created: string | undefined = id;
      set(state => {
        // Reject duplicates
        for (const dep of state.dependencies.values()) {
          if (dep.predecessorId === predecessorId && dep.successorId === successorId) {
            created = undefined;
            return;
          }
        }
        const next = applyDomain(state, 'Add dependency', d => {
          d.dependencies.set(id, { id, predecessorId, successorId, type, lagDays });
          // Wiring a dependency means the user wants the successor to follow
          // the predecessor — flip it back to auto so the engine actually moves it.
          revertToAuto(d.tasks, successorId);
        });
        Object.assign(state, next);
      });
      return created;
    },

    updateDependency: (id, patch) => {
      set(state => {
        const next = applyDomain(state, 'Update dependency', d => {
          const dep = d.dependencies.get(id);
          if (!dep) return;
          Object.assign(dep, patch);
          revertToAuto(d.tasks, dep.successorId);
        });
        Object.assign(state, next);
      });
    },

    deleteDependency: id => {
      set(state => {
        const next = applyDomain(state, 'Delete dependency', d => {
          d.dependencies.delete(id);
        });
        Object.assign(state, next);
      });
    },

    setPredecessors: (successorId, predecessors) => {
      set(state => {
        const next = applyDomain(state, 'Edit predecessors', d => {
          // Remove all incoming deps
          for (const [id, dep] of [...d.dependencies]) {
            if (dep.successorId === successorId) d.dependencies.delete(id);
          }
          // Add new
          for (const pred of predecessors) {
            if (!d.tasks.has(pred.predecessorId)) continue;
            if (pred.predecessorId === successorId) continue;
            const id = newId('dep');
            d.dependencies.set(id, {
              id,
              predecessorId: pred.predecessorId,
              successorId,
              type: pred.type,
              lagDays: pred.lagDays,
            });
          }
          if (predecessors.length > 0) revertToAuto(d.tasks, successorId);
        });
        Object.assign(state, next);
      });
    },

    toggleCollapsed: taskId => {
      set(state => {
        if (state.collapsed.has(taskId)) state.collapsed.delete(taskId);
        else state.collapsed.add(taskId);
      });
    },

    expandAll: () => {
      set(state => { state.collapsed = new Set(); });
    },

    collapseAll: () => {
      set(state => {
        const all = new Set<string>();
        for (const t of state.tasks.values()) {
          // a task is a summary if any other task has it as parent
          for (const child of state.tasks.values()) {
            if (child.parentId === t.id) { all.add(t.id); break; }
          }
        }
        state.collapsed = all;
      });
    },

    setSelection: ids => {
      set(state => {
        state.selection = new Set(ids);
        state.inspectorOpen = ids.length > 0;
      });
    },

    toggleSelection: (id, additive = false) => {
      set(state => {
        if (additive) {
          if (state.selection.has(id)) state.selection.delete(id);
          else state.selection.add(id);
        } else {
          state.selection = new Set([id]);
        }
        state.inspectorOpen = state.selection.size > 0;
      });
    },

    clearSelection: () => set(state => { state.selection.clear(); state.inspectorOpen = false; }),

    addResource: partial => {
      const id = newId('res');
      set(state => {
        const r: Resource = {
          id,
          code: partial?.code ?? `R${state.resources.size + 1}`,
          name: partial?.name ?? 'New resource',
          defaultAllocationPct: partial?.defaultAllocationPct ?? 100,
          ratePerDay: partial?.ratePerDay ?? 0,
          color: partial?.color,
          notes: partial?.notes,
        };
        state.resources.set(id, r);
        state.resourceOrder.push(id);
      });
      return id;
    },

    updateResource: (id, patch) => {
      set(state => {
        const r = state.resources.get(id);
        if (!r) return;
        Object.assign(r, patch);
      });
    },

    deleteResource: id => {
      set(state => {
        state.resources.delete(id);
        state.resourceOrder = state.resourceOrder.filter(r => r !== id);
        // Cascade — remove all assignments referencing this resource
        for (const [aid, a] of [...state.assignments]) {
          if (a.resourceId === id) state.assignments.delete(aid);
        }
      });
    },

    assignResource: (taskId, resourceId, allocationPct = 100) => {
      const cur = get();
      if (!cur.tasks.has(taskId) || !cur.resources.has(resourceId)) return undefined;
      // Reject duplicates
      for (const a of cur.assignments.values()) {
        if (a.taskId === taskId && a.resourceId === resourceId) return undefined;
      }
      const id = newId('asn');
      set(state => {
        state.assignments.set(id, {
          id,
          taskId,
          resourceId,
          allocationPct: Math.max(0, Math.min(100, allocationPct)),
        });
      });
      return id;
    },

    updateAssignment: (id, patch) => {
      set(state => {
        const a = state.assignments.get(id);
        if (!a) return;
        Object.assign(a, patch);
        if (patch.allocationPct !== undefined) {
          a.allocationPct = Math.max(0, Math.min(100, patch.allocationPct));
        }
      });
    },

    unassignResource: id => {
      set(state => {
        state.assignments.delete(id);
      });
    },

    setZoom: z => set(state => { state.zoom = z; }),
    setView: v => set(state => { state.view = v; }),
    toggleCriticalPath: () => set(state => { state.showCriticalPath = !state.showCriticalPath; }),
    setInspectorOpen: open => set(state => { state.inspectorOpen = open; }),
    setCommandOpen: open => set(state => { state.commandOpen = open; }),
    setCheatsheetOpen: open => set(state => { state.cheatsheetOpen = open; }),
    setTemplatePickerOpen: open => set(state => { state.templatePickerOpen = open; }),

    shiftProject: days => {
      if (!days) return;
      set(state => {
        const next = applyDomain(state, days > 0 ? 'Shift project later' : 'Shift project earlier', d => {
          d.project.start = addDays(d.project.start, days);
          for (const t of d.tasks.values()) {
            if (t.scheduleMode === 'manual' && t.manualStart) {
              t.manualStart = addDays(t.manualStart, days);
            }
            if (t.constraint.kind !== 'ASAP') {
              t.constraint = { ...t.constraint, date: addDays(t.constraint.date, days) };
            }
          }
        });
        Object.assign(state, next);
      });
    },

    bulkShift: (ids, days) => {
      if (!days) return;
      set(state => {
        const next = applyDomain(state, 'Shift selected', d => {
          for (const id of ids) {
            const t = d.tasks.get(id);
            if (!t) continue;
            const sched = state.schedule.scheduled.get(id);
            const anchor = t.manualStart ?? sched?.start ?? d.project.start;
            t.scheduleMode = 'manual';
            t.manualStart = addDays(anchor, days);
          }
        });
        Object.assign(state, next);
      });
    },

    setProjectName: name => {
      set(state => {
        state.project.name = name;
      });
    },

    undo: () => {
      set(state => {
        const entry = state.past[state.past.length - 1];
        if (!entry) return;
        const reverted = applyPatches(state, entry.inverse);
        Object.assign(state, reverted);
        state.past = state.past.slice(0, -1);
        state.future = [...state.future, entry];
        // Rebuild schedule (patches don't recompute it).
        state.schedule = recalculate(state.tasks, state.dependencies, state.calendar, state.project.start);
      });
    },

    redo: () => {
      set(state => {
        const entry = state.future[state.future.length - 1];
        if (!entry) return;
        const advanced = applyPatches(state, entry.redo);
        Object.assign(state, advanced);
        state.future = state.future.slice(0, -1);
        state.past = [...state.past, entry];
        state.schedule = recalculate(state.tasks, state.dependencies, state.calendar, state.project.start);
      });
    },

    loadProject: snapshot => {
      set(state => {
        if (snapshot.project) state.project = snapshot.project;
        if (snapshot.tasks) state.tasks = new Map(snapshot.tasks);
        if (snapshot.taskOrder) state.taskOrder = [...snapshot.taskOrder];
        if (snapshot.dependencies) state.dependencies = new Map(snapshot.dependencies);
        if (snapshot.calendar) state.calendar = snapshot.calendar;
        state.resources = snapshot.resources ? new Map(snapshot.resources) : new Map();
        state.resourceOrder = snapshot.resourceOrder ? [...snapshot.resourceOrder] : [];
        state.assignments = snapshot.assignments ? new Map(snapshot.assignments) : new Map();
        state.selection = new Set();
        state.collapsed = snapshot.collapsed ? new Set(snapshot.collapsed) : new Set();
        state.past = [];
        state.future = [];
        state.templatePickerOpen = false;
        state.schedule = recalculate(state.tasks, state.dependencies, state.calendar, state.project.start);
      });
    },

    reset: () => {
      set(state => {
        const fresh = initialState();
        Object.assign(state, fresh);
      });
      void get;
    },
  })),
);

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isDescendant(
  task: { parentId?: string } | undefined,
  ancestorId: string,
  tasks: Map<string, { parentId?: string }>,
): boolean {
  let cur = task;
  while (cur && cur.parentId) {
    if (cur.parentId === ancestorId) return true;
    cur = tasks.get(cur.parentId);
  }
  return false;
}

/**
 * Called when a task gains a child. If it was a milestone, demote it to a
 * regular task so it can carry a span — its bar will then auto-roll up to the
 * union of its children's spans (handled by the engine's rollUpSummaries).
 */
function promoteFromMilestone(tasks: Map<string, Task>, parentId: string): void {
  const parent = tasks.get(parentId);
  if (!parent) return;
  if (parent.isMilestone || parent.durationDays === 0) {
    parent.isMilestone = false;
    if (parent.durationDays === 0) parent.durationDays = 1;
  }
}

/**
 * Called when a dependency is wired in/out of a task — flip the successor back
 * to auto-schedule so the engine actually shifts it. A previous drag or Start
 * cell edit may have pinned the task to a manual date that would otherwise
 * silently override the dependency.
 *
 * Explicit Constraints (SNET, MSO, etc.) are left intact — those are durable
 * intent, manual mode is usually accidental from a drag.
 */
function revertToAuto(tasks: Map<string, Task>, taskId: string): void {
  const t = tasks.get(taskId);
  if (!t) return;
  t.scheduleMode = 'auto';
  t.manualStart = undefined;
}
