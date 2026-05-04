import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { Criterion } from '../../api/types';

interface Props {
  criteria: Criterion[];
  scores: Record<string, number>;
  range: { min: number; max: number };
}

interface RadarPoint {
  /** Short label rendered on the polar axis. */
  label: string;
  /** Effective "goodness" value plotted on the radar. */
  value: number;
  /** Original raw score the user entered. */
  raw: number;
  /** Whether this criterion is inverse (lower-is-better). */
  isInverse: boolean;
  /** Per-criterion outer ring (used in tooltip; the chart itself uses globalMax). */
  fullMark: number;
  /** Description text for tooltip. */
  description: string | null;
}

/**
 * Compute the value to plot on the radar so that "further out = better" for every criterion.
 *
 * - Non-inverse: plot the raw score directly (within [min, max]).
 * - Inverse:     plot (max - raw + min) so that low raw values become high plotted values.
 *
 * Example with scale 0..5 on an inverse criterion:
 *   raw=0 → plotted=5 (best — lowest risk)
 *   raw=5 → plotted=0 (worst — highest risk)
 */
function effectiveValue(raw: number, isInverse: boolean, range: { min: number; max: number }): number {
  const clamped = Math.max(range.min, Math.min(range.max, raw));
  return isInverse ? range.max - clamped + range.min : clamped;
}

export function ScoreRadar({ criteria, scores, range }: Props) {
  if (criteria.length === 0) return null;

  const data: RadarPoint[] = criteria.map(c => {
    const raw = scores[c.id] ?? range.min;
    return {
      label: c.label,
      value: effectiveValue(raw, c.isInverse, range),
      raw,
      isInverse: c.isInverse,
      fullMark: range.max,
      description: c.description,
    };
  });

  // Single uniform radius axis = version's score range.
  const globalMax = range.max;

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-md p-4">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-[13px] font-semibold">Self-assessment radar</div>
        <div className="text-[11px] text-(--color-ink-muted)">
          Higher = better (inverse criteria are flipped)
        </div>
      </div>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="#e4e4e7" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#525252' }}
            />
            <PolarRadiusAxis
              domain={[range.min, globalMax]}
              tick={{ fontSize: 10, fill: '#a1a1aa' }}
              tickCount={Math.min(globalMax - range.min + 1, 6)}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#0ea5e9"
              fill="#0ea5e9"
              fillOpacity={0.3}
              isAnimationActive={false}
            />
            <Tooltip
              cursor={{ stroke: '#0ea5e9', strokeWidth: 1 }}
              content={(props) => {
                const payload = (props.payload ?? []) as unknown as Array<{ payload: RadarPoint }>;
                if (payload.length === 0) return null;
                const p = payload[0].payload;
                return (
                  <div className="bg-(--color-surface) border border-(--color-border) rounded-md shadow-(--shadow-popover) px-3 py-2 text-[12px]">
                    <div className="font-semibold mb-0.5">{p.label}</div>
                    {p.description && (
                      <div className="text-(--color-ink-muted) mb-1 max-w-xs">{p.description}</div>
                    )}
                    <div className="tabular">
                      Raw score: <strong>{p.raw}</strong> / {p.fullMark}
                      {p.isInverse && <span className="text-amber-700 ml-1">(inverse)</span>}
                    </div>
                    <div className="tabular">
                      Plotted: <strong>{p.value}</strong> / {p.fullMark}
                    </div>
                  </div>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
