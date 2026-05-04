import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface TooltipProps {
  label: ReactNode;
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
}

export function Tooltip({ label, shortcut, side = 'bottom', children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-(--color-ink) px-2 py-1 text-[11px] font-medium text-white shadow-(--shadow-popover)',
            side === 'top' && 'left-1/2 bottom-full -translate-x-1/2 mb-1.5',
            side === 'bottom' && 'left-1/2 top-full -translate-x-1/2 mt-1.5',
            side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-1.5',
            side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-1.5',
          )}
        >
          {label}
          {shortcut && (
            <kbd className="ml-2 rounded bg-white/15 px-1.5 py-px font-mono text-[10px] tracking-wide">
              {shortcut}
            </kbd>
          )}
        </span>
      )}
    </span>
  );
}
