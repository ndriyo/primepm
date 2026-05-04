import { useEffect, useState } from 'react';
import { Calendar, ArrowLeft, Edit, Trash2, GanttChart } from 'lucide-react';
import { PpShell } from '../../components/layout/PpShell';
import { apiClient } from '../../api/client';
import type { Criterion, ProjectFull, ProjectSummary } from '../../api/types';
import { navigate } from '../../lib/router';
import { formatCompact } from '../../lib/formatNumber';
import { Card, Pill } from '../dashboard/DashboardCommon';

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

export function OngoingProjectDetailPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectFull | null>(null);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [scores, setScores] = useState<Array<{ criterionId: string; score: number; comment: string | null }>>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.getProjectFull(projectId).catch((e) => { setError(String(e)); return null; }),
      apiClient.listProjects().catch(() => ({ projects: [] as ProjectSummary[] })),
      apiClient.getActiveCriteria().catch(() => ({ version: null, criteria: [] as Criterion[] })),
    ]).then(([full, list, active]) => {
      if (cancelled) return;
      if (full) {
        setProject(full.project);
        setScores(full.scores);
      }
      const s = list.projects.find(p => p.id === projectId);
      if (s) setSummary(s);
      setCriteria(active.criteria);
    });
    return () => { cancelled = true; };
  }, [projectId]);

  const criteriaById = new Map(criteria.map(c => [c.id, c]));

  const handleDelete = async () => {
    if (!confirm('Delete this project? All tasks, dependencies, and scores will be lost.')) return;
    try {
      await apiClient.deleteProject(projectId);
      navigate('/projects');
    } catch (e) {
      alert(`Failed to delete: ${e}`);
    }
  };

  return (
    <PpShell
      crumbs={[
        { label: 'Projects', onClick: () => navigate('/projects') },
        { label: 'Ongoing Project', onClick: () => navigate('/projects') },
        { label: project?.name ?? 'Project' },
      ]}
    >
      <div className="pp-page">
        <div className="pp-page-head pp-fade-in" style={{ marginBottom: 16 }}>
          <button className="pp-btn" onClick={() => navigate('/projects')}>
            <ArrowLeft size={14} /> Back to projects
          </button>
        </div>

        {error && !project && (
          <div style={{ padding: 16, color: 'var(--pp-red)', background: 'var(--pp-red-bg)', borderRadius: 10 }}>
            {error}
          </div>
        )}

        {project && (
          <>
            <div className="pp-page-head pp-fade-in">
              <div>
                <h1 className="pp-page-title">
                  {project.name}
                  <Pill kind={ragForStatus(project.status)}>{project.status}</Pill>
                </h1>
                <div className="pp-page-sub">
                  {fmtDate(project.startDate)} – {fmtDate(project.endDate)}
                  {summary?.taskCount != null ? ` · ${summary.taskCount} task${summary.taskCount === 1 ? '' : 's'}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="pp-btn" onClick={() => navigate(`/projects/new?edit=${projectId}`)}>
                  <Edit size={14} /> Edit
                </button>
                <button className="pp-btn primary" onClick={() => navigate(`/p/${projectId}`)}>
                  <GanttChart size={14} /> Schedule
                </button>
              </div>
            </div>

            <div className="pp-detail-grid">
              {/* Main column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {project.description && (
                  <Card title="Overview">
                    <div style={{ padding: 18, color: 'var(--pp-text-2)', whiteSpace: 'pre-wrap' }}>
                      {project.description}
                    </div>
                  </Card>
                )}

                <Card title="Schedule" eyebrow="Gantt + dependencies" meta="open the scheduler to plan">
                  <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <GanttChart size={28} className="pp-muted" />
                    <div style={{ fontSize: 13, color: 'var(--pp-text-2)', textAlign: 'center' }}>
                      Dive into the full Gantt scheduler to manage tasks, dependencies, calendars, and resources.
                    </div>
                    <button className="pp-btn primary" onClick={() => navigate(`/p/${projectId}`)}>
                      <GanttChart size={14} /> Open Schedule
                    </button>
                    {summary?.taskCount != null && (
                      <span className="pp-muted" style={{ fontSize: 11.5 }}>
                        {summary.taskCount === 0 ? 'No tasks yet' : `${summary.taskCount} task${summary.taskCount === 1 ? '' : 's'} planned`}
                      </span>
                    )}
                  </div>
                </Card>

                <Card title="Scoring" eyebrow={`${scores.length} criteria`}>
                  {scores.length === 0 ? (
                    <div style={{ padding: 18, color: 'var(--pp-text-3)' }}>
                      No scores recorded for this project.
                    </div>
                  ) : (
                    <div>
                      {scores.map(s => {
                        const c = criteriaById.get(s.criterionId);
                        const max = 5;
                        return (
                          <div key={s.criterionId} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 160px auto',
                            gap: 12,
                            alignItems: 'center',
                            padding: '12px 18px',
                            borderBottom: '1px solid var(--pp-border)',
                          }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pp-text)' }}>
                                {c?.label ?? s.criterionId}
                              </div>
                              {c?.description && (
                                <div style={{ fontSize: 11.5, color: 'var(--pp-text-3)', marginTop: 2 }}>
                                  {c.description}
                                </div>
                              )}
                            </div>
                            <div className="pp-bbar">
                              <i style={{
                                width: `${Math.min(100, (s.score / max) * 100)}%`,
                                background: 'var(--pp-accent)',
                              }} />
                            </div>
                            <span className="pp-num tabular" style={{ minWidth: 56, textAlign: 'right' }}>
                              {s.score.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              {/* Side column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card title="Project facts">
                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Fact label="Status" value={project.status} />
                    <Fact label="Start date" value={fmtDate(project.startDate)} />
                    <Fact label="End date" value={fmtDate(project.endDate)} />
                    <Fact label="Budget" value={project.budget != null ? `$${formatCompact(project.budget)}` : '—'} />
                    <Fact label="Resources" value={project.resources.toString()} />
                    {project.score != null && <Fact label="Weighted score" value={project.score.toFixed(2)} />}
                  </div>
                </Card>

                {project.tags.length > 0 && (
                  <Card title="Tags">
                    <div style={{ padding: 18, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {project.tags.map(t => (
                        <span key={t} className="pp-pill" style={{ background: 'var(--pp-surface-2)' }}>{t}</span>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="pp-card">
                  <div className="pp-card-head">
                    <h3 style={{ color: 'var(--pp-red)' }}>Danger zone</h3>
                  </div>
                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--pp-text-3)' }}>
                      Permanently delete this project. This cannot be undone.
                    </div>
                    <button
                      className="pp-btn"
                      style={{ color: 'var(--pp-red)', borderColor: 'var(--pp-red)' }}
                      onClick={() => void handleDelete()}
                    >
                      <Trash2 size={14} /> Delete project
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!project && !error && (
          <div style={{ padding: 24, color: 'var(--pp-text-3)' }}>
            <Calendar size={20} /> Loading project…
          </div>
        )}
      </div>
    </PpShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
      <span className="pp-muted">{label}</span>
      <span style={{ color: 'var(--pp-text)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
