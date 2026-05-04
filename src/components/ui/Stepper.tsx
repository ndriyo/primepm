import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface StepperProps {
  steps: Array<{ label: string }>;
  current: number; // 0-indexed
  onJump?: (index: number) => void;
}

export function Stepper({ steps, current, onJump }: StepperProps) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = onJump && i <= current;
        return (
          <li key={i} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump?.(i)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-[13px]',
                active && 'bg-(--color-brand-soft) text-(--color-brand-strong) font-semibold',
                done && 'text-(--color-ink-muted) hover:bg-(--color-surface-2)',
                !active && !done && 'text-(--color-ink-subtle)',
                !clickable && 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold',
                  active && 'bg-(--color-brand) text-white',
                  done && 'bg-emerald-500 text-white',
                  !active && !done && 'bg-(--color-surface-2) text-(--color-ink-muted)',
                )}
              >
                {done ? <Check size={11} /> : i + 1}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && (
              <span className={cn('w-6 h-px', done ? 'bg-emerald-400' : 'bg-(--color-border)')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
