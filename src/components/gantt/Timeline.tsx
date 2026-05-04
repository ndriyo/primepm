import { generateTicks, HEADER_HEIGHT, type TimeScale } from './timeScale';

interface Props {
  scale: TimeScale;
  totalDays: number;
  width: number;
}

export function Timeline({ scale, totalDays, width }: Props) {
  const { major, minor } = generateTicks(scale, totalDays);

  return (
    <div
      className="relative bg-(--color-surface) border-b border-(--color-border) sticky top-0 z-20"
      style={{ height: HEADER_HEIGHT, width }}
    >
      {/* Major row */}
      <div className="absolute inset-x-0 top-0 h-7 border-b border-(--color-border)">
        {major.map((tick, i) => (
          <div
            key={`maj-${i}`}
            className="absolute top-0 bottom-0 flex items-center pl-2 text-[11px] font-medium uppercase tracking-wide text-(--color-ink-muted) border-l border-(--color-border-strong)"
            style={{ left: tick.x }}
          >
            {tick.label}
          </div>
        ))}
      </div>
      {/* Minor row */}
      <div className="absolute inset-x-0 top-7 bottom-0">
        {minor.map((tick, i) => (
          <div
            key={`min-${i}`}
            className="absolute top-0 bottom-0 flex items-center justify-center text-[10px] tabular text-(--color-ink-subtle) border-l border-(--color-border)"
            style={{ left: tick.x, width: scale.pxPerDay }}
          >
            <span className={scale.zoom === 'day' ? 'block' : ''}>{tick.label}</span>
          </div>
        ))}
        {/* When zoom is day, show weekday under day number */}
        {scale.zoom === 'day' && (
          <>
            {minor.map((tick, i) => (
              <div
                key={`dow-${i}`}
                className="absolute top-3.5 flex items-center justify-center text-[9px] uppercase tracking-wide text-(--color-ink-subtle)"
                style={{ left: tick.x, width: scale.pxPerDay }}
              >
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][tick.date.getDay()]}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
