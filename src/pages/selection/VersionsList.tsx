import { useState } from 'react';
import { CheckCircle2, ChevronRight, Edit2, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { CriteriaVersion } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';

interface Props {
  versions: CriteriaVersion[] | null;
  onOpen: (id: string) => void;
  onChanged: () => void;
}

export function VersionsList({ versions, onOpen, onChanged }: Props) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CriteriaVersion | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate(id: string) {
    setBusy(true);
    setError(null);
    try {
      await apiClient.patchCriteriaVersion(id, { isActive: true });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'activate_error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    try {
      await apiClient.deleteCriteriaVersion(id);
      setConfirmDelete(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete_error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[14px] font-semibold">Criteria versions</div>
        {!creating && !editing && (
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Plus size={13} /> New version
          </Button>
        )}
      </div>

      {(creating || editing) && (
        <VersionForm
          existing={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); onChanged(); }}
        />
      )}

      {error && <div className="mb-3 text-[13px] text-(--color-danger)">{error}</div>}

      {versions === null ? (
        <div className="text-[13px] text-(--color-ink-muted) py-8 text-center">Loading…</div>
      ) : versions.length === 0 ? (
        <div className="text-center py-12 bg-(--color-surface) border border-dashed border-(--color-border) rounded-lg">
          <div className="text-[14px] font-semibold mb-1">No criteria versions yet</div>
          <div className="text-[12px] text-(--color-ink-muted)">
            Create one to start defining scoring criteria.
          </div>
        </div>
      ) : (
        <ul className="bg-(--color-surface) border border-(--color-border) rounded-lg divide-y divide-(--color-border)/60">
          {versions.map(v => (
            <li
              key={v.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 hover:bg-(--color-surface-2) transition-colors',
                confirmDelete === v.id && 'bg-red-50',
              )}
            >
              <button
                type="button"
                onClick={() => onOpen(v.id)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="text-[14px] font-medium truncate">{v.name}</div>
                  {v.isActive && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 size={11} /> Active
                    </span>
                  )}
                  <span className="text-[11px] font-medium text-(--color-ink-muted) bg-(--color-surface-2) tabular px-2 py-0.5 rounded">
                    Range {v.scoreMin}–{v.scoreMax}
                  </span>
                </div>
                {v.description && (
                  <div className="text-[12px] text-(--color-ink-muted) truncate mt-0.5">{v.description}</div>
                )}
              </button>

              {confirmDelete === v.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-(--color-danger)">Delete?</span>
                  <Button size="sm" variant="danger" onClick={() => void handleDelete(v.id)} disabled={busy}>Yes</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)} disabled={busy}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {!v.isActive && (
                    <Button size="sm" variant="secondary" onClick={() => void activate(v.id)} disabled={busy}>
                      Activate
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(v)}
                    className="p-1.5 rounded text-(--color-ink-subtle) hover:text-(--color-ink) hover:bg-(--color-surface-2)"
                    aria-label="Edit version"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(v.id)}
                    className="p-1.5 rounded text-(--color-ink-subtle) hover:text-(--color-danger) hover:bg-(--color-surface-2)"
                    aria-label="Delete version"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpen(v.id)}
                    className="p-1.5 rounded text-(--color-ink-subtle) hover:text-(--color-brand-strong)"
                    aria-label="Open"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VersionForm({
  existing,
  onClose,
  onSaved,
}: {
  existing: CriteriaVersion | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [isActive, setIsActive] = useState(existing?.isActive ?? !existing); // default active for new
  const [scoreMin, setScoreMin] = useState(String(existing?.scoreMin ?? 0));
  const [scoreMax, setScoreMax] = useState(String(existing?.scoreMax ?? 5));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const min = Number(scoreMin);
    const max = Number(scoreMax);
    if (Number.isNaN(min) || Number.isNaN(max) || min >= max) {
      setError('Score min must be less than score max.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (existing) {
        await apiClient.patchCriteriaVersion(existing.id, {
          name: name.trim(),
          description: description?.trim() || null,
          isActive,
          scoreMin: min,
          scoreMax: max,
        });
      } else {
        await apiClient.createCriteriaVersion({
          name: name.trim(),
          description: description?.trim() || null,
          isActive,
          scoreMin: min,
          scoreMax: max,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save_error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mb-4 bg-(--color-surface) border border-(--color-border) rounded-lg p-4">
      <div className="text-[13px] font-semibold mb-3">
        {existing ? 'Edit version' : 'New version'}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 flex flex-col gap-1 text-[12px] text-(--color-ink-muted)">
          Name
          <input required autoFocus value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="FY2026 Selection Cycle" />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-[12px] text-(--color-ink-muted)">
          Description (optional)
          <input value={description ?? ''} onChange={e => setDescription(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-(--color-ink-muted)">
          Score min
          <input type="number" required value={scoreMin} onChange={e => setScoreMin(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-(--color-ink-muted)">
          Score max
          <input type="number" required value={scoreMax} onChange={e => setScoreMax(e.target.value)} className={inputCls} />
        </label>
        <div className="col-span-2 text-[11px] text-(--color-ink-subtle) bg-(--color-surface-2)/60 rounded px-3 py-2">
          The score range applies to every criterion in this version. All self-assessment scoring uses these bounds.
        </div>
        <label className="col-span-2 flex items-center gap-2 text-[12px] text-(--color-ink-muted)">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
          Mark as active (deactivates other versions)
        </label>
      </div>
      {error && <div className="mt-3 text-[12px] text-(--color-danger)">{error}</div>}
      <div className="mt-3 flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" variant="primary" size="sm" disabled={busy || !name.trim()}>
          {busy ? 'Saving…' : existing ? 'Save changes' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded border border-(--color-border) bg-(--color-bg) text-[14px] outline-none focus:ring-2 focus:ring-(--color-brand)';
