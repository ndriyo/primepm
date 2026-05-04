import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/cn';

export type MenuItem =
  | {
      kind: 'item';
      label: string;
      icon?: ReactNode;
      shortcut?: string;
      onClick: () => void;
      danger?: boolean;
      disabled?: boolean;
    }
  | { kind: 'separator' }
  | { kind: 'header'; label: string };

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export function ContextMenu({ open, x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useLayoutEffect(() => {
    if (!open) return;
    // Clamp to viewport so the menu never overflows
    const margin = 8;
    const rect = ref.current?.getBoundingClientRect();
    const w = rect?.width ?? 220;
    const h = rect?.height ?? 320;
    const nx = Math.min(x, window.innerWidth - w - margin);
    const ny = Math.min(y, window.innerHeight - h - margin);
    setPos({ x: Math.max(margin, nx), y: Math.max(margin, ny) });
  }, [open, x, y, items.length]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.96, y: -2 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.08 }}
          role="menu"
          className="fixed z-[100] min-w-[220px] py-1 rounded-lg bg-(--color-surface) border border-(--color-border) shadow-(--shadow-popover)"
          style={{ left: pos.x, top: pos.y }}
          onContextMenu={e => e.preventDefault()}
        >
          {items.map((item, i) => {
            if (item.kind === 'separator') {
              return <div key={`sep-${i}`} className="my-1 border-t border-(--color-border)" />;
            }
            if (item.kind === 'header') {
              return (
                <div
                  key={`hdr-${i}`}
                  className="px-3 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-(--color-ink-subtle)"
                >
                  {item.label}
                </div>
              );
            }
            return (
              <button
                key={`itm-${i}`}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => { if (!item.disabled) { item.onClick(); onClose(); } }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 h-8 text-[13px] text-left transition-colors',
                  'disabled:opacity-40 disabled:cursor-default',
                  !item.disabled && (item.danger
                    ? 'hover:bg-red-50 hover:text-(--color-danger) text-(--color-ink)'
                    : 'hover:bg-(--color-brand-soft) text-(--color-ink)'),
                )}
              >
                {item.icon && <span className="text-(--color-ink-muted) flex-shrink-0 w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                <span className="flex-1 truncate">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[11px] tabular text-(--color-ink-subtle) flex-shrink-0">
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
