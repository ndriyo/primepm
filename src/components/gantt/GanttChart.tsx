import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays } from 'date-fns';
import { useProjectStore, useActiveBaselinePayload } from '../../store/projectStore';
import { computeVisibleOrder } from '../../store/visibleOrder';
import { buildProgressMap } from '../../lib/progress';
import { useDragInteractions } from './hooks/useDragInteractions';
import { Timeline } from './Timeline';
import { TaskBar } from './TaskBar';
import { TodayLine } from './TodayLine';
import { WeekendShading } from './WeekendShading';
import { DependencyLayer } from './DependencyLayer';
import { SlipSenseTag } from './SlipSenseTag';
import { LinkPreview } from './LinkPreview';
import { BaselineBar } from './BaselineBar';
import { computeRowOverlayStates } from './baselineOverlay';
import { dateToX, HEADER_HEIGHT, PX_PER_DAY, ROW_HEIGHT, type TimeScale } from './timeScale';

interface Props {
  scrollY: number;
  onScrollY: (y: number) => void;
}

const VISIBLE_PADDING_DAYS = 14;

export function GanttChart({ scrollY, onScrollY }: Props) {
  const tasks = useProjectStore(s => s.tasks);
  const order = useProjectStore(s => s.taskOrder);
  const collapsed = useProjectStore(s => s.collapsed);
  const schedule = useProjectStore(s => s.schedule);
  const project = useProjectStore(s => s.project);
  const zoom = useProjectStore(s => s.zoom);
  const toggleSelection = useProjectStore(s => s.toggleSelection);
  const clearSelection = useProjectStore(s => s.clearSelection);

  const visibleOrder = useMemo(
    () => computeVisibleOrder(order, tasks, collapsed),
    [order, tasks, collapsed],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine time scale: origin is project.start - padding.
  const origin = useMemo(() => addDays(project.start, -VISIBLE_PADDING_DAYS), [project.start]);
  const finish = schedule.projectFinish ?? project.start;
  const totalDays = Math.max(
    differenceInCalendarDays(finish, origin) + VISIBLE_PADDING_DAYS * 4,
    90,
  );

  const scale: TimeScale = useMemo(
    () => ({ zoom, origin, pxPerDay: PX_PER_DAY[zoom] }),
    [zoom, origin],
  );

  const width = totalDays * scale.pxPerDay;
  const totalRows = visibleOrder.length;
  const innerHeight = Math.max(totalRows * ROW_HEIGHT, 320);

  const rowsById = useMemo(() => {
    const m = new Map<string, number>();
    visibleOrder.forEach((id, idx) => m.set(id, idx));
    return m;
  }, [visibleOrder]);

  const summaryIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks.values()) if (t.parentId) set.add(t.parentId);
    return set;
  }, [tasks]);

  const progressByTaskId = useMemo(() => buildProgressMap(tasks), [tasks]);

  // Spec 002 — overlay state per row. Empty map when no baseline is active.
  const activeBaseline = useActiveBaselinePayload();
  const overlayStates = useMemo(
    () =>
      computeRowOverlayStates({
        currentTasks: tasks,
        currentSchedule: schedule.scheduled,
        activeBaselinePayload: activeBaseline?.payload,
      }),
    [tasks, schedule.scheduled, activeBaseline?.payload],
  );

  // Spec 002 (T047) — when the resolved active baseline header has no payload
  // cached yet, lazy-fetch it. Memoised by baselineId in the store, so a
  // ref-switch between cached payloads triggers nothing extra here.
  const baselineHeaders = useProjectStore(s => s.baselineHeaders);
  const baselinePayloads = useProjectStore(s => s.baselinePayloads);
  const activeBaselineRef = useProjectStore(s => s.activeBaselineRef);
  const loadBaselinePayload = useProjectStore(s => s.loadBaselinePayload);
  useEffect(() => {
    if (baselineHeaders.length === 0) return;
    const header =
      activeBaselineRef === 'latest'
        ? baselineHeaders.reduce((best, h) => (h.versionIndex > best.versionIndex ? h : best))
        : baselineHeaders.find(h => h.id === activeBaselineRef);
    if (!header) return;
    if (baselinePayloads.has(header.id)) return;
    void loadBaselinePayload(project.id, header.id);
  }, [baselineHeaders, activeBaselineRef, baselinePayloads, loadBaselinePayload, project.id]);

  const { onPointerDown, ghost, link, slipSense } = useDragInteractions({
    scale,
    rowsById,
    containerRef,
  });

  // Sync vertical scroll with grid pane.
  useEffect(() => {
    if (scrollRef.current && Math.abs(scrollRef.current.scrollTop - scrollY) > 1) {
      scrollRef.current.scrollTop = scrollY;
    }
  }, [scrollY]);

  // Track viewport height to compute visible row range.
  const [viewportH, setViewportH] = useState(0);
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const update = () => setViewportH(el.clientHeight - HEADER_HEIGHT);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visibleRange = useMemo(() => {
    const overscan = 12;
    const startIdx = Math.max(0, Math.floor(scrollY / ROW_HEIGHT) - overscan);
    const endIdx = Math.min(
      totalRows,
      Math.ceil((scrollY + (viewportH || 600)) / ROW_HEIGHT) + overscan,
    );
    return { startIdx, endIdx };
  }, [scrollY, viewportH, totalRows]);

  // Auto-scroll to today on first render.
  const didScrollRef = useRef(false);
  useEffect(() => {
    if (didScrollRef.current) return;
    if (!scrollRef.current) return;
    const target = Math.max(0, dateToX(project.start, scale) - 120);
    scrollRef.current.scrollLeft = target;
    didScrollRef.current = true;
  }, [project.start, scale]);

  const [hoverRow, setHoverRow] = useState<number | null>(null);

  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-(--color-surface)">
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto relative"
        onScroll={e => onScrollY(e.currentTarget.scrollTop)}
        onMouseLeave={() => setHoverRow(null)}
      >
        <Timeline scale={scale} totalDays={totalDays} width={width} />
        <div
          ref={containerRef}
          className="relative"
          style={{ width, height: innerHeight }}
          onClick={e => {
            if (e.target === e.currentTarget) clearSelection();
          }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const row = Math.floor(y / ROW_HEIGHT);
            setHoverRow(row);
          }}
        >
          {/* row stripes & hover (windowed) */}
          {Array.from({ length: visibleRange.endIdx - visibleRange.startIdx }, (_, k) => {
            const i = visibleRange.startIdx + k;
            return (
              <div
                key={i}
                className={`absolute left-0 right-0 border-b border-(--color-border)/60 ${hoverRow === i ? 'bg-(--color-surface-2)' : ''}`}
                style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
              />
            );
          })}

          <WeekendShading scale={scale} totalDays={totalDays} height={innerHeight} />
          <TodayLine scale={scale} height={innerHeight} />

          {/* baseline bars — pre-pass behind current bars (Spec 002) */}
          {activeBaseline &&
            visibleOrder.slice(visibleRange.startIdx, visibleRange.endIdx).map((id, k) => {
              const idx = visibleRange.startIdx + k;
              const state = overlayStates.get(id);
              if (!state || state.kind === 'no-baseline' || state.kind === 'added') return null;
              return <BaselineBar key={`baseline-${id}`} taskId={id} rowIndex={idx} scale={scale} state={state} />;
            })}

          {/* bars (windowed) */}
          {visibleOrder.slice(visibleRange.startIdx, visibleRange.endIdx).map((id, k) => {
            const idx = visibleRange.startIdx + k;
            const task = tasks.get(id);
            const sched = schedule.scheduled.get(id);
            if (!task || !sched) return null;
            return (
              <div
                key={id}
                onClick={e => { e.stopPropagation(); toggleSelection(id, e.shiftKey || e.metaKey || e.ctrlKey); }}
              >
                <TaskBar
                  task={task}
                  scheduled={sched}
                  rowIndex={idx}
                  scale={scale}
                  isSummary={summaryIds.has(id)}
                  displayProgressPct={progressByTaskId.get(id) ?? task.progressPct}
                  onPointerDown={(e, mode) => onPointerDown(e, id, mode)}
                  overlayState={overlayStates.get(id)}
                />
              </div>
            );
          })}

          {/* dependencies — render only those touching the visible range */}
          <DependencyLayer
            scale={scale}
            rowsById={rowsById}
            totalRows={totalRows}
            width={width}
            visibleRange={visibleRange}
          />

          <LinkPreview link={link} />
        </div>
      </div>
      {ghost && <div className="absolute inset-0 pointer-events-none" style={{ top: HEADER_HEIGHT }} />}
      <SlipSenseTag info={slipSense} />
    </div>
  );
}
