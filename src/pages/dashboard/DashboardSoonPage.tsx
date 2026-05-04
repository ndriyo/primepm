import { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Filter, Plus, Sparkles, ChevronDown, AlertTriangle } from 'lucide-react';
import { PpShell } from '../../components/layout/PpShell';
import {
  MOCK_PORTFOLIO,
  MOCK_RISKS,
  MOCK_DEPS,
  MOCK_OKRS,
  PROGRAMS,
  HEALTH_TRAIL,
  BENEFITS_CURVE,
  MONTHS,
  type RAG,
} from '../../data/mockPortfolio';
import { navigate } from '../../lib/router';
import { KpiCard, Card, Pill, HealthDot } from './DashboardCommon';

const HEALTH_OPTS: Array<{ id: 'all' | RAG; label: string; dot: RAG | null }> = [
  { id: 'all', label: 'All health', dot: null },
  { id: 'green', label: 'On track', dot: 'green' },
  { id: 'amber', label: 'At risk', dot: 'amber' },
  { id: 'red', label: 'Off track', dot: 'red' },
];

export function DashboardSoonPage() {
  const [healthFilter, setHealthFilter] = useState<'all' | RAG>('all');
  const [program, setProgram] = useState('All programs');
  const [timeRange, setTimeRange] = useState<'Quarter' | 'Month' | 'Week'>('Quarter');

  const filtered = useMemo(() => {
    return MOCK_PORTFOLIO.filter(p =>
      (healthFilter === 'all' || p.health === healthFilter) &&
      (program === 'All programs' || p.program === program),
    );
  }, [healthFilter, program]);

  const allRisks = useMemo(() =>
    MOCK_RISKS.filter(r =>
      program === 'All programs' || MOCK_PORTFOLIO.find(p => p.id === r.project)?.program === program,
    ),
    [program]);

  const counts = useMemo(() => {
    const c: Record<RAG, number> = { green: 0, amber: 0, red: 0, blue: 0 };
    filtered.forEach(p => { c[p.health] = (c[p.health] || 0) + 1; });
    return c;
  }, [filtered]);

  const totalBudget = filtered.reduce((a, p) => a + p.budgetTotal, 0);
  const usedBudget = filtered.reduce((a, p) => a + p.budgetUsed, 0);
  const totalForecast = filtered.reduce((a, p) => a + p.benefits.forecast, 0);
  const totalRisks = filtered.reduce((a, p) => a + p.risksOpen, 0);
  const totalBlocking = filtered.reduce((a, p) => a + p.blockingDeps, 0);

  return (
    <PpShell crumbs={[{ label: 'Dashboard (Soon)' }]}>
      <div className="pp-page">
        <div className="pp-page-head pp-fade-in">
          <div>
            <h1 className="pp-page-title">
              Portfolio command center <em>· FY26 Q2</em>
              <span className="pp-soon-badge">Soon · Mock data</span>
            </h1>
            <div className="pp-page-sub">Monday, May 4, 2026 · {filtered.length} active projects across {PROGRAMS.length - 1} programs · next stage-gate Friday</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="pp-btn"><Calendar size={14} /> Week</button>
            <button className="pp-btn primary"><TrendingUp size={14} /> Brief sponsors</button>
          </div>
        </div>

        <div className="pp-filter-row pp-fade-in" style={{ marginBottom: 20 }}>
          {HEALTH_OPTS.map(o => (
            <button
              key={o.id}
              className="pp-chip"
              aria-pressed={healthFilter === o.id}
              onClick={() => setHealthFilter(o.id)}
            >
              {o.dot && <span className={`pp-chip-dot ${o.dot}`} />}
              {o.label}
            </button>
          ))}
          <span style={{ width: 1, height: 18, background: 'var(--pp-border)', margin: '0 4px' }} />
          <button className="pp-chip" onClick={() => {
            const i = PROGRAMS.indexOf(program);
            setProgram(PROGRAMS[(i + 1) % PROGRAMS.length]);
          }}>
            <Filter size={12} />{program}<ChevronDown size={12} />
          </button>
          <button className="pp-chip" onClick={() => setTimeRange(timeRange === 'Quarter' ? 'Month' : timeRange === 'Month' ? 'Week' : 'Quarter')}>
            <Calendar size={12} />{timeRange}
          </button>
          <span style={{ flex: 1 }} />
          <button className="pp-chip"><Sparkles size={12} />Insights</button>
          <button className="pp-chip"><Plus size={12} />Add module</button>
        </div>

        {/* KPI cards */}
        <div className="pp-kpi-grid">
          <KpiCard
            label="Portfolio health"
            value={`${counts.green}/${filtered.length}`}
            unit="on track"
            delta={`${counts.amber} at risk · ${counts.red} off`}
            deltaDir={counts.red > 1 ? 'down' : 'up'}
            spark={[3,3,2,2,2,3,3,3,3,3,3,3]}
            sparkColor="var(--pp-green)"
          />
          <KpiCard
            label="Budget"
            value={usedBudget.toFixed(1)}
            unit={`/ ${totalBudget.toFixed(1)}M`}
            delta={`${Math.round((usedBudget / Math.max(totalBudget, 0.01)) * 100)}% consumed`}
            spark={[2,2.5,3,3.5,4.2,5,6,7,8,9.5,11,12.4]}
            sparkColor="var(--pp-accent)"
          />
          <KpiCard
            label="Forecast benefit"
            value={totalForecast.toFixed(1)}
            unit="M"
            delta="+$5.8M realized YTD"
            deltaDir="up"
            spark={[1,1.3,2.1,3.0,4.4,6.0,8.0,10,12.5,15,17,19.5]}
            sparkColor="var(--pp-green)"
          />
          <KpiCard
            label="Open risks"
            value={totalRisks}
            delta={`${allRisks.filter(r => r.sev === 'high').length} high severity`}
            deltaDir="down"
            spark={[12,15,14,16,18,17,19,21,20,22,24,26]}
            sparkColor="var(--pp-red)"
          />
          <KpiCard
            label="Blocking deps"
            value={totalBlocking}
            delta={`${MOCK_DEPS.filter(d => d.status === 'amber').length} at risk`}
            deltaDir={totalBlocking > 0 ? 'down' : 'up'}
            spark={[1,1,2,2,3,3,4,4,5,4,5,7]}
            sparkColor="var(--pp-amber)"
          />
        </div>

        {/* Portfolio Health + Risk Register */}
        <div className="pp-row cols-portfolio">
          <Card title="Portfolio Health" eyebrow="trail · 12 weeks" meta={`${filtered.length} projects`}>
            <div className="pp-proj-list">
              {filtered.map(p => (
                <button
                  key={p.id}
                  className="pp-proj-row"
                  onClick={() => navigate(`/ongoing-soon/${p.id}`)}
                >
                  <div className="pp-proj-icon">{p.code}</div>
                  <div>
                    <div className="nm">{p.name}</div>
                    <div className="sub">{p.program} · {p.pm}</div>
                  </div>
                  <div><Pill kind={p.health}>{p.health === 'green' ? 'On track' : p.health === 'amber' ? 'At risk' : 'Off track'}</Pill></div>
                  <div className="pp-num tabular">${p.budgetUsed.toFixed(1)}M / {p.budgetTotal.toFixed(1)}M</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {(HEALTH_TRAIL[p.id] ?? []).slice(-12).map((rag, i) => (
                      <span key={i} style={{
                        width: 5, height: 14, borderRadius: 1,
                        background: rag === 'green' ? 'var(--pp-green)'
                                  : rag === 'amber' ? 'var(--pp-amber)'
                                  : rag === 'red' ? 'var(--pp-red)'
                                  : 'var(--pp-text-4)',
                      }} />
                    ))}
                  </div>
                  <span className="pp-muted" style={{ fontSize: 11 }}>{Math.round(p.progress * 100)}%</span>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Top risks" eyebrow="by exposure (P × I)" meta={`${allRisks.length} open`}>
            <div>
              {[...allRisks].sort((a, b) => (b.prob * b.impact) - (a.prob * a.impact)).slice(0, 6).map(r => {
                const proj = MOCK_PORTFOLIO.find(p => p.id === r.project);
                return (
                  <div key={r.id} className="pp-risk-row">
                    <div className={`pp-risk-sev ${r.sev}`}>{(r.prob * r.impact * 10).toFixed(0)}</div>
                    <div>
                      <div className="pp-risk-title">{r.title}</div>
                      <div className="pp-risk-meta">{proj?.name} · owner {r.owner} · due {r.due}</div>
                    </div>
                    <span className="pp-muted" style={{ fontSize: 11 }}>{r.aging}d</span>
                    <AlertTriangle size={14} className="pp-muted" />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* OKRs + Dependencies */}
        <div className="pp-row cols-2">
          <Card title="Strategic alignment" eyebrow="FY26 H1 OKRs" meta={`${MOCK_OKRS.length} objectives`}>
            <div>
              {MOCK_OKRS.map(o => (
                <div key={o.id} className="pp-okr-row">
                  <h4>{o.title}</h4>
                  <div className="meta">
                    <span>{o.owner}</span>
                    <span>{o.quarter}</span>
                  </div>
                  <div className="pp-okr-progress">
                    <div className={`pp-bbar ${o.progress > 0.7 ? 'green' : o.progress > 0.4 ? 'amber' : 'red'}`}>
                      <i style={{ width: `${o.progress * 100}%` }} />
                    </div>
                    <span className="pct">{Math.round(o.progress * 100)}%</span>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {o.krs.map((kr, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--pp-text-3)' }}>
                        <HealthDot kind={kr.progress > 0.7 ? 'green' : kr.progress > 0.4 ? 'amber' : 'red'} />
                        <span style={{ flex: 1 }}>{kr.name}</span>
                        <span className="pp-tabular">{Math.round(kr.progress * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Cross-project dependencies" meta={`${MOCK_DEPS.length} active`}>
            <div style={{ padding: 18 }}>
              {MOCK_DEPS.map((d, i) => {
                const fromProj = MOCK_PORTFOLIO.find(p => p.id === d.from);
                const toProj = MOCK_PORTFOLIO.find(p => p.id === d.to);
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 70px', gap: 14, alignItems: 'center', padding: '6px 0', fontSize: 12 }}>
                    <div style={{ fontWeight: 500, color: 'var(--pp-text)' }}>{fromProj?.code} → {toProj?.code}</div>
                    <div>
                      <div style={{ marginBottom: 4 }}>{d.label}</div>
                      <div className={`pp-bbar ${d.status}`}>
                        <i style={{ width: d.status === 'red' ? '40%' : d.status === 'amber' ? '70%' : '95%' }} />
                      </div>
                    </div>
                    <span className="pp-muted pp-tabular" style={{ fontSize: 11 }}>{d.neededBy.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Benefits + Risk matrix */}
        <div className="pp-row cols-2">
          <Card title="Benefits realization" eyebrow="cumulative · $M" meta="Plan / Forecast / Realized">
            <div style={{ padding: 18 }}>
              <BenefitsChart />
            </div>
          </Card>

          <Card title="Risk heatmap" eyebrow="P × I" meta={`${allRisks.length} risks`}>
            <div style={{ padding: 18 }}>
              <RiskMatrix risks={allRisks} />
            </div>
          </Card>
        </div>
      </div>
    </PpShell>
  );
}

function BenefitsChart() {
  const W = 600;
  const H = 200;
  const PAD = 28;
  const all = [...BENEFITS_CURVE.plan, ...BENEFITS_CURVE.forecast, ...(BENEFITS_CURVE.realized.filter(v => v != null) as number[])];
  const max = Math.max(...all);
  const xAt = (i: number) => PAD + (i / (BENEFITS_CURVE.plan.length - 1)) * (W - PAD * 2);
  const yAt = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const linePath = (arr: Array<number | null>) =>
    arr
      .map((v, i) => v == null ? null : `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`)
      .filter(Boolean)
      .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 200 }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = H - PAD - t * (H - PAD * 2);
          return <line key={t} x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="var(--pp-border)" strokeDasharray="2 4" />;
        })}
        {/* Lines */}
        <path d={linePath(BENEFITS_CURVE.plan)} fill="none" stroke="var(--pp-text-3)" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d={linePath(BENEFITS_CURVE.forecast)} fill="none" stroke="var(--pp-accent)" strokeWidth="1.8" />
        <path d={linePath(BENEFITS_CURVE.realized)} fill="none" stroke="var(--pp-green)" strokeWidth="2.4" />
        {/* x labels */}
        {MONTHS.map((m, i) => (
          <text key={i} x={xAt(i)} y={H - 6} fontSize="9" fill="var(--pp-text-4)" textAnchor="middle">{m}</text>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--pp-text-3)', marginTop: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 2, background: 'var(--pp-text-3)' }} />Plan</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 2, background: 'var(--pp-accent)' }} />Forecast</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 2, background: 'var(--pp-green)' }} />Realized</span>
      </div>
    </div>
  );
}

function RiskMatrix({ risks }: { risks: typeof MOCK_RISKS }) {
  // 5×5 P×I grid. Cell color by count of risks falling there.
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  risks.forEach(r => {
    const x = Math.min(4, Math.floor(r.prob * 5));
    const y = Math.min(4, Math.floor(r.impact * 5));
    grid[y][x] += 1;
  });
  const max = Math.max(1, ...grid.flat());

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(5, 1fr)', gap: 2 }}>
        <span />
        {[1, 2, 3, 4, 5].map(p => (
          <span key={p} className="pp-cap" style={{ textAlign: 'center', fontSize: 9 }}>P{p}</span>
        ))}
        {grid.map((row, y) => (
          <>
            <span key={`y-${y}`} className="pp-cap" style={{ fontSize: 9, alignSelf: 'center', textAlign: 'right', paddingRight: 4 }}>I{5 - y}</span>
            {row.map((count, x) => {
              const intensity = count / max;
              const sev = (5 - y) * (x + 1);
              const color = sev >= 16 ? 'var(--pp-red)' : sev >= 9 ? 'var(--pp-amber)' : 'var(--pp-green)';
              return (
                <div
                  key={x}
                  style={{
                    aspectRatio: '1',
                    minHeight: 30,
                    borderRadius: 4,
                    background: `color-mix(in oklab, ${color} ${10 + intensity * 70}%, transparent)`,
                    color: 'var(--pp-text)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {count > 0 ? count : ''}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
