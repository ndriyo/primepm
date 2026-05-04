import { Plus, Filter, ArrowUpRight, Target } from 'lucide-react';
import { PpShell } from '../../components/layout/PpShell';
import { MOCK_OKRS, MOCK_PORTFOLIO } from '../../data/mockPortfolio';
import { navigate } from '../../lib/router';
import { Card, KpiCard } from '../dashboard/DashboardCommon';

export function ObjectivesSoonPage() {
  const onTrack = MOCK_OKRS.filter(o => o.progress >= 0.7).length;
  const atRisk = MOCK_OKRS.filter(o => o.progress >= 0.4 && o.progress < 0.7).length;
  const offTrack = MOCK_OKRS.filter(o => o.progress < 0.4).length;

  const totalKRs = MOCK_OKRS.reduce((acc, o) => acc + o.krs.length, 0);
  const linkedProjects = new Set(
    MOCK_OKRS.flatMap(o => o.krs.map(k => k.link).filter(Boolean) as string[]),
  );

  const avgProgress =
    MOCK_OKRS.reduce((a, o) => a + o.progress, 0) / Math.max(MOCK_OKRS.length, 1);

  return (
    <PpShell crumbs={[{ label: 'Workspace' }, { label: 'Objectives' }]}>
      <div className="pp-page">
        <div className="pp-page-head pp-fade-in">
          <div>
            <h1 className="pp-page-title">
              Strategic objectives <em>· FY26 H1</em>
              <span className="pp-soon-badge">Soon · Mock data</span>
            </h1>
            <div className="pp-page-sub">
              {MOCK_OKRS.length} objectives · {totalKRs} key results · linked to {linkedProjects.size} projects
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="pp-btn"><Filter size={14} /> By owner</button>
            <button className="pp-btn primary"><Plus size={14} /> New objective</button>
          </div>
        </div>

        <div className="pp-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <KpiCard label="Average progress" value={`${Math.round(avgProgress * 100)}%`} delta="across all objectives" />
          <KpiCard label="On track" value={onTrack} unit={`/ ${MOCK_OKRS.length}`} delta="≥ 70%" deltaDir="up" />
          <KpiCard label="At risk" value={atRisk} delta="40–70%" />
          <KpiCard label="Off track" value={offTrack} delta="< 40%" deltaDir={offTrack > 0 ? 'down' : ''} />
        </div>

        <div className="pp-row" style={{ gridTemplateColumns: '1fr', marginBottom: 16 }}>
          <Card title="Objectives" eyebrow="with key results" meta={`${MOCK_OKRS.length} objectives`}>
            <div>
              {MOCK_OKRS.map(o => {
                const ragClass = o.progress >= 0.7 ? 'green' : o.progress >= 0.4 ? 'amber' : 'red';
                return (
                  <div key={o.id} className="pp-okr-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <h4>
                          <Target size={13} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--pp-accent)' }} />
                          {o.title}
                        </h4>
                        <div className="meta">
                          <span>{o.owner}</span>
                          <span>{o.quarter}</span>
                          <span>{o.krs.length} KRs</span>
                        </div>
                      </div>
                      <span className={`pp-pill ${ragClass}`}>
                        <span className="pp-dot" />
                        {Math.round(o.progress * 100)}%
                      </span>
                    </div>
                    <div className="pp-okr-progress">
                      <div className={`pp-bbar ${ragClass}`}>
                        <i style={{ width: `${o.progress * 100}%` }} />
                      </div>
                      <span className="pct">{Math.round(o.progress * 100)}%</span>
                    </div>

                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {o.krs.map((kr, idx) => {
                        const krRag = kr.progress >= 0.7 ? 'green' : kr.progress >= 0.4 ? 'amber' : 'red';
                        const proj = kr.link ? MOCK_PORTFOLIO.find(p => p.id === kr.link) : null;
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 220px 110px 60px',
                              gap: 12,
                              alignItems: 'center',
                              fontSize: 12,
                              padding: '8px 12px',
                              background: 'var(--pp-surface-2)',
                              borderRadius: 8,
                            }}
                          >
                            <div style={{ color: 'var(--pp-text-2)' }}>{kr.name}</div>
                            <div className={`pp-bbar ${krRag}`}>
                              <i style={{ width: `${kr.progress * 100}%` }} />
                            </div>
                            <button
                              className="pp-btn"
                              style={{ padding: '4px 8px', fontSize: 11.5 }}
                              disabled={!proj}
                              onClick={() => proj && navigate(`/ongoing-soon/${proj.id}`)}
                            >
                              {proj ? proj.code : '—'}
                              {proj && <ArrowUpRight size={10} />}
                            </button>
                            <span className="pp-num pp-tabular" style={{ textAlign: 'right' }}>
                              {Math.round(kr.progress * 100)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </PpShell>
  );
}
