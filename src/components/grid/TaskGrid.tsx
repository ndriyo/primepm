import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useProjectStore, type InsertPlacement } from '../../store/projectStore';
import { computeVisibleOrder } from '../../store/visibleOrder';
import { HEADER_HEIGHT, ROW_HEIGHT } from '../gantt/timeScale';
import { GridCell } from './GridCell';
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Diamond,
  GripVertical,
  IndentIncrease,
  IndentDecrease,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  CornerDownRight,
  CornerDownLeft,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatDuration, parseDuration } from '../../lib/durationFormat';
import { parseSmartDate } from '../../lib/smartDate';
import { parsePredecessors } from '../../lib/predecessors';
import { buildProgressMap, formatProgress, parseProgress } from '../../lib/progress';
import { workingDaysBetween } from '../../engine';
import { Tooltip } from '../ui/Tooltip';
import { ContextMenu, type MenuItem } from '../ui/ContextMenu';
import { useResizeDrag } from '../../lib/useResize';

interface Props {
  scrollY: number;
  onScrollY: (y: number) => void;
}

type ColKey = 'name' | 'duration' | 'start' | 'finish' | 'progress' | 'predecessors' | 'resources';

const COL_FIXED = { drag: 18, marker: 32 } as const;
const COL_INITIAL: Record<ColKey, number> = {
  name: 240,
  duration: 78,
  start: 110,
  finish: 110,
  progress: 70,
  predecessors: 130,
  resources: 160,
};
const COL_MIN: Record<ColKey, number> = {
  name: 140,
  duration: 56,
  start: 80,
  finish: 80,
  progress: 56,
  predecessors: 80,
  resources: 100,
};
const COL_LABELS: Record<ColKey, string> = {
  name: 'Task name',
  duration: 'Duration',
  start: 'Start',
  finish: 'Finish',
  progress: '%',
  predecessors: 'Predecessors',
  resources: 'Resources',
};

interface DragState {
  taskId: string;
  startY: number;
  currentY: number;
  targetIndex: number; // index in visibleOrder where the drop will land
  pointerId: number;
}

