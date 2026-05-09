import { motion } from 'motion/react';
import { dateToX, ROW_HEIGHT, type TimeScale } from './timeScale';
import { addDays } from 'date-fns';
import { cn } from '../../lib/cn';
import type { RowOverlayState } from './baselineOverlay';

interface Props {
  taskId: string;
  rowIndex: number;
  scale: TimeScale;
  state: RowOverlayState;
}

/**
 * The secondary "baseline" bar drawn behind the current TaskBar. Renders
 * nothing for `no-baseline`, `added`. For `removed` rows the current bar is
 * suppressed (TaskBar contract); BaselineBar takes the row alone.
 *
 * Visual treatments are advisory; the contract pins data-* attributes so
 * tests don't couple to colours.
 */
export function BaselineBar({ taskId, rowIndex, scale, state }: Props) {
  if (state.kind === 'no-baseline') return null;
  if (state.kind === 'added') return null;
  const baselineBar = state.baselineBar;
  if (!baselineBar) return null;

  const x = dateToX(baselineBar.startDate, scale);
  const xEnd = dateToX(addDays(baselineBar.finishDate, 1), scale);
  const width = Math.max(8, xEnd - x);
  // For variant rows we render the baseline bar in a SECOND lane below the
  // current bar so both are visible without overlap. For unchanged/removed
  // we share the row vertically (variant lane is offset by 6px).
  const lane = state.kind === 'variant' ? 16 : 6;
  const top = rowIndex * ROW_HEIGHT + (ROW_HEIGHT - 22) / 2 + lane;

  const isRemoved = state.kind === 'removed';

  return (
    <motion.div
      data-baseline-bar={taskId}
      data-baseline-state={state.kind}
      layoutId={`baseline-${taskId}`}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={cn(
        'absolute z-[5] pointer-events-none rounded',
        // Outline-only treatment for the baseline bar (clearly distinct from
        // the filled current bar).
        'border-[1.5px] border-(--color-bar-baseline,_#94A3B8)',
      )}
      style={{
        left: x,
        top,
        width,
        height: state.kind === 'variant' ? 8 : 10,
        opacity: isRemoved ? 0.85 : 1,
      }}
    >
      {isRemoved && (
        <div
          data-testid={`baseline-strike-${taskId}`}
          className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-(--color-danger,_#DC2626)"
        />
      )}
    </motion.div>
  );
}
