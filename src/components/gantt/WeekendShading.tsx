import { addDays } from 'date-fns';
import { isWorkingDay } from '../../engine';
import { useProjectStore } from '../../store/projectStore';
import type { TimeScale } from './timeScale';

interface Props {
  scale: TimeScale;
  totalDays: number;
  height: number;
}

export function WeekendShading({ scale, totalDays, height }: Props) {
  const calendar = useProjectStore(s => s.calendar);
  // For zoom levels coarser than week, weekend shading is too noisy.
  if (scale.zoom !== 'day' && scale.zoom !== 'week') return null;

  const cells: { x: number; w: number }[] = [];
  let runStart: number | null = null;
  for (let i = 0; i <= totalDays; i++) {
    const d = addDays(scale.origin, i);
    const off = !isWorkingDay(d, calendar);
    if (off && runStart === null) runStart = i;
    if (!off && runStart !== null) {
      cells.push({ x: runStart * scale.pxPerDay, w: (i - runStart) * scale.pxPerDay });
      runStart = null;
    }
  }
  if (runStart !== null) {
    cells.push({ x: runStart * scale.pxPerDay, w: (totalDays - runStart) * scale.pxPerDay });
  }

  return (
    <>
      {cells.map((c, i) => (
        <div
          key={i}
          className="absolute top-0 bg-(--color-weekend) pointer-events-none"
          style={{ left: c.x, width: c.w, height }}
        />
      ))}
    </>
  );
}
