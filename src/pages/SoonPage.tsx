import { Lock, ArrowLeft } from 'lucide-react';
import { PpShell } from '../components/layout/PpShell';
import { navigate } from '../lib/router';

const TITLES: Record<string, { title: string; sub: string }> = {
  portfolio:        { title: 'Portfolio', sub: 'Cross-program view of every initiative — health, budget, and benefits in one canvas.' },
  programs:         { title: 'Programs', sub: 'Group projects by program with rolled-up RAG, spend, and milestones.' },
  objectives:       { title: 'Objectives', sub: 'FY-level OKRs with key-result progress, linked back to delivering projects.' },
  risks:            { title: 'Risks & Issues', sub: 'Portfolio-wide risk register with severity, owner, and mitigation status.' },
  dependencies:     { title: 'Dependencies', sub: 'Cross-project dependency map with blocking links and target dates.' },
  benefits:         { title: 'Benefits & ROI', sub: 'Plan vs. forecast vs. realized benefit curves, by program and project.' },
  'exec-briefing':  { title: 'Executive briefing', sub: 'One-page narrative for the steering committee — generated weekly.' },
  steering:         { title: 'Steering committee', sub: 'Committee scoring, action items, and decisions tracked over time.' },
  'stage-gate':     { title: 'Stage-gate calendar', sub: 'Upcoming stage-gates across the portfolio, with required artifacts.' },
};

export function SoonPage({ kind }: { kind: string }) {
  const meta = TITLES[kind] ?? { title: 'Coming soon', sub: 'This module is on the roadmap.' };
  return (
    <PpShell crumbs={[{ label: 'Workspace' }, { label: meta.title }]}>
      <div className="pp-page">
        <div className="pp-page-head pp-fade-in" style={{ marginBottom: 16 }}>
          <button className="pp-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={14} /> Back to dashboard
          </button>
        </div>

        <div className="pp-page-head pp-fade-in">
          <div>
            <h1 className="pp-page-title">
              {meta.title}
              <span className="pp-soon-badge">Soon</span>
            </h1>
            <div className="pp-page-sub">{meta.sub}</div>
          </div>
        </div>

        <div className="pp-card pp-fade-in" style={{ marginTop: 32 }}>
          <div style={{
            padding: 64,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            color: 'var(--pp-text-3)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'var(--pp-surface-2)',
              display: 'grid', placeItems: 'center',
            }}>
              <Lock size={24} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--pp-text)' }}>This module is coming soon</div>
            <div style={{ fontSize: 13, maxWidth: 480 }}>
              {meta.sub}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="pp-btn" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
              <button className="pp-btn primary" onClick={() => navigate('/dashboard-soon')}>Preview the design</button>
            </div>
          </div>
        </div>
      </div>
    </PpShell>
  );
}
