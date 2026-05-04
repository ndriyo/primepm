import { format } from 'date-fns';
import type { ResourceUtilization } from '../../lib/utilization';

interface Props {
  utilization: ResourceUtilization;
  width: number;
  height?: number;
}

/**
 * Per-day utilization strip. One bar per day, height proportional to %, capped
 * visually at 150% to keep layout sane. Red where pct > 100, sky-blue otherwise,
 * grey for non-working days.
 */
export function UtilizationStrip({ utilization, width, height = 36 }: Props) {
  const total = utilization.byDay.length;
  if (total === 0) return null;
  const pxPerDay = width / total;
  // Cap visual height at 150% so the strip doesn't tower
  const VISUAL_CAP = 150;

  return (
    <div
      className="relative bg-(--color-surface-2) rounded overflow-hidden border border-(--color-border)"
      style={{ width, height }}
      title={
        utilization.peakPct > 100
          ? `Peak ${Math.round(utilization.peakPct)}% — ${utilization.overAllocDays} over-allocated working days`
          : `Peak ${Math.round(utilization.peakPct)}% allocation`
      }
    >
      {/* 100% reference line */}
      <div
        className="absolute left-0 right-0 border-t border-dashed border-(--color-ink-subtle)/30 pointer-events-none"
        style={{ top: height - (height * 100) / VISUAL_CAP }}
      />
      {utilization.byDay.map(d => {
        const display = Math.min(d.pct, VISUAL_CAP);
        const h = (height * display) / VISUAL_CAP;
        const x = d.dayIndex * pxPerDay;
        const w = Math.max(1, pxPerDay - 0.5);
        const over = d.pct > 100;
        return (
          <div
            key={d.dayIndex}
            className={
              !d.isWorkingDay
                ? 'absolute bottom-0 bg-zinc-200/60'
                : over
                  ? 'absolute bottom-0 bg-(--color-bar-critical)'
                  : 'absolute bottom-0 bg-(--color-brand)/70'
            }
            style={{
              left: x,
              width: w,
              height: !d.isWorkingDay ? height : h,
              opacity: !d.isWorkingDay ? 0.4 : 1,
            }}
            title={`${format(d.date, 'EEE, MMM d')} — ${Math.round(d.pct)}%`}
          />
        );
      })}
      {/* Show first/last labels */}
      <div className="absolute -bottom-4 left-0 text-[9px] tabular text-(--color-ink-subtle) pointer-events-none">
        {format(utilization.byDay[0].date, 'MMM d')}
      </div>
      <div className="absolute -bottom-4 right-0 text-[9px] tabular text-(--color-ink-subtle) pointer-events-none">
        {format(utilization.byDay[total - 1].date, 'MMM d')}
      </div>
    </div>
  );
}
