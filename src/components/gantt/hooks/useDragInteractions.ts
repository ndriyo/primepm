import { useCallback, useRef, useState, type RefObject } from 'react';
import { addDays, differenceInCalendarDays } from 'date-fns';
import type { DepType } from '../../../engine';
import { addWorkingDays, nextWorkingDay } from '../../../engine';
import { useProjectStore } from '../../../store/projectStore';
import { ROW_HEIGHT, dateToX, pxToDays, type TimeScale } from '../timeScale';
import type { LinkPreviewState } from '../LinkPreview';
import type { SlipSenseInfo } from '../SlipSenseTag';

export type DragMode = 'move' | 'resize-start' | 'resize-end' | 'link-start' | 'link-end';

interface Args {
  scale: TimeScale;
  rowsById: Map<string, number>;
  containerRef: RefObject<HTMLDivElement | null>;
}

interface MoveSession {
  taskId: string;
  mode: 'move' | 'resize-start' | 'resize-end';
  startClientX: number;
  startClientY: number;
  startDays: number; // current day-shift, snapped
  origStart: Date;
  origDuration: number;
  affectedTaskIds: Set<string>;
  origProjectFinish: Date;
}

interface LinkSession {
  fromTaskId: string;
  fromEnd: 'start' | 'finish';
  fromX: number;
  fromY: number;
}

