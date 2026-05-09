import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import type { BaselineHeaderDto } from '../../api/types';
import { cn } from '../../lib/cn';

export interface BaselineVersionSelectorProps {
  headers: BaselineHeaderDto[];               // assumed newest-first
  active: 'latest' | string;
  onChange: (next: 'latest' | string) => void;
}

/**
 * Spec 002 — header dropdown for selecting the active baseline reference.
 * - Hidden when headers.length <= 1 (FR-013).
 * - Default 'latest' resolves to the newest baseline at render time.
 * - Selection is session-scoped (R9); the parent owns the active value.
 */
export function BaselineVersionSelector({ headers, active, onChange }: BaselineVersionSelectorProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Hide when ≤ 1 baseline (FR-013).
  if (headers.length <= 1) return null;

  const latestHeader = headers.reduce((best, h) =>
    !best || h.versionIndex > best.versionIndex ? h : best,
  undefined as BaselineHeaderDto | undefined);

  const activeLabel =
    active === 'latest'
      ? `${latestHeader?.versionLabel ?? 'latest'} · latest`
      : headers.find(h => h.id === active)?.versionLabel ?? '—';

  return (
    <div ref={wrapRef} className="relative" data-testid="baseline-version-selector">
      <button
        type="button"
        aria-label="Baseline version"
        className="inline-flex items-center gap-2 h-8 px-3 rounded-md bg-(--color-surface) border border-(--color-border-strong,_#D6D3D1) hover:border-(--color-brand) text-[12px] font-medium"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-(--color-ink-muted)">Baseline:</span>
        <span data-testid="baseline-active-label" className="font-semibold text-(--color-ink)">
          {activeLabel}
        </span>
        <ChevronDown size={12} className="text-(--color-ink-muted)" />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Baseline versions"
          className="absolute top-full mt-1 right-0 w-72 z-30 rounded-xl border border-(--color-border) bg-(--color-surface) shadow-lg p-2"
        >
          <div className="px-2 pt-1 pb-2 text-[10.5px] font-semibold tracking-widest text-(--color-ink-muted)">
            COMPARE AGAINST
          </div>
          <Option
            label="Latest baseline"
            sub={latestHeader ? `Resolves to ${latestHeader.versionLabel} today` : undefined}
            selected={active === 'latest'}
            onClick={() => {
              onChange('latest');
              setOpen(false);
            }}
            testId="baseline-option-latest"
          />
          {headers.map(h => (
            <Option
              key={h.id}
              label={h.versionLabel}
              sub={`${h.createdBy.fullName} · ${formatTs(h.createdAt)} · "${truncate(h.rationale, 36)}"`}
              selected={active === h.id}
              onClick={() => {
                onChange(h.id);
                setOpen(false);
              }}
              testId={`baseline-option-${h.versionLabel}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Option({
  label,
  sub,
  selected,
  onClick,
  testId,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      role="option"
      data-testid={testId}
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        'w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-(--color-surface-2)',
        selected && 'bg-(--color-accent-50,_#E0F2FE)',
      )}
    >
      <span
        className={cn(
          'shrink-0 mt-1 inline-block w-3.5 h-3.5 rounded-full',
          selected
            ? 'border-[4px] border-(--color-accent-600,_#0284C7) bg-(--color-surface)'
            : 'border border-(--color-border-strong,_#D6D3D1) bg-(--color-surface)',
        )}
      />
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-semibold text-(--color-ink)">{label}</span>
        {sub && (
          <span className="block text-[11.5px] text-(--color-ink-muted) truncate">{sub}</span>
        )}
      </span>
    </button>
  );
}

function formatTs(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
