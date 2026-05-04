import { useState } from 'react';
import { apiClient } from '../../api/client';
import type { Criterion } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';

interface Props {
  versionId: string;
  versionRange: { min: number; max: number };
  existing: Criterion | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Criterion editor. Note: weight is intentionally NOT editable here —
 * weights are derived by the AHP wizard. Score range comes from the version.
 */
export function CriterionForm({ versionId, versionRange, existing, onClose, onSaved }: Props) {
  const [key, setKey] = useState(existing?.key ?? '');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [isInverse, setIsInverse] = useState(existing?.isInverse ?? false);
  const [rubricText, setRubricText] = useState(
    existing?.rubric
      ? Object.entries(existing.rubric).map(([k, v]) => `${k}: ${v}`).join('\n')
      : '',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function parseRubric(text: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*(-?\d+(?:\.\d+)?)\s*:\s*(.+)$/);
      if (m) out[m[1]] = m[2].trim();
    }
    return out;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        versionId,
        key: key.trim(),
        label: label.trim(),
        description: description?.trim() || null,
        isInverse,
        rubric: parseRubric(rubricText),
      };
      if (existing) {
        const { versionId: _v, ...patch } = payload;
        void _v;
        await apiClient.updateCriterion(existing.id, patch);
      } else {
        await apiClient.createCriterion(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save_error');
    } finally {
      setBusy(false);
    }
  }

  // Build a hint for rubric placeholder using the version's actual range
  const rubricPlaceholder = (() => {
    const stops = [
      versionRange.min,
      Math.round((versionRange.min * 2 + versionRange.max) / 3),
      Math.round((versionRange.min + versionRange.max * 2) / 3),
      versionRange.max,
    ];
    return stops.map((s, i) => `${s}: ${['Negligible','Marginal','Material','Critical'][i] ?? 'Level'}`).join('\n');
  })();

  return (
    <form onSubmit={save} className="mb-4 bg-(--color-surface) border border-(--color-border) rounded-lg p-4">
      <div className="text-[13px] font-semibold mb-3">
        {existing ? 'Edit criterion' : 'Add criterion'}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Key (machine name)">
          <input required value={key} onChange={e => setKey(e.target.value)} className={inputCls} placeholder="revenue_impact" />
        </Field>
        <Field label="Label">
          <input required value={label} onChange={e => setLabel(e.target.value)} className={inputCls} placeholder="Revenue impact" />
        </Field>
        <Field label="Description" full>
          <input value={description ?? ''} onChange={e => setDescription(e.target.value)} className={inputCls} placeholder="Help text shown to scorers" />
        </Field>
        <label className="col-span-2 flex items-center gap-2 text-[12px] text-(--color-ink-muted)">
          <input type="checkbox" checked={isInverse} onChange={e => setIsInverse(e.target.checked)} />
          Inverse — lower raw score is better (e.g. risk, complexity)
        </label>
        <Field label={`Rubric — one line per score level: 'score: description' (range ${versionRange.min}–${versionRange.max})`} full>
          <textarea
            rows={5}
            value={rubricText}
            onChange={e => setRubricText(e.target.value)}
            className={cn(inputCls, 'font-mono text-[12px]')}
            placeholder={rubricPlaceholder}
          />
        </Field>
      </div>
      <div className="mt-2 text-[11px] text-(--color-ink-subtle) bg-(--color-surface-2)/60 rounded px-3 py-2">
        Score range is set on the version ({versionRange.min}–{versionRange.max}). Weight is set automatically by the AHP wizard.
      </div>
      {error && <div className="mt-3 text-[12px] text-(--color-danger)">{error}</div>}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" variant="primary" size="sm" disabled={busy || !key.trim() || !label.trim()}>
          {busy ? 'Saving…' : existing ? 'Save changes' : 'Add criterion'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label, children, full,
}: {
  label: string; children: React.ReactNode; full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 text-[12px] text-(--color-ink-muted) ${full ? 'col-span-2' : ''}`}>
      {label}
      {children}
    </label>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded border border-(--color-border) bg-(--color-bg) text-[14px] outline-none focus:ring-2 focus:ring-(--color-brand)';
