import { useState, useMemo } from 'react';
import { Plus, Filter, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { PpShell } from '../../components/layout/PpShell';
import { MOCK_RISKS, MOCK_PORTFOLIO } from '../../data/mockPortfolio';
import { navigate } from '../../lib/router';
import { KpiCard } from '../dashboard/DashboardCommon';

const SEV_OPTS: Array<{ id: 'all' | 'high' | 'med' | 'low'; label: string; chip?: 'red' | 'amber' | 'blue' }> = [
  { id: 'all', label: 'All severities' },
  { id: 'high', label: 'High', chip: 'red' },
  { id: 'med', label: 'Medium', chip: 'amber' },
  { id: 'low', label: 'Low', chip: 'blue' },
];

export function RisksSoonPage() {
  const [sevFilter, setSevFilter] = useState<'all' | 'high' | 'med' | 'low'>('all');

  const filtered = useMemo(
    () => MOCK_RISKS.filter(r => sevFilter === 'all' || r.sev === sevFilter),
    [sevFilter],
  );

  const sortedByExposure = useMemo(
    () => [...filtered].sort((a, b) => b.prob * b.impact - a.prob * a.impact),
    [filtered],
  );

  const high = MOCK_RISKS.filter(r => r.sev === 'high').length;
  const med = MOCK_RISKS.filter(r => r.sev === 'med').length;
  const low = MOCK_RISKS.filter(r => r.sev === 'low').length;
  const aging = Math.round(MOCK_RISKS.reduce((a, r) => a + r.aging, 0) / Math.max(MOCK_RISKS.length, 1));

  return (
    <PpShell crumbs={[{ label: 'Workspace' }, { label: 'Risks & Issues' }]}>
      <div className="pp-page">
        <div className="pp-page-head pp-fade-in">
          <div>
            <h1 className="pp-page-title">
              Risks & Issues <em>· register</em>
              <span className="pp-soon-badge">Soon · Mock data</span>
            </h1>
            <div className="pp-page-sub">
              {MOCK_RISKS.length} open risks across the portfolio · sorted by exposure (P × I)
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="pp-btn"><Filter size={14} /> By owner</button>
            <button className="pp-btn primary"><Plus size={14} /> Log risk</button>
          </div>
        </div>

        <div className="pp-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <KpiCard label="Open risks" value={MOCK_RISKS.length} delta="all severities" />
          <KpiCard label="High severity" value={high} delta="exposure ≥ 0.5" deltaDir="down" />
          <KpiCard label="Medium" value={med} delta="exposure 0.2–0.5" />
          <KpiCard label="Average age" value={`${aging}d`} delta="across open risks" />
        </div>

        {/* Severity filter chips */}
        <div className="pp-filter-row pp-fade-in" style={{ marginBottom: 20 }}>
          {SEV_OPTS.map(o => (
            <button
              key={o.id}
              className="pp-chip"
              aria-pressed={sevFilter === o.id}
              onClick={() => setSevFilter(o.id)}
            >
              {o.chip && <span className={`pp-chip-dot ${o.chip}`} />}
              {o.label}
              <span className="pp-tabular pp-muted" style={{ fontSize: 11 }}>
                {o.id === 'all'
                  ? MOCK_RISKS.length
                  : o.id === 'high' ? high
                  : o.id === 'med' ? med
                  : low}
              </span>
            </button>
          ))}
        </div>

        <div className="pp-card pp-fade-in">
          <div className="pp-card-head">
            <h3>Risk register <em>· P × I</em></h3>
            <span className="pp-head-meta">{filtered.length} of {MOCK_RISKS.length}</span>
          </div>
          <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Sev', 'Title', 'Project', 'Owner', 'Due', 'Age', ''].map(h => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      fontSize: 10.5,
                      color: 'var(--pp-text-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '8px 14px',
                      borderBottom: '1px solid var(--pp-border)',
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedByExposure.map(r => {
                const proj = MOCK_PORTFOLIO.find(p => p.id === r.project);
                return (
                  <tr
                    key={r.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => proj && navigate(`/ongoing-soon/${proj.id}`)}
                  >
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)' }}>
                      <div className={`pp-risk-sev ${r.sev}`} style={{ width: 32, height: 28 }}>
                        {(r.prob * r.impact * 10).toFixed(0)}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)', color: 'var(--pp-text)', fontWeight: 500 }}>
                      <div>{r.title}</div>
                      <div className="pp-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                        {r.mitigation}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)', color: 'var(--pp-text-2)' }}>
                      {proj?.code ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)', color: 'var(--pp-text-2)' }}>
                      {r.owner}
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)', color: 'var(--pp-text-2)' }}>
                      {r.due}
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)', color: 'var(--pp-text-2)' }}>
                      {r.aging}d
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--pp-border)', color: 'var(--pp-text-3)' }}>
                      <ArrowUpRight size={14} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--pp-text-3)' }}>
              <AlertTriangle size={20} style={{ marginBottom: 8 }} />
              <div>No risks match your filter.</div>
            </div>
          )}
        </div>
      </div>
    </PpShell>
  );
}
