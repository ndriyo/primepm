import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { useProjectStore } from '../../store/projectStore';
import { Button } from '../ui/Button';
import { X, Trash2, Diamond, GitBranch, IndentIncrease, IndentDecrease, ArrowUp, ArrowDown, Folder, Pin, Users, Plus } from 'lucide-react';
import { workingDaysBetween, type DepType } from '../../engine';
import { formatDuration, parseDuration } from '../../lib/durationFormat';
import { computeSummaryProgress, formatProgress, parseProgress } from '../../lib/progress';
import { useEffect, useMemo, useState } from 'react';

const DEP_TYPES: { value: DepType; label: string; description: string }[] = [
  { value: 'FS', label: 'FS', description: 'Finish → Start (after predecessor finishes)' },
  { value: 'SS', label: 'SS', description: 'Start → Start (in parallel from same start)' },
  { value: 'FF', label: 'FF', description: 'Finish → Finish (must finish together)' },
  { value: 'SF', label: 'SF', description: 'Start → Finish (rare, finish when other starts)' },
];

const TASK_COLORS = ['#38bdf8', '#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#facc15'];

export function TaskInspector() {
  const open = useProjectStore(s => s.inspectorOpen);
  const selection = useProjectStore(s => s.selection);
  const tasks = useProjectStore(s => s.tasks);
  const schedule = useProjectStore(s => s.schedule);
  const dependencies = useProjectStore(s => s.dependencies);
  const updateTask = useProjectStore(s => s.updateTask);
  const updateDep = useProjectStore(s => s.updateDependency);
  const deleteDep = useProjectStore(s => s.deleteDependency);
  const deleteTask = useProjectStore(s => s.deleteTask);
  const indentTask = useProjectStore(s => s.indentTask);
  const outdentTask = useProjectStore(s => s.outdentTask);
  const moveTask = useProjectStore(s => s.moveTask);
  const setInspectorOpen = useProjectStore(s => s.setInspectorOpen);

  const calendar = useProjectStore(s => s.calendar);
  const resources = useProjectStore(s => s.resources);
  const resourceOrder = useProjectStore(s => s.resourceOrder);
  const assignments = useProjectStore(s => s.assignments);
  const assignResource = useProjectStore(s => s.assignResource);
  const updateAssignment = useProjectStore(s => s.updateAssignment);
  const unassignResource = useProjectStore(s => s.unassignResource);
  const addResource = useProjectStore(s => s.addResource);
  const setView = useProjectStore(s => s.setView);

  const selectedId = selection.size === 1 ? [...selection][0] : undefined;
  const task = selectedId ? tasks.get(selectedId) : undefined;
  const sched = selectedId ? schedule.scheduled.get(selectedId) : undefined;
  const incoming = selectedId
    ? [...dependencies.values()].filter(d => d.successorId === selectedId)
    : [];

  const isSummary = useMemo(() => {
    if (!selectedId) return false;
    for (const t of tasks.values()) if (t.parentId === selectedId) return true;
    return false;
  }, [selectedId, tasks]);

  const computedDurationDays = useMemo(() => {
    if (!sched) return 0;
    return workingDaysBetween(sched.start, sched.finish, calendar) + 1;
  }, [sched, calendar]);

  const displayProgress = useMemo(() => {
    if (!task || !selectedId) return 0;
    if (isSummary) return computeSummaryProgress(selectedId, tasks);
    return Math.max(0, Math.min(100, task.progressPct));
  }, [task, selectedId, isSummary, tasks]);

  const taskAssignments = useMemo(() => {
    if (!selectedId) return [];
    return [...assignments.values()].filter(a => a.taskId === selectedId);
  }, [assignments, selectedId]);

  const unassignedResources = useMemo(() => {
    if (!selectedId) return [];
    const taken = new Set(taskAssignments.map(a => a.resourceId));
    return resourceOrder
      .filter(rid => !taken.has(rid))
      .map(rid => resources.get(rid))
      .filter((r): r is NonNullable<typeof r> => !!r);
  }, [resourceOrder, resources, taskAssignments, selectedId]);

  return (
    <AnimatePresence>
      {open && task && sched && selectedId && (
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          className="absolute top-0 right-0 bottom-0 w-[340px] bg-(--color-surface) border-l border-(--color-border) shadow-xl z-30 flex flex-col"
        >
          <div className="h-12 flex items-center justify-between px-4 border-b border-(--color-border)">
            <div className="font-semibold text-[14px]">Task details</div>
            <button
              onClick={() => setInspectorOpen(false)}
              className="w-7 h-7 rounded-md hover:bg-(--color-surface-2) flex items-center justify-center"
              aria-label="Close inspector"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-5">
            <Field label="Name">
              <input
                value={task.name}
                onChange={e => updateTask(selectedId, { name: e.target.value })}
                className="w-full px-2.5 h-9 rounded-md bg-(--color-surface-2) border border-transparent focus:border-(--color-brand) focus:bg-(--color-surface) outline-none text-[14px]"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={isSummary ? 'Duration (rolled up)' : 'Duration'}>
                {isSummary ? (
                  <div className="px-2.5 h-9 rounded-md bg-(--color-surface-2) flex items-center text-[13px] tabular text-(--color-ink-muted)">
                    {formatDuration(computedDurationDays)}
                  </div>
                ) : (
                  <DurationField selectedId={selectedId} value={task.durationDays} />
                )}
              </Field>
              <Field label={isSummary ? 'Progress (rolled up)' : 'Progress'}>
                {isSummary ? (
                  <div>
                    <div className="px-2.5 h-9 rounded-md bg-(--color-surface-2) flex items-center text-[13px] tabular text-(--color-ink-muted)">
                      {formatProgress(displayProgress)}
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-(--color-surface-2) overflow-hidden">
                      <div
                        className="h-full bg-(--color-bar-progress) transition-all"
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <ProgressField selectedId={selectedId} value={task.progressPct} />
                )}
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start (computed)">
                <div className="px-2.5 h-9 rounded-md bg-(--color-surface-2) flex items-center text-[13px] tabular">
                  {format(sched.start, 'EEE, MMM d')}
                </div>
              </Field>
              <Field label="Finish (computed)">
                <div className="px-2.5 h-9 rounded-md bg-(--color-surface-2) flex items-center text-[13px] tabular">
                  {format(sched.finish, 'EEE, MMM d')}
                </div>
              </Field>
            </div>

            {task.scheduleMode === 'manual' && !isSummary && (
              <Field label="Schedule mode">
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5">
                  <div className="flex items-start gap-2 text-[12px] text-amber-900">
                    <Pin size={13} className="mt-0.5 flex-shrink-0 fill-current" />
                    <div className="flex-1">
                      <div className="font-semibold">Pinned to a manual date</div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        Predecessors won't push this task. Dragging or editing
                        Start pins to a manual date.
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateTask(selectedId, { scheduleMode: 'auto', manualStart: undefined })}
                    className="mt-2 w-full"
                  >
                    Reset to auto-schedule
                  </Button>
                </div>
              </Field>
            )}
            <Field label="Type">
              {isSummary ? (
                <div className="flex items-center gap-2 h-8 text-[13px] text-(--color-ink-muted)">
                  <Folder size={13} />
                  <span>Summary (rolls up children)</span>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <Button
                    variant={!task.isMilestone ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateTask(selectedId, { isMilestone: false, durationDays: Math.max(1, task.durationDays) })}
                  >
                    Task
                  </Button>
                  <Button
                    variant={task.isMilestone ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateTask(selectedId, { isMilestone: true, durationDays: 0 })}
                  >
                    <Diamond size={11} /> Milestone
                  </Button>
                </div>
              )}
            </Field>

            <Field label="Hierarchy">
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => outdentTask(selectedId)}
                  disabled={!task.parentId}
                  title="Promote — un-nest from parent (Shift+Tab)"
                >
                  <IndentDecrease size={12} /> Outdent
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => indentTask(selectedId)}
                  title="Demote — make this a child of the row above (Tab)"
                >
                  <IndentIncrease size={12} /> Indent
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveTask(selectedId, 'up')}
                  title="Move up"
                >
                  <ArrowUp size={12} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveTask(selectedId, 'down')}
                  title="Move down"
                >
                  <ArrowDown size={12} />
                </Button>
              </div>
              <div className="mt-1.5 text-[11px] text-(--color-ink-subtle) leading-snug">
                Indent makes this task a child (rollup) of the row above. The parent
                automatically becomes a summary — its dates and bar span all children.
              </div>
            </Field>
            <Field label="Color">
              <div className="flex gap-1.5">
                {TASK_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateTask(selectedId, { color: c })}
                    className={`w-6 h-6 rounded-md ring-2 transition-transform hover:scale-110 ${
                      task.color === c ? 'ring-(--color-ink)' : 'ring-transparent'
                    }`}
                    style={{ background: c }}
                  />
                ))}
                <button
                  onClick={() => updateTask(selectedId, { color: undefined })}
                  className={`w-6 h-6 rounded-md ring-2 ring-transparent transition-transform hover:scale-110 bg-zinc-200 text-zinc-600 text-[10px] font-medium flex items-center justify-center ${
                    !task.color ? 'ring-(--color-ink)' : ''
                  }`}
                >
                  Auto
                </button>
              </div>
            </Field>

            <div>
              <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wide text-(--color-ink-muted)">
                <GitBranch size={11} /> Predecessors
              </div>
              {incoming.length === 0 ? (
                <div className="text-[12px] text-(--color-ink-subtle) italic">
                  None. Drag from another task's edge to create a dependency.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {incoming.map(dep => {
                    const pred = tasks.get(dep.predecessorId);
                    if (!pred) return null;
                    return (
                      <div
                        key={dep.id}
                        className="flex items-center gap-1.5 p-2 rounded-md bg-(--color-surface-2)"
                      >
                        <span className="flex-1 text-[12px] truncate font-medium">{pred.name}</span>
                        <select
                          value={dep.type}
                          onChange={e => updateDep(dep.id, { type: e.target.value as DepType })}
                          className="text-[11px] font-bold bg-(--color-surface) rounded px-1 h-6 border border-(--color-border)"
                        >
                          {DEP_TYPES.map(t => (
                            <option key={t.value} value={t.value} title={t.description}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={dep.lagDays}
                          onChange={e => updateDep(dep.id, { lagDays: Number(e.target.value) })}
                          className="w-12 text-[11px] tabular bg-(--color-surface) rounded px-1.5 h-6 border border-(--color-border)"
                          aria-label="Lag in days"
                        />
                        <span className="text-[10px] text-(--color-ink-subtle)">d</span>
                        <button
                          onClick={() => deleteDep(dep.id)}
                          className="w-6 h-6 rounded hover:bg-(--color-surface) text-(--color-ink-subtle) hover:text-(--color-danger) flex items-center justify-center"
                          aria-label="Remove dependency"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {!isSummary && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-(--color-ink-muted)">
                    <Users size={11} /> Assignments
                  </div>
                  <button
                    onClick={() => setView('resources')}
                    className="text-[11px] text-(--color-brand) hover:underline"
                  >
                    Manage resources
                  </button>
                </div>
                {taskAssignments.length === 0 && resourceOrder.length === 0 ? (
                  <div className="text-[12px] text-(--color-ink-subtle) italic mb-2">
                    No resources defined yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {taskAssignments.map(a => {
                      const r = resources.get(a.resourceId);
                      if (!r) return null;
                      return (
                        <div key={a.id} className="flex items-center gap-1.5 p-2 rounded-md bg-(--color-surface-2)">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: r.color ?? '#94a3b8' }}
                          />
                          <span className="font-mono text-[11px] font-semibold text-(--color-ink-muted)">{r.code}</span>
                          <span className="flex-1 text-[12px] truncate">{r.name}</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={a.allocationPct}
                            onChange={e => updateAssignment(a.id, { allocationPct: Number(e.target.value) })}
                            className="w-12 text-[11px] tabular bg-(--color-surface) rounded px-1.5 h-6 border border-(--color-border)"
                            aria-label="Allocation percent"
                          />
                          <span className="text-[10px] text-(--color-ink-subtle)">%</span>
                          <button
                            onClick={() => unassignResource(a.id)}
                            className="w-6 h-6 rounded hover:bg-(--color-surface) text-(--color-ink-subtle) hover:text-(--color-danger) flex items-center justify-center"
                            aria-label="Unassign"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {unassignedResources.length > 0 ? (
                  <select
                    value=""
                    onChange={e => {
                      if (e.target.value) {
                        assignResource(selectedId, e.target.value, 100);
                      }
                    }}
                    className="w-full mt-2 px-2.5 h-9 rounded-md bg-(--color-surface-2) border border-transparent focus:border-(--color-brand) outline-none text-[13px]"
                  >
                    <option value="">+ Assign a resource…</option>
                    {unassignedResources.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.code} — {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  resourceOrder.length === 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const newId = addResource({ code: `R${resourceOrder.length + 1}`, name: 'New resource' });
                        if (selectedId) assignResource(selectedId, newId, 100);
                      }}
                      className="w-full mt-2"
                    >
                      <Plus size={12} /> Create & assign first resource
                    </Button>
                  )
                )}
              </div>
            )}

            <Field label="Notes">
              <textarea
                value={task.notes ?? ''}
                onChange={e => updateTask(selectedId, { notes: e.target.value })}
                rows={3}
                className="w-full px-2.5 py-2 rounded-md bg-(--color-surface-2) border border-transparent focus:border-(--color-brand) focus:bg-(--color-surface) outline-none text-[13px] resize-none"
                placeholder="Anything worth remembering…"
              />
            </Field>
          </div>
          <div className="border-t border-(--color-border) p-3 flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => deleteTask(selectedId)}>
              <Trash2 size={12} /> Delete task
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setInspectorOpen(false)}>
              Done
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-(--color-ink-muted) mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function ProgressField({ selectedId, value }: { selectedId: string; value: number }) {
  const updateTask = useProjectStore(s => s.updateTask);
  const [text, setText] = useState(formatProgress(value));
  useEffect(() => { setText(formatProgress(value)); }, [value]);
  return (
    <div>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={() => {
          const n = parseProgress(text);
          if (n != null) {
            updateTask(selectedId, { progressPct: n });
            setText(formatProgress(n));
          } else {
            setText(formatProgress(value));
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setText(formatProgress(value));
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        placeholder="0%"
        inputMode="numeric"
        className="w-full px-2.5 h-9 rounded-md bg-(--color-surface-2) border border-transparent focus:border-(--color-brand) focus:bg-(--color-surface) outline-none text-[13px] tabular"
      />
      <div className="mt-1.5 h-1.5 rounded-full bg-(--color-surface-2) overflow-hidden">
        <div
          className="h-full bg-(--color-bar-progress) transition-all"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function DurationField({ selectedId, value }: { selectedId: string; value: number }) {
  const updateTask = useProjectStore(s => s.updateTask);
  const [text, setText] = useState(formatDuration(value));
  return (
    <input
      value={text}
      onChange={e => setText(e.target.value)}
      onBlur={() => {
        const n = parseDuration(text);
        if (n != null) {
          updateTask(selectedId, { durationDays: n, isMilestone: n === 0 });
          setText(formatDuration(n));
        } else {
          setText(formatDuration(value));
        }
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
      }}
      className="w-full px-2.5 h-9 rounded-md bg-(--color-surface-2) border border-transparent focus:border-(--color-brand) focus:bg-(--color-surface) outline-none text-[13px] tabular"
    />
  );
}
