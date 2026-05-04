import { useEffect, useState } from 'react';
import { Plus, Filter, ArrowUpRight } from 'lucide-react';
import { PpShell } from '../../components/layout/PpShell';
import { apiClient } from '../../api/client';
import type { ProjectSummary } from '../../api/types';
import { navigate } from '../../lib/router';
import { Pill } from '../dashboard/DashboardCommon';

function ragForStatus(status: string): 'green' | 'amber' | 'red' | 'blue' {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('approved') || s.includes('completed')) return 'green';
  if (s.includes('hold') || s.includes('paused') || s.includes('blocked')) return 'red';
  if (s.includes('review') || s.includes('pending')) return 'amber';
  return 'blue';
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function OngoingProjectListPage() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.listProjects()
      .then(({ projects: list }) => { if (!cancelled) setProjects(list); })
      .catch(e => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, []);

  return (
    <PpShell crumbs={[{ label: 'Projects' }, { label: 'Ongoing Project' }]}>
      <div className="pp-page">
        <div className="pp-page-head pp-fade-in">
          <div>
            <h1 className="pp-page-title">Ongoing Project <em>· in flight</em></h1>
            <div className="pp-page-sub">
              {projects ? `${projects.length} active project${projects.length === 1 ? '' : 's'}` : 'Loading…'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="pp-btn"><Filter size={14} /> Filter</button>
            <button className="pp-btn primary" onClick={() => navigate('/projects/new')}>
              <Plus size={14} /> Submit project
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: 16, color: 'var(--pp-red)', background: 'var(--pp-red-bg)', borderRadius: 10, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <div className="pp-card pp-fade-in">
          <div className="pp-card-head">
            <h3>Projects <em>· active</em></h3>
            <span className="pp-head-meta">{projects?.length ?? 0} total</span>
          </div>
          {!projects ? (
            <div style={{ padding: 24, color: 'var(--pp-text-3)' }}>Loading projects…</div>
          ) : projects.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--pp-text-3)' }}>
              No projects yet. <button className="pp-btn primary" style={{ marginLeft: 12 }} onClick={() => navigate('/projects/new')}>Submit your first</button>
            </div>
          ) : (
            <div className="pp-proj-list">
              {projects.map(p => (
                <button
                  key={p.id}
                  className="pp-proj-row"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <div className="pp-proj-icon">{p.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div className="nm">{p.name}</div>
                    <div className="sub">
                      {fmtDate(p.startDate)} – {fmtDate(p.endDate)}
                      {p.taskCount > 0 ? ` · ${p.taskCount} task${p.taskCount === 1 ? '' : 's'}` : ''}
                    </div>
                  </div>
                  <div><Pill kind={ragForStatus(p.status)}>{p.status}</Pill></div>
                  <div className="pp-num tabular">${(p.budget ?? 0).toFixed(1)}K</div>
                  <div className="pp-num tabular">{p.score != null ? `Score ${p.score.toFixed(2)}` : '—'}</div>
                  <ArrowUpRight size={14} className="pp-muted" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PpShell>
  );
}
