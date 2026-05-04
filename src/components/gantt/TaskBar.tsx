import { motion } from 'motion/react';
import type { Task, ScheduledTask } from '../../engine';
import { addWorkingDays } from '../../engine';
import { dateToX, ROW_HEIGHT, type TimeScale } from './timeScale';
import { useProjectStore } from '../../store/projectStore';
import { cn } from '../../lib/cn';

interface Props {
  task: Task;
  scheduled: ScheduledTask;
  rowIndex: number;
  scale: TimeScale;
  isSummary: boolean;
  displayProgressPct: number;
  onPointerDown: (e: React.PointerEvent, mode: 'move' | 'resize-start' | 'resize-end' | 'link-start' | 'link-end') => void;
}

export function TaskBar({ task, scheduled, rowIndex, scale, isSummary, displayProgressPct, onPointerDown }: Props) {
  const calendar = useProjectStore(s => s.calendar);
  const selection = useProjectStore(s => s.selection);
  const showCriticalPath = useProjectStore(s => s.showCriticalPath);
  const isSelected = selection.has(task.id);

  const x = dateToX(scheduled.start, scale);
  // Bar width is from start to (finish + 1 working day).
  const xEnd = dateToX(addWorkingDays(scheduled.finish, 1, calendar), scale);
  const width = Math.max(8, xEnd - x);
  const top = rowIndex * ROW_HEIGHT + (ROW_HEIGHT - 22) / 2;

  const cycleFlag = scheduled.inCycle;
  const dimNonCritical = showCriticalPath && !scheduled.isCritical && !isSummary;
  const isCritical = showCriticalPath && scheduled.isCritical;

  if (task.isMilestone) {
    const cx = x;
    return (
      <motion.div
        layout
        layoutId={`bar-${task.id}`}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className={cn(
          'absolute z-10 -translate-x-1/2 rotate-45 cursor-grab active:cursor-grabbing select-none',
          isSelected ? 'ring-2 ring-(--color-brand) ring-offset-1' : '',
          dimNonCritical && 'opacity-40',
        )}
        style={{
          left: cx,
          top: top + 1,
          width: 18,
          height: 18,
          background: isCritical ? 'var(--color-bar-critical)' : 'var(--color-bar-milestone)',
        }}
        onPointerDown={e => onPointerDown(e, 'move')}
        title={task.name}
      />
    );
  }

  if (isSummary) {
    return (
      <motion.div
        layout
        layoutId={`bar-${task.id}`}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className={cn(
          'absolute z-10 select-none pointer-events-none',
          dimNonCritical && 'opacity-40',
        )}
        style={{ left: x, top: top + 6, width, height: 10 }}
      >
        <div className="absolute inset-x-0 top-2 h-1 bg-(--color-bar-summary) rounded-full" />
        <div className="absolute left-0 top-0 w-2 h-2 bg-(--color-bar-summary) rounded-tl rounded-bl" />
        <div className="absolute right-0 top-0 w-2 h-2 bg-(--color-bar-summary) rounded-tr rounded-br" />
        <div className="absolute -left-px -bottom-1 w-0 h-0 border-t-[6px] border-l-[5px] border-r-0 border-t-(--color-bar-summary) border-l-transparent" />
        <div className="absolute -right-px -bottom-1 w-0 h-0 border-t-[6px] border-r-[5px] border-l-0 border-t-(--color-bar-summary) border-r-transparent" />
      </motion.div>
    );
  }

  const progressW = (width * Math.max(0, Math.min(100, displayProgressPct))) / 100;

  return (
    <motion.div
      data-task-id={task.id}
      layout
      layoutId={`bar-${task.id}`}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={cn(
        'absolute z-10 group select-none rounded-md no-drag-image',
        cycleFlag ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
        isSelected ? 'ring-2 ring-(--color-brand) ring-offset-1' : 'ring-1 ring-black/5',
        dimNonCritical && 'opacity-40',
      )}
      style={{
        left: x,
        top,
        width,
        height: 22,
        background: cycleFlag
          ? '#fda4af'
          : isCritical
            ? 'var(--color-bar-critical)'
            : task.color ?? 'var(--color-bar)',
      }}
      onPointerDown={e => {
        if ((e.target as HTMLElement).dataset.handle) return;
        onPointerDown(e, 'move');
      }}
      title={task.name}
    >
      {/* progress overlay */}
      {progressW > 0 && (
        <div
          className="absolute inset-y-0 left-0 rounded-l-md bg-(--color-bar-progress)"
          style={{ width: progressW }}
        />
      )}
      <div className="relative h-full flex items-center gap-1 px-2 text-[11px] text-white font-medium truncate">
        {task.scheduleMode === 'manual' && (
          <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className="flex-shrink-0 opacity-90" aria-label="Pinned to manual date">
            <path d="M16 3l5 5-3 1-3 6 1 1-3 3-4-4-5 5v-5l5-5-4-4 3-3 1 1 6-3z" />
          </svg>
        )}
        <span className="truncate">{task.name}</span>
      </div>
      {/* resize handles */}
      <div
        data-handle="resize-start"
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-l-md"
        onPointerDown={e => { e.stopPropagation(); onPointerDown(e, 'resize-start'); }}
      />
      <div
        data-handle="resize-end"
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-r-md"
        onPointerDown={e => { e.stopPropagation(); onPointerDown(e, 'resize-end'); }}
      />
      {/* link nubs (visible on hover) */}
      <button
        data-handle="link-start"
        title="Drag to create dependency"
        className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-(--color-brand) opacity-0 group-hover:opacity-100 hover:scale-125 transition-transform shadow"
        onPointerDown={e => { e.stopPropagation(); onPointerDown(e, 'link-start'); }}
      />
      <button
        data-handle="link-end"
        title="Drag to create dependency"
        className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-(--color-brand) opacity-0 group-hover:opacity-100 hover:scale-125 transition-transform shadow"
        onPointerDown={e => { e.stopPropagation(); onPointerDown(e, 'link-end'); }}
      />
    </motion.div>
  );
}
