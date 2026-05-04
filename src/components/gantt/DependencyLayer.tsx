import { useMemo, useState } from 'react';
import type { Dependency, ScheduledTask, Task } from '../../engine';
import { addWorkingDays } from '../../engine';
import { dateToX, ROW_HEIGHT, type TimeScale } from './timeScale';
import { useProjectStore } from '../../store/projectStore';

interface Props {
  scale: TimeScale;
  rowsById: Map<string, number>;
  totalRows: number;
  width: number;
  visibleRange?: { startIdx: number; endIdx: number };
}

interface AnchorPoint {
  x: number;
  y: number;
}

function getAnchors(
  task: Task,
  sched: ScheduledTask,
  rowIndex: number,
  scale: TimeScale,
  calendar: Parameters<typeof addWorkingDays>[2],
): { start: AnchorPoint; finish: AnchorPoint } {
  const xStart = dateToX(sched.start, scale);
  const xEnd = dateToX(addWorkingDays(sched.finish, 1, calendar), scale);
  const y = rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
  if (task.isMilestone) {
    return { start: { x: xStart, y }, finish: { x: xStart, y } };
  }
  return { start: { x: xStart, y }, finish: { x: xEnd, y } };
}

/**
 * Build an SVG path from a dependency's anchor points.
 * Routing varies by dep type. Always uses orthogonal routing with a small
 * elbow + a smooth bezier mid-segment for organic feel.
 */
function buildPath(from: AnchorPoint, to: AnchorPoint, type: Dependency['type']): string {
  const PAD = 8;
  let p1: AnchorPoint, p2: AnchorPoint, p3: AnchorPoint, p4: AnchorPoint;
  switch (type) {
    case 'FS':
      p1 = from;
      p2 = { x: from.x + PAD, y: from.y };
      p3 = { x: to.x - PAD, y: to.y };
      p4 = to;
      break;
    case 'SS':
      p1 = from;
      p2 = { x: Math.min(from.x, to.x) - PAD, y: from.y };
      p3 = { x: Math.min(from.x, to.x) - PAD, y: to.y };
      p4 = to;
      break;
    case 'FF':
      p1 = from;
      p2 = { x: Math.max(from.x, to.x) + PAD, y: from.y };
      p3 = { x: Math.max(from.x, to.x) + PAD, y: to.y };
      p4 = to;
      break;
    case 'SF':
      p1 = from;
      p2 = { x: from.x - PAD, y: from.y };
      p3 = { x: to.x + PAD, y: to.y };
      p4 = to;
      break;
  }
  const midX = (p2.x + p3.x) / 2;
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} C ${midX} ${p2.y}, ${midX} ${p3.y}, ${p3.x} ${p3.y} L ${p4.x} ${p4.y}`;
}

const DEP_COLORS: Record<Dependency['type'], string> = {
  FS: '#0f172a',
  SS: '#7c3aed',
  FF: '#0d9488',
  SF: '#d97706',
};

export function DependencyLayer({ scale, rowsById, totalRows, width, visibleRange }: Props) {
  const tasks = useProjectStore(s => s.tasks);
  const dependencies = useProjectStore(s => s.dependencies);
  const calendar = useProjectStore(s => s.calendar);
  const schedule = useProjectStore(s => s.schedule);
  const deleteDependency = useProjectStore(s => s.deleteDependency);

  const [hoveredDep, setHoveredDep] = useState<string | null>(null);

  const renderable = useMemo(() => {
    const items: Array<{
      id: string;
      d: string;
      mid: AnchorPoint;
      type: Dependency['type'];
      lag: number;
    }> = [];
    for (const dep of dependencies.values()) {
      const pred = tasks.get(dep.predecessorId);
      const succ = tasks.get(dep.successorId);
      const predSched = schedule.scheduled.get(dep.predecessorId);
      const succSched = schedule.scheduled.get(dep.successorId);
      const predRow = rowsById.get(dep.predecessorId);
      const succRow = rowsById.get(dep.successorId);
      if (!pred || !succ || !predSched || !succSched || predRow === undefined || succRow === undefined) continue;
      if (visibleRange) {
        const minRow = Math.min(predRow, succRow);
        const maxRow = Math.max(predRow, succRow);
        // Skip if both endpoints are above or below the visible window.
        if (maxRow < visibleRange.startIdx || minRow > visibleRange.endIdx) continue;
      }
      const predA = getAnchors(pred, predSched, predRow, scale, calendar);
      const succA = getAnchors(succ, succSched, succRow, scale, calendar);
      let from: AnchorPoint, to: AnchorPoint;
      switch (dep.type) {
        case 'FS': from = predA.finish; to = succA.start; break;
        case 'SS': from = predA.start; to = succA.start; break;
        case 'FF': from = predA.finish; to = succA.finish; break;
        case 'SF': from = predA.start; to = succA.finish; break;
      }
      items.push({
        id: dep.id,
        d: buildPath(from, to, dep.type),
        mid: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
        type: dep.type,
        lag: dep.lagDays,
      });
    }
    return items;
  }, [tasks, dependencies, schedule, rowsById, scale, calendar, visibleRange]);

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={width}
      height={totalRows * ROW_HEIGHT}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {(['FS', 'SS', 'FF', 'SF'] as const).map(t => (
          <marker
            key={t}
            id={`arrow-${t}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill={DEP_COLORS[t]} />
          </marker>
        ))}
      </defs>
      {renderable.map(item => {
        const hovered = hoveredDep === item.id;
        return (
          <g key={item.id} className="pointer-events-auto">
            {/* Hit zone (transparent thick) for easier hovering */}
            <path
              d={item.d}
              stroke="transparent"
              strokeWidth={10}
              fill="none"
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredDep(item.id)}
              onMouseLeave={() => setHoveredDep(null)}
            />
            <path
              d={item.d}
              stroke={DEP_COLORS[item.type]}
              strokeWidth={hovered ? 1.6 : 1.2}
              fill="none"
              markerEnd={`url(#arrow-${item.type})`}
              style={{ pointerEvents: 'none', transition: 'stroke-width 100ms' }}
            />
            {hovered && (
              <g
                onClick={e => { e.stopPropagation(); deleteDependency(item.id); }}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={item.mid.x} cy={item.mid.y} r={9} fill="#0f172a" />
                <path
                  d={`M ${item.mid.x - 3} ${item.mid.y - 3} L ${item.mid.x + 3} ${item.mid.y + 3} M ${item.mid.x + 3} ${item.mid.y - 3} L ${item.mid.x - 3} ${item.mid.y + 3}`}
                  stroke="white"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              </g>
            )}
            {hovered && (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={item.mid.x + 14}
                  y={item.mid.y - 9}
                  rx={4}
                  width={item.lag !== 0 ? 50 : 26}
                  height={18}
                  fill="white"
                  stroke="#e4e4e7"
                />
                <text
                  x={item.mid.x + 27}
                  y={item.mid.y + 3}
                  fontSize={10}
                  fontWeight={600}
                  fill={DEP_COLORS[item.type]}
                  textAnchor="middle"
                  fontFamily="ui-sans-serif, system-ui"
                >
                  {item.type}
                  {item.lag !== 0 ? `${item.lag > 0 ? '+' : ''}${item.lag}d` : ''}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