export function TaskGrid({ scrollY, onScrollY }: Props) {
  const tasks = useProjectStore(s => s.tasks);
  const order = useProjectStore(s => s.taskOrder);
  const collapsed = useProjectStore(s => s.collapsed);
  const schedule = useProjectStore(s => s.schedule);
  const dependencies = useProjectStore(s => s.dependencies);
  const calendar = useProjectStore(s => s.calendar);
  const selection = useProjectStore(s => s.selection);
  const toggleSelection = useProjectStore(s => s.toggleSelection);
  const setSelection = useProjectStore(s => s.setSelection);
  const toggleCollapsed = useProjectStore(s => s.toggleCollapsed);
  const updateTask = useProjectStore(s => s.updateTask);
  const insertTask = useProjectStore(s => s.insertTask);
  const addTask = useProjectStore(s => s.addTask);
  const setPredecessors = useProjectStore(s => s.setPredecessors);
  const indentTask = useProjectStore(s => s.indentTask);
  const outdentTask = useProjectStore(s => s.outdentTask);
  const moveTask = useProjectStore(s => s.moveTask);
  const moveTaskToPosition = useProjectStore(s => s.moveTaskToPosition);
  const duplicateTask = useProjectStore(s => s.duplicateTask);
  const deleteTask = useProjectStore(s => s.deleteTask);

  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleOrder = useMemo(
    () => computeVisibleOrder(order, tasks, collapsed),
    [order, tasks, collapsed],
  );

  const summaryIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks.values()) if (t.parentId) set.add(t.parentId);
    return set;
  }, [tasks]);

  const orderIndex = useMemo(() => {
    const m = new Map<string, number>();
    order.forEach((id, idx) => m.set(id, idx + 1));
    return m;
  }, [order]);

  const predLabelsByTask = useMemo(() => {
    const m = new Map<string, string>();
    for (const dep of dependencies.values()) {
      const idx = orderIndex.get(dep.predecessorId);
      if (!idx) continue;
      const tag =
        dep.type === 'FS' && dep.lagDays === 0
          ? `${idx}`
          : `${idx}${dep.type}${dep.lagDays !== 0 ? (dep.lagDays > 0 ? '+' : '') + dep.lagDays + 'd' : ''}`;
      m.set(dep.successorId, m.has(dep.successorId) ? `${m.get(dep.successorId)}, ${tag}` : tag);
    }
    return m;
  }, [dependencies, orderIndex]);

  const depthByTaskId = useMemo(() => {
    const m = new Map<string, number>();
    for (const id of order) m.set(id, computeDepth(id, tasks));
    return m;
  }, [order, tasks]);

  const progressByTaskId = useMemo(() => buildProgressMap(tasks), [tasks]);

  const resourcesById = useProjectStore(s => s.resources);
  const assignmentsAll = useProjectStore(s => s.assignments);
  const resourceLabelsByTask = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of assignmentsAll.values()) {
      const r = resourcesById.get(a.resourceId);
      if (!r) continue;
      const tag = a.allocationPct === 100 ? r.code : `${r.code} [${a.allocationPct}%]`;
      m.set(a.taskId, m.has(a.taskId) ? `${m.get(a.taskId)}, ${tag}` : tag);
    }
    return m;
  }, [assignmentsAll, resourcesById]);

  const [viewportH, setViewportH] = useState(0);
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const update = () => setViewportH(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const range = useMemo(() => {
    const overscan = 14;
    const start = Math.max(0, Math.floor(scrollY / ROW_HEIGHT) - overscan);
    const end = Math.min(visibleOrder.length, Math.ceil((scrollY + (viewportH || 600)) / ROW_HEIGHT) + overscan);
    return { start, end };
  }, [scrollY, viewportH, visibleOrder.length]);

  useEffect(() => {
    if (scrollRef.current && Math.abs(scrollRef.current.scrollTop - scrollY) > 1) {
      scrollRef.current.scrollTop = scrollY;
    }
  }, [scrollY]);

  const [colWidths, setColWidths] = useState<Record<ColKey, number>>(COL_INITIAL);
  const colStartRef = useRef<Record<ColKey, number>>(COL_INITIAL);

  const totalWidth =
    COL_FIXED.drag +
    COL_FIXED.marker +
    colWidths.name +
    colWidths.duration +
    colWidths.start +
    colWidths.finish +
    colWidths.progress +
    colWidths.predecessors +
    colWidths.resources;

  const totalSize = visibleOrder.length * ROW_HEIGHT;

  // ---- Context menu state -------------------------------------------------

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);

  const buildMenuItems = (taskId: string): MenuItem[] => {
    const t = tasks.get(taskId);
    if (!t) return [];
    const isSummary = summaryIds.has(taskId);
    const hasParent = !!t.parentId;
    return [
      { kind: 'header', label: t.name },
      {
        kind: 'item',
        label: 'Insert task above',
        icon: <CornerDownLeft size={13} className="rotate-90" />,
        shortcut: '⌘⇧⏎',
        onClick: () => {
          const newId = insertTask({ id: taskId, placement: 'before' });
          setSelection([newId]);
        },
      },
      {
        kind: 'item',
        label: 'Insert task below',
        icon: <CornerDownRight size={13} />,
        shortcut: '⌘⏎',
        onClick: () => {
          const newId = insertTask({ id: taskId, placement: 'after' });
          setSelection([newId]);
        },
      },
      {
        kind: 'item',
        label: 'Insert as sub-task',
        icon: <Plus size={13} />,
        shortcut: '⌘⌥⏎',
        onClick: () => {
          const newId = insertTask({ id: taskId, placement: 'child' });
          setSelection([newId]);
        },
      },
      { kind: 'separator' },
      {
        kind: 'item',
        label: 'Indent (make sub-task)',
        icon: <IndentIncrease size={13} />,
        shortcut: 'Tab',
        onClick: () => indentTask(taskId),
      },
      {
        kind: 'item',
        label: 'Outdent (un-nest)',
        icon: <IndentDecrease size={13} />,
        shortcut: '⇧Tab',
        onClick: () => outdentTask(taskId),
        disabled: !hasParent,
      },
      {
        kind: 'item',
        label: 'Move up',
        icon: <ArrowUp size={13} />,
        shortcut: '⌥↑',
        onClick: () => moveTask(taskId, 'up'),
      },
      {
        kind: 'item',
        label: 'Move down',
        icon: <ArrowDown size={13} />,
        shortcut: '⌥↓',
        onClick: () => moveTask(taskId, 'down'),
      },
      { kind: 'separator' },
      {
        kind: 'item',
        label: t.isMilestone ? 'Convert to task' : 'Convert to milestone',
        icon: <Sparkles size={13} />,
        onClick: () => updateTask(taskId, t.isMilestone
          ? { isMilestone: false, durationDays: Math.max(1, t.durationDays) }
          : { isMilestone: true, durationDays: 0 }),
        disabled: isSummary,
      },
      {
        kind: 'item',
        label: 'Duplicate task',
        icon: <Copy size={13} />,
        onClick: () => {
          const newId = duplicateTask(taskId);
          if (newId) setSelection([newId]);
        },
      },
      { kind: 'separator' },
      {
        kind: 'item',
        label: 'Delete task',
        icon: <Trash2 size={13} />,
        onClick: () => deleteTask(taskId),
        danger: true,
      },
    ];
  };

  // ---- Drag-to-reparent ---------------------------------------------------

  const [drag, setDrag] = useState<DragState | null>(null);

  const onDragHandlePointerDown = (e: React.PointerEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setSelection([taskId]);
    const startY = e.clientY;
    const visIdx = visibleOrder.indexOf(taskId);
    setDrag({ taskId, startY, currentY: startY, targetIndex: visIdx, pointerId: e.pointerId });

    const move = (ev: PointerEvent) => {
      if (!scrollRef.current) return;
      const rect = scrollRef.current.getBoundingClientRect();
      const yInScroller = ev.clientY - rect.top + scrollRef.current.scrollTop;
      // index represents where the drop indicator line sits (between rows)
      const targetIndex = Math.max(0, Math.min(visibleOrder.length, Math.round(yInScroller / ROW_HEIGHT)));
      setDrag(prev => prev ? { ...prev, currentY: ev.clientY, targetIndex } : null);
    };
    const up = (ev: PointerEvent) => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      setDrag(latest => {
        if (!latest) return null;
        commitDrag(latest, ev);
        return null;
      });
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  };

  const commitDrag = (state: DragState, _ev: PointerEvent) => {
    const { taskId, targetIndex } = state;
    // Determine new parent based on the row directly above the drop point.
    // Simple rule:
    //   - drop position is between visibleOrder[targetIndex-1] and visibleOrder[targetIndex]
    //   - new parent = parent of visibleOrder[targetIndex-1]
    //     (so dropping right under a task makes it a sibling)
    //   - if visibleOrder[targetIndex-1] is the dragged task, no-op
    //   - if dragging onto first row, parent = undefined (root)
    const aboveId = targetIndex > 0 ? visibleOrder[targetIndex - 1] : undefined;
    if (aboveId === taskId) return;
    const aboveTask = aboveId ? tasks.get(aboveId) : undefined;
    let newParent = aboveTask?.parentId;
    // If dropping immediately after a SUMMARY (expanded), become the first child of it.
    // This makes "drop on summary" intuitive.
    if (aboveId && summaryIds.has(aboveId) && !collapsed.has(aboveId)) {
      newParent = aboveId;
    }
    // Convert visibleOrder index into absolute taskOrder index
    const absoluteIndex = aboveId ? order.indexOf(aboveId) + 1 : 0;
    moveTaskToPosition(taskId, absoluteIndex, newParent);
  };

  const dragIndicatorY = drag ? drag.targetIndex * ROW_HEIGHT : 0;

  // ---- Render -------------------------------------------------------------

  return (
    <div className="h-full flex flex-col bg-(--color-surface) border-r border-(--color-border) overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto"
        onScroll={e => onScrollY(e.currentTarget.scrollTop)}
      >
        <div style={{ width: totalWidth, position: 'relative' }}>
          {/* Header (sticky top, scrolls horizontally with body) */}
          <div
            className="border-b border-(--color-border) flex items-stretch text-[11px] font-semibold uppercase tracking-wide text-(--color-ink-muted) bg-(--color-surface) sticky top-0 z-20"
            style={{ height: HEADER_HEIGHT }}
          >
            <div style={{ width: COL_FIXED.drag }} />
            <div className="flex items-center justify-center" style={{ width: COL_FIXED.marker }}>#</div>
            {(['name', 'duration', 'start', 'finish', 'progress', 'predecessors', 'resources'] as const).map((col, i, arr) => (
              <ResizableHeaderCell
                key={col}
                label={COL_LABELS[col]}
                width={colWidths[col]}
                onStart={() => { colStartRef.current = { ...colWidths }; }}
                onResize={delta => {
                  const next = Math.max(COL_MIN[col], colStartRef.current[col] + delta);
                  setColWidths(prev => (prev[col] === next ? prev : { ...prev, [col]: next }));
                }}
                last={i === arr.length - 1}
              />
            ))}
          </div>

          <div style={{ height: totalSize, position: 'relative' }}>
          {/* Drop indicator line during drag */}
          {drag && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-(--color-brand) z-10 pointer-events-none"
              style={{ top: dragIndicatorY - 1 }}
            >
              <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-(--color-brand)" />
            </div>
          )}

          {visibleOrder.slice(range.start, range.end).map((id, k) => {
            const idx = range.start + k;
            const task = tasks.get(id);
            const sched = schedule.scheduled.get(id);
            if (!task || !sched) return null;
            const isSummary = summaryIds.has(id);
            const isCollapsed = collapsed.has(id);
            const isSelected = selection.has(id);
            const depth = depthByTaskId.get(id) ?? 0;
            const absoluteIndex = orderIndex.get(id) ?? idx + 1;
            const isDragging = drag?.taskId === id;
            return (
              <div
                key={id}
                className={cn(
                  'absolute left-0 right-0 flex items-stretch border-b border-(--color-border)/60 group',
                  isSelected && 'bg-(--color-brand-soft)/60',
                  !isSelected && !isDragging && 'hover:bg-(--color-surface-2)',
                  isDragging && 'opacity-40',
                )}
                style={{ top: idx * ROW_HEIGHT, height: ROW_HEIGHT }}
                onClick={e => toggleSelection(id, e.shiftKey || e.metaKey || e.ctrlKey)}
                onContextMenu={e => {
                  e.preventDefault();
                  setSelection([id]);
                  setContextMenu({ x: e.clientX, y: e.clientY, taskId: id });
                }}
              >
                {/* Drag handle */}
                <button
                  type="button"
                  className="flex items-center justify-center text-(--color-ink-subtle) opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
                  style={{ width: COL_FIXED.drag }}
                  onPointerDown={e => onDragHandlePointerDown(e, id)}
                  onClick={e => e.stopPropagation()}
                  aria-label="Drag to reorder"
                >
                  <GripVertical size={11} />
                </button>
                <div
                  className="flex items-center justify-center text-[11px] tabular text-(--color-ink-subtle)"
                  style={{ width: COL_FIXED.marker }}
                >
                  {absoluteIndex}
                </div>
                <div className="flex items-center border-l border-(--color-border)/60" style={{ width: colWidths.name }}>
                  <div style={{ width: depth * 14 }} className="flex-shrink-0" />
                  <button
                    type="button"
                    aria-label={isSummary ? (isCollapsed ? 'Expand' : 'Collapse') : 'Task'}
                    onClick={e => {
                      e.stopPropagation();
                      if (isSummary) toggleCollapsed(id);
                    }}
                    className={cn(
                      'w-5 h-5 flex-shrink-0 flex items-center justify-center rounded transition-colors',
                      isSummary
                        ? 'text-(--color-ink-muted) hover:bg-(--color-surface-2) cursor-pointer'
                        : 'text-(--color-ink-muted) cursor-default',
                    )}
                    tabIndex={isSummary ? 0 : -1}
                  >
                    {isSummary ? (
                      isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />
                    ) : task.isMilestone ? (
                      <Diamond size={11} />
                    ) : (
                      <ChevronRight size={11} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </button>
                  <GridCell
                    value={task.name}
                    className={cn(
                      'flex-1 text-[13px]',
                      isSummary && 'font-semibold',
                      task.isMilestone && 'italic',
                    )}
                    onCommit={v => updateTask(id, { name: v })}
                    placeholder="Task name"
                  />
                </div>
                <div className="flex items-center border-l border-(--color-border)/60 px-1" style={{ width: colWidths.duration }}>
                  <GridCell
                    value={
                      isSummary
                        ? formatDuration(workingDaysBetween(sched.start, sched.finish, calendar) + 1)
                        : formatDuration(task.durationDays)
                    }
                    className={cn(
                      'text-[12px] tabular text-right',
                      isSummary && 'text-(--color-ink-muted)',
                    )}
                    onCommit={v => {
                      if (v.toLowerCase() === 'milestone' || v === '0') {
                        updateTask(id, { durationDays: 0, isMilestone: true });
                        return;
                      }
                      const n = parseDuration(v);
                      if (n != null) updateTask(id, { durationDays: n, isMilestone: false });
                    }}
                    readOnly={isSummary}
                  />
                </div>
                <div className="flex items-center border-l border-(--color-border)/60 px-1" style={{ width: colWidths.start }}>
                  <GridCell
                    value={format(sched.start, 'EEE, MMM d')}
                    className="text-[12px] tabular"
                    onCommit={v => {
                      const d = parseSmartDate(v);
                      if (d) updateTask(id, { scheduleMode: 'manual', manualStart: d });
                    }}
                    readOnly={isSummary}
                  />
                </div>
                <div className="flex items-center border-l border-(--color-border)/60 px-1" style={{ width: colWidths.finish }}>
                  <GridCell
                    value={format(sched.finish, 'EEE, MMM d')}
                    className="text-[12px] tabular text-(--color-ink-muted)"
                    onCommit={v => {
                      const d = parseSmartDate(v);
                      if (!d) return;
                      const newDuration = workingDaysBetween(sched.start, d, calendar) + 1;
                      if (newDuration > 0) updateTask(id, { durationDays: newDuration });
                    }}
                    readOnly={isSummary}
                  />
                </div>
                <div className="flex items-center border-l border-(--color-border)/60 px-1" style={{ width: colWidths.progress }}>
                  <GridCell
                    value={formatProgress(progressByTaskId.get(id) ?? 0)}
                    className={cn(
                      'text-[12px] tabular text-right',
                      isSummary && 'text-(--color-ink-muted)',
                    )}
                    onCommit={v => {
                      const n = parseProgress(v);
                      if (n != null) updateTask(id, { progressPct: n });
                    }}
                    readOnly={isSummary}
                  />
                </div>
                <div className="flex items-center border-l border-(--color-border)/60 px-1" style={{ width: colWidths.predecessors }}>
                  <GridCell
                    value={predLabelsByTask.get(id) ?? ''}
                    className="text-[12px] tabular text-(--color-ink-muted)"
                    placeholder="—"
                    onCommit={v => {
                      const parsed = parsePredecessors(v);
                      const pred = parsed
                        .map(p => ({
                          predecessorId: order[p.rowIndex],
                          type: p.type,
                          lagDays: p.lagDays,
                        }))
                        .filter(p => !!p.predecessorId);
                      setPredecessors(id, pred);
                    }}
                    readOnly={isSummary}
                  />
                </div>
                <div className="flex items-center border-l border-(--color-border)/60 px-1" style={{ width: colWidths.resources }}>
                  <div
                    className="text-[12px] tabular text-(--color-ink-muted) px-1 truncate"
                    title={resourceLabelsByTask.get(id) ?? ''}
                  >
                    {resourceLabelsByTask.get(id) || <span className="text-(--color-ink-subtle)">—</span>}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
          <div className="flex items-stretch hover:bg-(--color-surface-2)/60 border-t border-(--color-border)/60" style={{ height: ROW_HEIGHT }}>
            <div style={{ width: COL_FIXED.drag }} />
            <div className="flex items-center justify-center" style={{ width: COL_FIXED.marker }}>
              <Tooltip label="Add task" shortcut="⏎">
                <button
                  onClick={() => addTask()}
                  className="w-5 h-5 rounded-full bg-(--color-brand) text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                  aria-label="Add task"
                >
                  <Plus size={12} />
                </button>
              </Tooltip>
            </div>
            <div className="flex items-center border-l border-(--color-border)/60" style={{ width: colWidths.name }}>
              <QuickAddCell />
            </div>
            <div className="flex-1" />
          </div>
        </div>
      </div>

      <ContextMenu
        open={!!contextMenu}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={contextMenu ? buildMenuItems(contextMenu.taskId) : []}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
}

interface ResizableHeaderCellProps {
  label: string;
  width: number;
  onStart: () => void;
  onResize: (delta: number) => void;
  last?: boolean;
}

function ResizableHeaderCell({ label, width, onStart, onResize, last }: ResizableHeaderCellProps) {
  const onPointerDown = useResizeDrag({ axis: 'x', onStart, onResize });
  return (
    <div
      className="relative flex items-center px-2 border-l border-(--color-border)"
      style={{ width }}
    >
      <span className="truncate">{label}</span>
      <div
        className={cn(
          'absolute top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-(--color-brand)/40 active:bg-(--color-brand) z-10',
          last ? 'right-0' : '-right-[3px]',
        )}
        onPointerDown={onPointerDown}
      />
    </div>
  );
}

function QuickAddCell() {
  const addTask = useProjectStore(s => s.addTask);
  const setSelection = useProjectStore(s => s.setSelection);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <input
      ref={inputRef}
      placeholder="Type to add a task…"
      className="w-full h-full px-2 text-[13px] bg-transparent outline-none placeholder:text-(--color-ink-subtle)"
      onKeyDown={e => {
        if (e.key === 'Enter') {
          const value = e.currentTarget.value.trim();
          if (!value) return;
          const id = addTask(undefined, { name: value });
          e.currentTarget.value = '';
          setSelection([id]);
        }
      }}
    />
  );
}

function computeDepth(id: string, tasks: Map<string, { id: string; parentId?: string }>): number {
  let depth = 0;
  let cur = tasks.get(id);
  while (cur && cur.parentId) {
    depth++;
    cur = tasks.get(cur.parentId);
  }
  return depth;
}

// Re-export type for callers
export type { InsertPlacement };
