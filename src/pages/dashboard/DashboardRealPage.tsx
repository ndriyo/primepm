import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, ArrowUpRight, Lock } from 'lucide-react';
import { PpShell } from '../../components/layout/PpShell';
import { apiClient } from '../../api/client';
import type { DashboardData, ProjectSummary } from '../../api/types';
import { navigate } from '../../lib/router';
import { KpiCard, Card, Pill } from './DashboardCommon';

function ragForStatus(status: string): 'green' | 'amber' | 'red' | 'blue' {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('approved') || s.includes('completed')) return 'green';
  if (s.includes('hold') || s.includes('paused') || s.includes('blocked')) return 'red';
  if (s.includes('review') || s.includes('pending')) return 'amber';
  return 'blue';
}

export function DashboardRealPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.getDashboard().catch(() => null),
      apiClient.listProjects().catch(() => ({ projects: [] as ProjectSummary[] })),
    ]).then(([dash, list]) => {
      if (cancelled) return;
      if (dash) setData(dash);
      setProjects(list.projects);
    }).catch(e => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, []);

  const totalProjects = data?.counts.total ?? projects.length;
  const totalBudget = data?.totals.budget ?? 0;
  const totalMandays = data?.totals.mandays ?? 0;
  const approved = data?.counts.approved ?? 0;
  const pending = data?.counts.pending ?? 0;

  return (
    <PpShell crumbs={[{ label: 'Dashboard' }]}>
      <div className="pp-page">
        <div className="pp-page-head pp-fade-in">
          <div>
            <h1 className="pp-page-title">Portfolio command center</h1>
            <div className="pp-page-sub">
              {totalProjects} project{totalProjects === 1 ? '' : 's'} in your workspace
              {data?.byStatus && data.byStatus.length > 0
                ? ` · ${data.byStatus.length} statuses tracked`
                : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="pp-btn" onClick={() => navigate('/projects')}>
              <Calendar size={14} /> Browse projects
            </button>
            <button className="pp-btn primary" onClick={() => navigate('/projects/new')}>
              <TrendingUp size={14} /> Submit project
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: 16, color: 'var(--pp-red)', background: 'var(--pp-red-bg)', borderRadius: 10, marginBottom: 20 }}>
            Failed to load: {error}
          </div>
        )}

        {/* KPI cards — only the metrics we actually have */}
        <div className="pp-kpi-grid">
          <KpiCard
            label="Projects"
            value={totalProjects}
            unit=""
            delta={`${approved} approved · ${pending} pending`}
          />
          <KpiCard
            label="Total budget"
            value={`$${totalBudget.toFixed(1)}`}
            unit="K"
            delta="across all projects"
          />
          <KpiCard
            label="Total effort"
            value={Math.round(totalMandays).toString()}
            unit="mandays"
            delta="planned across all projects"
          />
          <KpiCard
            label="Avg score"
            value={
              data && data.topProjects.length > 0
                ? (data.topProjects.reduce((a, p) => a + p.score, 0) / data.topProjects.length).toFixed(2)
                : '—'
            }
            delta={`top ${data?.topProjects.length ?? 0} by score`}
          />
          <KpiCard
            label="Statuses"
            value={data?.byStatus.length ?? 0}
            delta="distinct project statuses"
          />
        </div>

        {/* Real data lives here */}
        <div className="pp-row cols-portfolio">
          <Card title="Top projects" eyebrow="by score" meta={`${data?.topProjects.length ?? 0} ranked`}>
            {!data || data.topProjects.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--pp-text-3)' }}>
                No scored projects yet. Submit a project to see scores here.
              </div>
            ) : (
              <div className="pp-proj-list">
                {data.topProjects.map((p) => (
                  <button
                    key={p.id}
                    className="pp-proj-row"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <div className="pp-proj-icon">{p.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="nm">{p.name}</div>
                      <div className="sub">{p.status}</div>
                    </div>
                    <div><Pill kind={ragForStatus(p.status)}>{p.status}</Pill></div>
                    <div className="pp-num tabular">${(p.budget ?? 0).toFixed(1)}K</div>
                    <div className="pp-num tabular">Score {p.score.toFixed(2)}</div>
                    <ArrowUpRight size={14} className="pp-muted" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card title="By status" meta={`${data?.byStatus.length ?? 0} statuses`}>
            {!data || data.byStatus.length === 0 ? (
              <div style={{ padding: 24, color: 'var(--pp-text-3)' }}>No projects yet.</div>
            ) : (
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.byStatus.map(b => {
                  const max = Math.max(...data.byStatus.map(s => s.count));
                  return (
                    <div key={b.status} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--pp-text-2)' }}>{b.status}</span>
                      <div className="pp-bbar">
                        <i style={{ width: `${(b.count / max) * 100}%`, background: 'var(--pp-accent)' }} />
                      </div>
                      <span className="pp-num tabular" style={{ fontSize: 12 }}>{b.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Modules pending real data */}
        <div className="pp-row cols-2">
          <SoonCard title="Strategic alignment" subtitle="Link projects to OKRs / KRs" />
          <SoonCard title="Cross-project dependencies" subtitle="Map blocking links across the portfolio" />
        </div>

        <div className="pp-row cols-2">
          <SoonCard title="Benefits realization" subtitle="Plan / forecast / realized cumulative" />
          <SoonCard title="Risk heatmap" subtitle="5×5 probability × impact" />
        </div>
      </div>
    </PpShell>
  );
}

function SoonCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pp-card">
      <div className="pp-card-head">
        <h3>{title}<span className="pp-soon-badge" style={{ marginLeft: 6 }}>Soon</span></h3>
      </div>
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--pp-text-3)', textAlign: 'center' }}>
        <Lock size={20} />
        <div style={{ fontSize: 13, color: 'var(--pp-text-2)' }}>{subtitle}</div>
        <div style={{ fontSize: 11.5 }}>Coming once the underlying data model lands</div>
      </div>
    </div>
  );
}
