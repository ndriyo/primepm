import { Briefcase, CheckCircle2, Clock, DollarSign, Users } from 'lucide-react';

interface Props {
  counts: { total: number; approved: number; pending: number };
  totals: { budget: number; mandays: number };
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtMoney = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}K`
      : `${n.toFixed(0)}`;

export function BentoMetrics({ counts, totals }: Props) {
  const tiles = [
    { label: 'Total projects', value: fmt(counts.total), icon: <Briefcase size={14} />, accent: 'text-(--color-brand-strong) bg-(--color-brand-soft)' },
    { label: 'Approved / active', value: fmt(counts.approved), icon: <CheckCircle2 size={14} />, accent: 'text-emerald-700 bg-emerald-50' },
    { label: 'Pending review', value: fmt(counts.pending), icon: <Clock size={14} />, accent: 'text-amber-700 bg-amber-50' },
    { label: 'Total budget', value: fmtMoney(totals.budget), icon: <DollarSign size={14} />, accent: 'text-violet-700 bg-violet-50' },
    { label: 'Total mandays', value: fmt(totals.mandays), icon: <Users size={14} />, accent: 'text-rose-700 bg-rose-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tiles.map(t => (
        <div
          key={t.label}
          className="bg-(--color-surface) border border-(--color-border) rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wide text-(--color-ink-muted) font-semibold">
              {t.label}
            </div>
            <div className={`w-6 h-6 rounded flex items-center justify-center ${t.accent}`}>
              {t.icon}
            </div>
          </div>
          <div className="text-[22px] font-semibold tracking-tight tabular">{t.value}</div>
        </div>
      ))}
    </div>
  );
}
