import { Trophy } from 'lucide-react';
import { navigate } from '../../lib/router';

interface Props {
  items: Array<{ id: string; name: string; score: number; budget: number; status: string }>;
}

export function TopProjects({ items }: Props) {
  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-(--color-border) flex items-center gap-2">
        <Trophy size={14} className="text-amber-500" />
        <div className="text-[14px] font-semibold tracking-tight">Top projects</div>
        <div className="text-[11px] text-(--color-ink-muted) ml-1">Ranked by score</div>
      </div>
      {items.length === 0 ? (
        <div className="text-[12px] text-(--color-ink-muted) py-6 text-center">
          No scored projects yet.
        </div>
      ) : (
        <ul className="divide-y divide-(--color-border)/60">
          {items.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => navigate(`/p/${p.id}`)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-(--color-surface-2) transition-colors text-left"
              >
                <div className="w-6 h-6 rounded bg-(--color-brand-soft) text-(--color-brand-strong) flex items-center justify-center text-[11px] font-semibold tabular">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-(--color-ink-muted)">
                    {p.status} · ${p.budget.toLocaleString()}
                  </div>
                </div>
                <div className="text-[14px] font-semibold tabular text-(--color-brand-strong)">
                  {p.score.toFixed(2)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
