import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Edit2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { CriteriaVersion, Criterion } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { CriterionForm } from './CriterionForm';
import { AHPWizard } from './AHPWizard';

interface Props {
  version: CriteriaVersion;
  onBack: () => void;
  onChanged: () => void;
}

export function VersionDetail({ version, onBack, onChanged }: Props) {
  const [criteria, setCriteria] = useState<Criterion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Criterion | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [ahpOpen, setAhpOpen] = useState(false);

  async function refresh() {
    try {
      const r = await apiClient.listCriteria(version.id);
      setCriteria(r.criteria);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'load_error');
    }
  }

  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, [version.id]);

  const weightSum = useMemo(
    () => (criteria ?? []).reduce((s, c) => s + (c.weight ?? 0), 0),
    [criteria],
  );

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await apiClient.deleteCriterion(id);
      setConfirmDelete(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete_error');
    } finally {
      setBusy(false);
    }
  }

  if (ahpOpen) {
    return (
      <AHPWizard
        version={version}
        onClose={() => { setAhpOpen(false); void refresh(); onChanged(); }}
      />
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-(--color-ink-muted) hover:text-(--color-ink)"
      >
        <ArrowLeft size={13} /> Back to versions
      </button>

      <div className="bg-(--color-surface) border border-(--color-border) rounded-lg p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[18px] font-semibold tracking-tight truncate">{version.name}</h2>
              {version.isActive && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  <CheckCircle2 size={11} /> Active
                </span>
              )}
              <span className="text-[11px] font-medium text-(--color-ink-muted) bg-(--color-surface-2) tabular px-2 py-0.5 rounded">
                Score range {version.scoreMin}–{version.scoreMax}
              </span>
            </div>
            {version.description && (
              <div className="text-[13px] text-(--color-ink-muted) mt-1">{version.description}</div>
            )}
            <div className="text-[12px] text-(--color-ink-subtle) tabular mt-1">
              {(criteria?.length ?? 0)} criteria · weights sum to {weightSum.toFixed(2)}
              {Math.abs(weightSum - 1) > 0.01 && (criteria?.length ?? 0) > 0 && (
                <span className="text-amber-700 ml-2">(should sum to 1.0 — run AHP)</span>
              )}
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setAhpOpen(true)}
            disabled={!criteria || criteria.length < 2}
          >
            <Sparkles size={13} /> Run AHP
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-[14px] font-semibold">Criteria</div>
        {!creating && !editing && (
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Plus size={13} /> Add criterion
          </Button>
        )}
      </div>

      {(creating || editing) && (
        <CriterionForm
          versionId={version.id}
          versionRange={{ min: version.scoreMin, max: version.scoreMax }}
          existing={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); void refresh(); }}
        />
      )}

      {error && <div className="mb-3 text-[13px] text-(--color-danger)">{error}</div>}

      {criteria === null ? (
        <div className="text-[13px] text-(--color-ink-muted) py-8 text-center">Loading…</div>
      ) : criteria.length === 0 ? (
        <div className="text-center py-10 bg-(--color-surface) border border-dashed border-(--color-border) rounded-lg">
          <div className="text-[13px] font-semibold mb-1">No criteria yet</div>
          <div className="text-[12px] text-(--color-ink-muted)">Add your first criterion above.</div>
        </div>
      ) : (
        <div className="bg-(--color-surface) border border-(--color-border) rounded-lg overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-(--color-ink-muted) bg-(--color-surface-2)">
                <th className="text-left px-3 py-2 font-semibold">Key</th>
                <th className="text-left px-3 py-2 font-semibold">Label</th>
                <th className="text-right px-3 py-2 font-semibold">Weight</th>
                <th className="text-center px-3 py-2 font-semibold">Inverse</th>
                <th className="px-3 py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {criteria.map(c => (
                <tr key={c.id} className="border-t border-(--color-border)/60 hover:bg-(--color-surface-2)/40">
                  <td className="px-3 py-2 font-mono text-[12px]">{c.key}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{c.label}</div>
                    {c.description && (
                      <div className="text-[11px] text-(--color-ink-muted) truncate max-w-md">{c.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular">
                    {c.weight === null || c.weight === undefined ? (
                      <span className="text-(--color-ink-subtle)">—</span>
                    ) : (
                      c.weight.toFixed(3)
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">{c.isInverse ? '✓' : '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        className="p-1 rounded text-(--color-ink-subtle) hover:text-(--color-ink) hover:bg-(--color-surface-2)"
                        aria-label="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      {confirmDelete === c.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <Button size="sm" variant="danger" onClick={() => void handleDelete(c.id)} disabled={busy}>Yes</Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)} disabled={busy}>×</Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(c.id)}
                          disabled={busy}
                          className="p-1 rounded text-(--color-ink-subtle) hover:text-(--color-danger) hover:bg-(--color-surface-2)"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