export function useDragInteractions({ scale, rowsById, containerRef }: Args) {
  const tasks = useProjectStore.getState().tasks;
  const [ghost, setGhost] = useState<MoveSession | null>(null);
  const [link, setLink] = useState<LinkPreviewState | null>(null);
  const [slipSense, setSlipSense] = useState<SlipSenseInfo | null>(null);

  const moveSessionRef = useRef<MoveSession | null>(null);
  const linkSessionRef = useRef<LinkSession | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, taskId: string, mode: DragMode) => {
      const store = useProjectStore.getState();
      const task = store.tasks.get(taskId);
      const sched = store.schedule.scheduled.get(taskId);
      if (!task || !sched) return;

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      if (mode === 'link-start' || mode === 'link-end') {
        e.preventDefault();
        const containerRect = containerRef.current!.getBoundingClientRect();
        const xStart = dateToX(sched.start, scale);
        const xEnd = dateToX(addWorkingDays(sched.finish, 1, store.calendar), scale);
        const rowIdx = rowsById.get(taskId)!;
        const yMid = rowIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
        const fromX = mode === 'link-start' ? xStart : xEnd;
        linkSessionRef.current = {
          fromTaskId: taskId,
          fromEnd: mode === 'link-start' ? 'start' : 'finish',
          fromX,
          fromY: yMid,
        };
        setLink({
          fromX,
          fromY: yMid,
          toX: e.clientX - containerRect.left,
          toY: e.clientY - containerRect.top,
          type: 'FS',
          validTarget: false,
        });
        attachLinkListeners(target, e.pointerId);
      } else {
        const childIds = collectDescendants(taskId, store.tasks);
        const successorIds = collectSuccessors(taskId, store.dependencies, store.tasks);
        const affected = new Set<string>([...childIds, ...successorIds]);
        const session: MoveSession = {
          taskId,
          mode: mode as 'move' | 'resize-start' | 'resize-end',
          startClientX: e.clientX,
          startClientY: e.clientY,
          startDays: 0,
          origStart: sched.start,
          origDuration: task.durationDays,
          affectedTaskIds: affected,
          origProjectFinish: store.schedule.projectFinish,
        };
        moveSessionRef.current = session;
        setGhost(session);
        attachMoveListeners(target, e.pointerId);
      }
    },
    [scale, rowsById, containerRef],
  );

  const attachMoveListeners = (target: HTMLElement, pointerId: number) => {
    const onMove = (e: PointerEvent) => {
      const s = moveSessionRef.current;
      if (!s) return;
      const dxPx = e.clientX - s.startClientX;
      const dxDays = pxToDays(dxPx, scale);
      const store = useProjectStore.getState();
      const task = store.tasks.get(s.taskId);
      if (!task) return;

      if (s.mode === 'move') {
        const newStart = nextWorkingDay(addDays(s.origStart, dxDays), store.calendar);
        const cur = task.manualStart ?? store.schedule.scheduled.get(s.taskId)?.start;
        if (cur && newStart.getTime() === cur.getTime()) {
          // No change yet — still update overlay if delta != startDays
        }
        if (dxDays !== s.startDays) {
          s.startDays = dxDays;
          store.updateTask(s.taskId, { scheduleMode: 'manual', manualStart: newStart });
          updateSlipSense(e, s);
        }
      } else if (s.mode === 'resize-end') {
        const newDuration = Math.max(0, s.origDuration + dxDays);
        if (newDuration !== task.durationDays) {
          store.updateTask(s.taskId, { durationDays: newDuration });
          updateSlipSense(e, s);
        }
      } else {
        // resize-start: shift start, shorten by dxDays
        const newStart = nextWorkingDay(addDays(s.origStart, dxDays), store.calendar);
        const newDuration = Math.max(0, s.origDuration - dxDays);
        store.updateTask(s.taskId, {
          scheduleMode: 'manual',
          manualStart: newStart,
          durationDays: newDuration,
        });
        updateSlipSense(e, s);
      }
    };
    const onUp = (e: PointerEvent) => {
      target.releasePointerCapture(pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      moveSessionRef.current = null;
      setGhost(null);
      setSlipSense(null);
      void e;
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  const updateSlipSense = (e: PointerEvent, s: MoveSession) => {
    const store = useProjectStore.getState();
    const projShift = differenceInCalendarDays(store.schedule.projectFinish, s.origProjectFinish);
    setSlipSense({
      x: e.clientX,
      y: e.clientY,
      deltaDays: s.startDays,
      affectedCount: s.affectedTaskIds.size,
      projectShiftDays: projShift,
    });
  };

  const attachLinkListeners = (target: HTMLElement, pointerId: number) => {
    const onMove = (e: PointerEvent) => {
      const sess = linkSessionRef.current;
      if (!sess) return;
      const containerRect = containerRef.current!.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      // Hit-test: find nearest task bar end to (x, y).
      const hit = hitTestTask(e.clientX, e.clientY);
      if (hit && hit.taskId !== sess.fromTaskId) {
        const store = useProjectStore.getState();
        const targetSched = store.schedule.scheduled.get(hit.taskId);
        const targetTask = store.tasks.get(hit.taskId);
        if (!targetSched || !targetTask) {
          setLink(prev => (prev ? { ...prev, toX: x, toY: y, validTarget: false } : null));
          return;
        }
        const targetRow = rowsById.get(hit.taskId)!;
        const targetY = targetRow * ROW_HEIGHT + ROW_HEIGHT / 2;
        const xStart = dateToX(targetSched.start, scale);
        const xEnd = dateToX(addWorkingDays(targetSched.finish, 1, store.calendar), scale);
        // Determine end based on which half of the bar the cursor is over.
        const containerX = e.clientX - containerRect.left;
        const targetEnd: 'start' | 'finish' = Math.abs(containerX - xStart) <= Math.abs(containerX - xEnd) ? 'start' : 'finish';
        const type = depTypeFor(sess.fromEnd, targetEnd);
        const targetX = targetEnd === 'start' ? xStart : xEnd;
        setLink({
          fromX: sess.fromX,
          fromY: sess.fromY,
          toX: targetX,
          toY: targetY,
          type,
          validTarget: true,
        });
      } else {
        setLink({
          fromX: sess.fromX,
          fromY: sess.fromY,
          toX: x,
          toY: y,
          type: 'FS',
          validTarget: false,
        });
      }
    };
    const onUp = (e: PointerEvent) => {
      target.releasePointerCapture(pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      const sess = linkSessionRef.current;
      const hit = hitTestTask(e.clientX, e.clientY);
      if (sess && hit && hit.taskId !== sess.fromTaskId) {
        const containerRect = containerRef.current!.getBoundingClientRect();
        const store = useProjectStore.getState();
        const targetSched = store.schedule.scheduled.get(hit.taskId);
        if (targetSched) {
          const xStart = dateToX(targetSched.start, scale);
          const xEnd = dateToX(addWorkingDays(targetSched.finish, 1, store.calendar), scale);
          const containerX = e.clientX - containerRect.left;
          const targetEnd: 'start' | 'finish' = Math.abs(containerX - xStart) <= Math.abs(containerX - xEnd) ? 'start' : 'finish';
          const type = depTypeFor(sess.fromEnd, targetEnd);
          const predId = sess.fromEnd === 'finish' ? sess.fromTaskId : (type === 'SS' || type === 'SF' ? sess.fromTaskId : sess.fromTaskId);
          // Predecessor / successor mapping:
          //  fromEnd=finish, targetEnd=start ⇒ FS, pred=from, succ=to
          //  fromEnd=start , targetEnd=start ⇒ SS, pred=from, succ=to (semantically symmetric, choose from→to)
          //  fromEnd=finish, targetEnd=finish ⇒ FF, pred=from, succ=to
          //  fromEnd=start , targetEnd=finish ⇒ SF, pred=from, succ=to
          store.addDependency(predId, hit.taskId, type);
        }
      }
      linkSessionRef.current = null;
      setLink(null);
      void e;
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  const hitTestTask = (clientX: number, clientY: number): { taskId: string } | null => {
    const els = document.elementsFromPoint(clientX, clientY);
    for (const el of els) {
      const id = (el as HTMLElement).dataset?.taskId;
      if (id) return { taskId: id };
    }
    return null;
  };

  return { onPointerDown, ghost, link, slipSense };
  void tasks;
}

function depTypeFor(from: 'start' | 'finish', to: 'start' | 'finish'): DepType {
  if (from === 'finish' && to === 'start') return 'FS';
  if (from === 'start' && to === 'start') return 'SS';
  if (from === 'finish' && to === 'finish') return 'FF';
  return 'SF';
}

function collectDescendants(rootId: string, tasks: Map<string, { id: string; parentId?: string }>): Set<string> {
  const descendants = new Set<string>();
  const queue = [rootId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const t of tasks.values()) {
      if (t.parentId === cur && !descendants.has(t.id)) {
        descendants.add(t.id);
        queue.push(t.id);
      }
    }
  }
  return descendants;
}

function collectSuccessors(
  rootId: string,
  deps: Map<string, { predecessorId: string; successorId: string }>,
  _tasks: Map<string, unknown>,
): Set<string> {
  const visited = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const dep of deps.values()) {
      if (dep.predecessorId === cur && !visited.has(dep.successorId)) {
        visited.add(dep.successorId);
        stack.push(dep.successorId);
      }
    }
  }
  visited.delete(rootId);
  return visited;
}
