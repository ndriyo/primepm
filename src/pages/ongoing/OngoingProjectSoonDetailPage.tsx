import { ArrowLeft, GanttChart, AlertTriangle } from 'lucide-react';
import { PpShell } from '../../components/layout/PpShell';
import {
  MOCK_PORTFOLIO,
  MOCK_RISKS,
  MOCK_TASKS,
  HEALTH_TRAIL,
} from '../../data/mockPortfolio';
import { navigate } from '../../lib/router';
import { Card, Pill, KpiCard } from '../dashboard/DashboardCommon';

export function OngoingProjectSoonDetailPage({ id }: { id: string }) {
  const project = MOCK_PORTFOLIO.find(p => p.id === id);
  if (!project) {
    return (
      <PpShell crumbs={[{ label: 'Projects' }, { label: 'Ongoing Project (Soon)' }, { label: 'Not found' }]}>
        <div className="pp-page">
          <div style={{ padding: 24, color: 'var(--pp-text-3)' }}>
            Project not found. <button className="pp-btn" onClick={() => navigate('/ongoing-soon')}>Back to list</button>
          </div>
        </div>
      </PpShell>
    );
  }

  const trail = HEALTH_TRAIL[project.id] ?? [];
  const tasks = MOCK_TASKS[project.id] ?? [];
  const risks = MOCK_RISKS.filter(r => r.project === project.id);

  return (
    <PpShell
      crumbs={[
        { label: 'Projects', onClick: () => navigate('/ongoing-soon') },
        { label: 'Ongoing Project (Soon)', onClick: () => navigate('/ongoing-soon') },
        { label: project.name },
      ]}
    >
      <div className="pp-page">
        <div className="pp-page-head pp-fade-in" style={{ marginBottom: 16 }}>
          <button className="pp-btn" onClick={() => navigate('/ongoing-soon')}>
            <ArrowLeft size={14} /> Back to portfolio
          </button>
        </div>

        <div className="pp-page-head pp-fade-in">
          <div>
            <h1 className="pp-page-title">
              {project.name}
              <Pill kind={project.health}>{project.health === 'green' ? 'On track' : project.health === 'amber' ? 'At risk' : 'Off track'}</Pill>
              <span className="pp-soon-badge">Soon · Mock data</span>
            </h1>
            <div className="pp-page-sub">
              {project.program} · sponsor {project.sponsor} · PM {project.pm} · phase {project.phase}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="pp-btn primary" disabled title="Schedule connects to real projects only">
              <GanttChart size={14} /> Schedule
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="pp-kpi-grid">
          <KpiCard label="Progress" value={`${Math.round(project.progress * 100)}%`} delta={`phase: ${project.phase}`} />
          <KpiCard label="Budget" value={`${project.budgetUsed.toFixed(1)}`} unit={`/ ${project.budgetTotal.toFixed(1)}M`} delta={`EAC ${project.eac.toFixed(1)}M`} deltaDir={project.eac > project.budgetTotal ? 'down' : 'up'} />
          <KpiCard label="Risks" value={project.risksOpen} delta={`${project.issuesOpen} issues open`} deltaDir={project.risksOpen > 5 ? 'down' : ''} />
          <KpiCard label="Dependencies" value={project.deps} delta={`${project.blockingDeps} blocking`} deltaDir={project.blockingDeps > 0 ? 'down' : 'up'} />
          <KpiCard label="Forecast benefit" value={project.benefits.forecast.toFixed(1)} unit={project.benefits.unit} delta={`${project.benefits.realized.toFixed(1)} realized`} deltaDir="up" />
        </div>

        <div className="pp-detail-grid">
          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="Health trail" eyebrow="last 12 weeks">
              <div style={{ padding: 18, display: 'flex', gap: 4 }}>
                {trail.map((rag, i) => (
                  <span key={i} title={`Week ${i + 1}: ${rag}`} style={{
                    width: 18, height: 18, borderRadius: 4,
                    background: rag === 'green' ? 'var(--pp-green)'
                              : rag === 'amber' ? 'var(--pp-amber)'
                              : rag === 'red' ? 'var(--pp-red)'
                              : 'var(--pp-text-4)',
                  }} />
                ))}
              </div>
            </Card>

            <Card title="Tasks" eyebrow={`${tasks.length} open`}>
              {tasks.length === 0 ? (
                <div style={{ padding: 18, color: 'var(--pp-text-3)' }}>No tasks for this project.</div>
              ) : (
                <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['ID', 'Title', 'Owner', 'Status', 'Priority', 'Due'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left',
                          fontSize: 10.5,
                          color: 'var(--pp-text-4)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '8px 14px',
                          borderBottom: '1px solid var(--pp-border)',
                          fontWeight: 500,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t.id}>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)', color: 'var(--pp-text-3)' }}>{t.id}</td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)', color: 'var(--pp-text)', fontWeight: 500 }}>{t.title}</td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)', color: 'var(--pp-text-2)' }}>{t.owner}</td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)' }}>
                          <Pill kind={t.status === 'Done' ? 'green' : t.status === 'Blocked' ? 'red' : t.status === 'In Review' ? 'amber' : 'blue'}>{t.status}</Pill>
                        </td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)', color: 'var(--pp-text-2)' }}>{t.priority}</td>
                        <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)', color: 'var(--pp-text-2)' }}>{t.due}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Project risks" eyebrow={`${risks.length} open`}>
              {risks.length === 0 ? (
                <div style={{ padding: 18, color: 'var(--pp-text-3)' }}>No risks recorded.</div>
              ) : (
                <div>
                  {risks.map(r => (
                    <div key={r.id} className="pp-risk-row">
                      <div className={`pp-risk-sev ${r.sev}`}>{(r.prob * r.impact * 10).toFixed(0)}</div>
                      <div>
                        <div className="pp-risk-title">{r.title}</div>
                        <div className="pp-risk-meta">owner {r.owner} · due {r.due} · {r.aging}d aging</div>
                      </div>
                      <span className="pp-muted" style={{ fontSize: 11 }}>{r.sev}</span>
                      <AlertTriangle size={14} className="pp-muted" />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="Project facts">
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Fact label="Code" value={project.code} />
                <Fact label="Domain" value={project.domain} />
                <Fact label="Phase" value={project.phase} />
                <Fact label="Started" value={project.startedAt} />
                <Fact label="Target" value={project.targetAt} />
                <Fact label="Sponsor" value={project.sponsor} />
                <Fact label="PM" value={project.pm} />
              </div>
            </Card>

            <Card title="Next milestone">
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--pp-text)', fontWeight: 500 }}>{project.nextMilestone.name}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`pp-ms-dot ${project.nextMilestone.status}`} />
                  <span className="pp-muted" style={{ fontSize: 11.5 }}>{project.nextMilestone.date} · {project.nextMilestone.status}</span>
                </div>
              </div>
            </Card>

            <Card title="Strategic alignment">
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {project.okrAlign.map(o => (
                  <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--pp-text-2)' }}>
                    <span className="pp-hdot green" />
                    {o}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
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
