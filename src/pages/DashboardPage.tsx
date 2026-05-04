import { useEffect, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { apiClient } from '../api/client';
import type { DashboardData } from '../api/types';
import { BentoMetrics } from './dashboard/BentoMetrics';
import { StatusChart } from './dashboard/StatusChart';
import { ScoreQuadrant } from './dashboard/ScoreQuadrant';
import { TopProjects } from './dashboard/TopProjects';

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getDashboard()
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'load_error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="h-full overflow-auto bg-(--color-bg)">
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-md bg-(--color-brand-soft) text-(--color-brand-strong) flex items-center justify-center">
            <LayoutDashboard size={16} />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Dashboard</h1>
            <p className="text-[13px] text-(--color-ink-muted)">
              Portfolio overview across your organization.
            </p>
          </div>
        </div>

        {error && <div className="mb-4 text-[13px] text-(--color-danger)">{error}</div>}

        {data === null && !error ? (
          <div className="text-[13px] text-(--color-ink-muted) py-12 text-center">Loading…</div>
        ) : data === null ? null : (
          <>
            <BentoMetrics counts={data.counts} totals={data.totals} />
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatusChart data={data.byStatus} />
              <ScoreQuadrant data={data.scoreQuadrant} />
            </div>
            <div className="mt-6">
              <TopProjects items={data.topProjects} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
