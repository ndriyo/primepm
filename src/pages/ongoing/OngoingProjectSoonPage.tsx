import { useState, useMemo } from 'react';
import { Plus, Filter, ArrowUpRight } from 'lucide-react';
import { PpShell } from '../../components/layout/PpShell';
import { MOCK_PORTFOLIO, PROGRAMS, type RAG } from '../../data/mockPortfolio';
import { navigate } from '../../lib/router';
import { Pill } from '../dashboard/DashboardCommon';

const HEALTH_OPTS: Array<{ id: 'all' | RAG; label: string; dot: RAG | null }> = [
  { id: 'all', label: 'All health', dot: null },
  { id: 'green', label: 'On track', dot: 'green' },
  { id: 'amber', label: 'At risk', dot: 'amber' },
  { id: 'red', label: 'Off track', dot: 'red' },
];

export function OngoingProjectSoonPage() {
  const [healthFilter, setHealthFilter] = useState<'all' | RAG>('all');
  const [program, setProgram] = useState('All programs');

  const filtered = useMemo(() => {
    return MOCK_PORTFOLIO.filter(p =>
      (healthFilter === 'all' || p.health === healthFilter) &&
      (program === 'All programs' || p.program === program),
    );
  }, [healthFilter, program]);

  return (
    <PpShell crumbs={[{ label: 'Projects' }, { label: 'Ongoing Project (Soon)' }]}>
      <div className="pp-page">
        <div className="pp-page-head pp-fade-in">
          <div>
            <h1 className="pp-page-title">
              Ongoing Project <em>· in flight</em>
              <span className="pp-soon-badge">Soon · Mock data</span>
            </h1>
            <div className="pp-page-sub">{filtered.length} active projects · live status & milestones</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="pp-btn"><Filter size={14} /> Filter</button>
            <button className="pp-btn primary"><Plus size={14} /> Track new</button>
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
            <Filter size={12} />{program}
          </button>
        </div>

        <div className="pp-card pp-fade-in">
          <div className="pp-card-head">
            <h3>Portfolio Health <em>· trail · 12 weeks</em></h3>
            <span className="pp-head-meta">{filtered.length} projects</span>
          </div>
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
                <div className="pp-num tabular">{Math.round(p.progress * 100)}% done</div>
                <ArrowUpRight size={14} className="pp-muted" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </PpShell>
  );
}
