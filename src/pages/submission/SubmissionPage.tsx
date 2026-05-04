import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FilePlus2, Plus, Search, Sliders, X } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { CriteriaVersion, ProjectSummary } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { navigate } from '../../lib/router';
import { cn } from '../../lib/cn';
import { SubmissionWizard } from './SubmissionWizard';

type Mode = { kind: 'list' } | { kind: 'create' } | { kind: 'edit'; projectId: string };

export function SubmissionPage() {
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [activeVersion, setActiveVersion] = useState<CriteriaVersion | null>(null);
  const [criteriaCount, setCriteriaCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [nameQuery, setNameQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  async function refresh() {
    try {
      const [projectsRes, criteriaRes] = await Promise.all([
        apiClient.listProjects(),
        apiClient.getActiveCriteria(),
      ]);
      setProjects(projectsRes.projects);
      setActiveVersion(criteriaRes.version);
      setCriteriaCount(criteriaRes.criteria.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'load_error');
    }
  }

  useEffect(() => { void refresh(); }, []);

  const canSubmit = activeVersion !== null && criteriaCount > 0;

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects ?? []) if (p.status) set.add(p.status);
    return [...set].sort();
  }, [projects]);

  const filtered = useMemo(() => {
    if (!projects) return null;
    const q = nameQuery.trim().toLowerCase();
    const min = budgetMin ? Number(budgetMin) : null;
    const max = budgetMax ? Number(budgetMax) : null;
    return projects.filter(p => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      const b = p.budget ?? 0;
      if (min !== null && b < min) return false;
      if (max !== null && b > max) return false;
      return true;
    });
  }, [projects, nameQuery, statusFilter, budgetMin, budgetMax]);

  const filtersActive = nameQuery.trim() !== '' || statusFilter !== 'all' || budgetMin !== '' || budgetMax !== '';

  if (mode.kind === 'create') {
    return (
      <SubmissionWizard
        onCancel={() => { setMode({ kind: 'list' }); void refresh(); }}
        onSaved={() => { setMode({ kind: 'list' }); void refresh(); }}
      />
    );
  }
  if (mode.kind === 'edit') {
    return (
      <SubmissionWizard
        projectId={mode.projectId}
        onCancel={() => { setMode({ kind: 'list' }); void refresh(); }}
        onSaved={() => { setMode({ kind: 'list' }); void refresh(); }}
      />
    );
  }

  return (
    <div className="h-full overflow-auto bg-(--color-bg)">
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-md bg-(--color-brand-soft) text-(--color-brand-strong) flex items-center justify-center">
            <FilePlus2 size={16} />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Project Submission</h1>
            <p className="text-[13px] text-(--color-ink-muted)">
              Submitted projects and their self-assessment scores. Click a row to edit.
            </p>
          </div>
        </div>

        {!canSubmit && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-md px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-amber-800">Submission blocked</div>
              <div className="text-[12px] text-amber-700 mt-0.5">
                You need at least one <strong>active criteria version</strong> with criteria defined before you can submit a project.
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/selection')}>
              <Sliders size={13} /> Open Selection
            </Button>
          </div>
        )}

        <div className="flex items-end justify-between mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold">Submitted projects</div>
            <div className="text-[12px] text-(--color-ink-muted)">
              {activeVersion
                ? <>Scored against <strong className="text-(--color-ink)">{activeVersion.name}</strong></>
                : 'No active criteria version yet.'}
              {projects && (
                <span className="ml-2 text-(--color-ink-subtle)">
                  · {filtered?.length ?? 0} of {projects.length} shown
                </span>
              )}
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setMode({ kind: 'create' })}
            disabled={!canSubmit}
            title={!canSubmit ? 'Create an active criteria version first' : undefined}
          >
            <Plus size={14} /> Submit new project
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-3 flex flex-wrap gap-2 items-center bg-(--color-surface) border border-(--color-border) rounded-md px-3 py-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--color-ink-subtle) pointer-events-none" />
            <input
              type="text"
              value={nameQuery}
              onChange={e => setNameQuery(e.target.value)}
              placeholder="Search by name…"
              className="w-full pl-7 pr-3 py-1.5 rounded border border-(--color-border) bg-(--color-bg) text-[13px] outline-none focus:ring-2 focus:ring-(--color-brand)"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 rounded border border-(--color-border) bg-(--color-bg) text-[13px] outline-none focus:ring-2 focus:ring-(--color-brand)"
          >
            <option value="all">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <span className="text-[12px] text-(--color-ink-muted) ml-1">Budget:</span>
            <input
              type="number"
              min={0}
              value={budgetMin}
              onChange={e => setBudgetMin(e.target.value)}
              placeholder="min"
              className="w-24 px-2 py-1.5 rounded border border-(--color-border) bg-(--color-bg) text-[13px] tabular outline-none focus:ring-2 focus:ring-(--color-brand)"
            />
            <span className="text-(--color-ink-subtle) text-[12px]">–</span>
            <input
              type="number"
              min={0}
              value={budgetMax}
              onChange={e => setBudgetMax(e.target.value)}
              placeholder="max"
              className="w-24 px-2 py-1.5 rounded border border-(--color-border) bg-(--color-bg) text-[13px] tabular outline-none focus:ring-2 focus:ring-(--color-brand)"
            />
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={() => { setNameQuery(''); setStatusFilter('all'); setBudgetMin(''); setBudgetMax(''); }}
              className="inline-flex items-center gap-1 text-[12px] text-(--color-ink-muted) hover:text-(--color-ink) px-2 py-1 rounded hover:bg-(--color-surface-2)"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>

        {error && <div className="mb-3 text-[13px] text-(--color-danger)">{error}</div>}

        {projects === null ? (
          <div className="text-(--color-ink-muted) text-[13px] py-8 text-center">Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-(--color-surface) border border-dashed border-(--color-border) rounded-lg">
            <div className="text-[14px] font-semibold">No submitted projects yet</div>
            <div className="text-[12px] text-(--color-ink-muted) mt-1">
              {canSubmit ? 'Submit your first project using the button above.' : 'Define criteria first, then submit.'}
            </div>
          </div>
        ) : filtered && filtered.length === 0 ? (
          <div className="text-center py-12 bg-(--color-surface) border border-dashed border-(--color-border) rounded-lg">
            <div className="text-[13px] font-semibold">No projects match the filters</div>
          </div>
        ) : (
          <div className="bg-(--color-surface) border border-(--color-border) rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-(--color-ink-muted) bg-(--color-surface-2)">
                  <th className="text-left px-4 py-2 font-semibold">Name</th>
                  <th className="text-left px-3 py-2 font-semibold w-32">Status</th>
                  <th className="text-right px-3 py-2 font-semibold w-36">Budget</th>
                  <th className="text-right px-3 py-2 font-semibold w-32">Mandays</th>
                  <th className="text-right px-3 py-2 font-semibold w-20">Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map(p => (
                  <tr
                    key={p.id}
                    className="border-t border-(--color-border)/60 hover:bg-(--color-surface-2)/60 cursor-pointer transition-colors"
                    onClick={() => setMode({ kind: 'edit', projectId: p.id })}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium truncate">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-(--color-ink-muted) truncate max-w-md">{p.description}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {p.budget === null
                        ? <span className="text-(--color-ink-subtle)">—</span>
                        : p.budget.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {p.resources === 0
                        ? <span className="text-(--color-ink-subtle)">—</span>
                        : p.resources.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {p.score === null
                        ? <span className="text-(--color-ink-subtle)">—</span>
                        : <span className="font-semibold text-(--color-brand-strong)">{p.score.toFixed(2)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span className={cn(
      'inline-block text-[11px] font-medium px-2 py-0.5 rounded',
      tone,
    )}>
      {status}
    </span>
  );
}

function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('progress') || s.includes('active') || s.includes('approved')) return 'bg-emerald-50 text-emerald-700';
  if (s.includes('plan')) return 'bg-sky-50 text-sky-700';
  if (s.includes('initiat')) return 'bg-violet-50 text-violet-700';
  if (s.includes('hold')) return 'bg-amber-50 text-amber-700';
  if (s.includes('complet')) return 'bg-zinc-100 text-zinc-700';
  if (s.includes('reject')) return 'bg-red-50 text-red-700';
  return 'bg-zinc-100 text-zinc-700';
}
