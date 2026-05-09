import { useProjectStore } from '../../store/projectStore';
import { Lock } from 'lucide-react';
import type { BaselineHeaderDto } from '../../api/types';

interface Props {
  /** When provided, used to fetch full payloads on demand. */
  projectId?: string;
}

function fmtTs(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Spec 002 — chronological, immutable list of every baseline event for the
 * current project. Reads from the store only. View-only — there are no edit
 * or delete affordances (FR-005, FR-016).
 */
export function BaselineHistoryPanel({ projectId }: Props) {
  const headers = useProjectStore(s => s.baselineHeaders);
  const loadBaselinePayload = useProjectStore(s => s.loadBaselinePayload);

  if (headers.length === 0) {
    return (
      <div
        data-testid="baseline-history-empty"
        className="p-6 rounded-xl border border-(--color-border) bg-(--color-surface)"
      >
        <h3 className="text-[14px] font-semibold mb-1">Baseline history</h3>
        <p className="text-[12.5px] text-(--color-ink-muted)">
          No baselines have been captured for this project yet.
        </p>
      </div>
    );
  }

  // Newest-first by versionIndex
  const ordered = [...headers].sort((a, b) => b.versionIndex - a.versionIndex);
  const latestVersionIndex = ordered[0].versionIndex;

  return (
    <div
      data-testid="baseline-history-panel"
      className="p-4 rounded-xl border border-(--color-border) bg-(--color-surface)"
    >
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-[14px] font-semibold">Baseline history</h3>
        <span className="text-[11.5px] text-(--color-ink-muted)">
          {ordered.length} version{ordered.length === 1 ? '' : 's'}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {ordered.map(h => (
          <li
            key={h.id}
            data-testid={`baseline-row-${h.versionLabel}`}
            className="p-3 rounded-lg border border-(--color-border)"
          >
            <div className="flex items-start gap-3">
              <span className="px-2 h-7 inline-flex items-center justify-center rounded-md bg-(--color-surface-2) font-mono text-[13px] font-bold">
                {h.versionLabel}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">
                  {h.createdBy.fullName}
                </div>
                <div className="text-[11.5px] text-(--color-ink-muted) tabular">
                  {fmtTs(h.createdAt)}
                </div>
                <div className="mt-1 text-[12.5px] text-(--color-ink-2) line-clamp-2">
                  {h.rationale}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {(h.versionIndex === latestVersionIndex || h.versionIndex === 0) && (
                  <Tag tone={h.versionIndex === 0 ? 'brand' : 'success'}>
                    {h.versionIndex === 0 ? 'ORIGINAL' : 'LATEST'}
                  </Tag>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--color-surface-2) text-[10.5px] font-semibold text-(--color-ink-2)">
                  <Lock size={10} /> Immutable
                </span>
              </div>
            </div>
            {projectId && (
              <button
                type="button"
                className="mt-2 text-[11.5px] font-medium text-(--color-accent-700) hover:underline"
                onClick={() => void loadBaselinePayload(projectId, h.id)}
              >
                View snapshot →
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: 'brand' | 'success' }) {
  const cls =
    tone === 'brand'
      ? 'bg-(--color-accent-100,_#BAE6FD) text-(--color-accent-700,_#0369A1)'
      : 'bg-(--color-success-bg,_#DCFCE7) text-(--color-success,_#16A34A)';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-semibold tracking-widest ${cls}`}>
      {children}
    </span>
  );
}

// Re-export for tests that want to make their own headers
export type { BaselineHeaderDto };
