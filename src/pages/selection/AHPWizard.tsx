import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { CriteriaVersion, Criterion } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { deriveAhp } from '../../lib/ahp';
import { cn } from '../../lib/cn';

type Comparison = { criterionAId: string; criterionBId: string; value: number };

interface Props {
  version: CriteriaVersion;
  onClose: () => void;
}

/**
 * Saaty's fundamental scale — 1-9 odd values + reciprocals.
 * Positive value = A more important than B.
 * Reciprocal value (1/3 ... 1/9) = B more important than A.
 */
const SAATY_LEVELS: Array<{ value: number; intensity: string; meaning: string }> = [
  { value: 1, intensity: 'Equal', meaning: 'A and B contribute equally to the goal' },
  { value: 3, intensity: 'Moderate', meaning: 'Experience and judgment slightly favor one over the other' },
  { value: 5, intensity: 'Strong', meaning: 'Experience and judgment strongly favor one over the other' },
  { value: 7, intensity: 'Very strong', meaning: 'One is favored very strongly; its dominance is demonstrated in practice' },
  { value: 9, intensity: 'Extreme', meaning: 'The evidence favoring one over the other is of the highest possible order' },
];

export function AHPWizard({ version, onClose }: Props) {
  const [criteria, setCriteria] = useState<Criterion[] | null>(null);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [step, setStep] = useState(0); // index into pairs
  const [showResults, setShowResults] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void apiClient.listCriteria(version.id).then(r => setCriteria(r.criteria)).catch(err => setError(err.message));
  }, [version.id]);

  // Pairs: i < j stable order
  const pairs = useMemo(() => {
    if (!criteria) return [];
    const result: Array<{ a: Criterion; b: Criterion }> = [];
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        result.push({ a: criteria[i], b: criteria[j] });
      }
    }
    return result;
  }, [criteria]);

  function valueFor(a: Criterion, b: Criterion): number | null {
    const c = comparisons.find(x => x.criterionAId === a.id && x.criterionBId === b.id);
    return c?.value ?? null;
  }

  function setValue(a: Criterion, b: Criterion, value: number) {
    setComparisons(prev => {
      const without = prev.filter(c => !(c.criterionAId === a.id && c.criterionBId === b.id));
      return [...without, { criterionAId: a.id, criterionBId: b.id, value }];
    });
  }

  const ahp = useMemo(() => {
    if (!criteria) return null;
    return deriveAhp(criteria.map(c => c.id), comparisons);
  }, [criteria, comparisons]);

  const allCovered = pairs.length === 0 || pairs.every(p => valueFor(p.a, p.b) !== null);

  async function persist() {
    if (!ahp || !criteria) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient.putPairwise(version.id, {
        comparisons,
        weights: ahp.weights.map(w => ({ criterionId: w.id, weight: w.weight })),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save_error');
    } finally {
      setBusy(false);
    }
  }

  if (!criteria) {
    return <div className="text-[13px] text-(--color-ink-muted) py-8 text-center">Loading…</div>;
  }

  if (criteria.length < 2) {
    return (
      <div>
        <button
          type="button"
          onClick={onClose}
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-(--color-ink-muted) hover:text-(--color-ink)"
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div className="text-center py-12 bg-(--color-surface) border border-dashed border-(--color-border) rounded-lg">
          <div className="text-[14px] font-semibold mb-1">At least 2 criteria required</div>
          <div className="text-[12px] text-(--color-ink-muted)">
            AHP needs at least two criteria to compare. Add more, then run AHP.
          </div>
        </div>
      </div>
    );
  }

  const total = pairs.length;
  const currentPair = pairs[step];
  const currentValue = currentPair ? valueFor(currentPair.a, currentPair.b) : null;
  const answeredCount = comparisons.length;

  // ============================================================
  // Results view (after answering all pairs)
  // ============================================================
  if (showResults) {
    return (
      <div>
        <button
          type="button"
          onClick={onClose}
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-(--color-ink-muted) hover:text-(--color-ink)"
        >
          <ArrowLeft size={13} /> Back to version
        </button>
        <div className="bg-(--color-surface) border border-(--color-border) rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-amber-500" />
            <h3 className="text-[16px] font-semibold tracking-tight">AHP results</h3>
          </div>
          <p className="text-[13px] text-(--color-ink-muted) mb-4">
            Weights derived from the principal eigenvector of your pairwise matrix.
          </p>

          <ConsistencyBadge cr={ahp?.cr ?? 0} eigenvalue={ahp?.eigenvalue ?? 0} n={criteria.length} />

          <div className="mt-5">
            <div className="text-[13px] font-semibold mb-3">Derived weights</div>
            <div className="flex flex-col gap-1.5">
              {ahp?.weights.map((w, i) => {
                const c = criteria[i];
                const pct = (w.weight * 100).toFixed(1);
                return (
                  <div key={w.id} className="flex items-center gap-3">
                    <div className="w-48 text-[13px] truncate">{c.label}</div>
                    <div className="flex-1 h-2 rounded bg-(--color-surface-2) overflow-hidden">
                      <div className="h-full bg-(--color-brand)" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-16 text-right text-[13px] font-mono tabular">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && <div className="mt-4 text-[13px] text-(--color-danger)">{error}</div>}
          {saved && (
            <div className="mt-4 text-[13px] text-emerald-700 inline-flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Weights saved to {version.name}.
            </div>
          )}

          <div className="mt-5 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowResults(false)} disabled={busy}>
              <ArrowLeft size={13} /> Revise judgments
            </Button>
            <Button variant="primary" onClick={persist} disabled={busy || saved}>
              {busy ? 'Saving…' : saved ? 'Saved' : 'Save weights'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Wizard view (pair-by-pair)
  // ============================================================
  return (
    <div>
      <button
        type="button"
        onClick={onClose}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-(--color-ink-muted) hover:text-(--color-ink)"
      >
        <ArrowLeft size={13} /> Cancel — back to version
      </button>

      <div className="bg-(--color-surface) border border-(--color-border) rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-amber-500" />
            <h3 className="text-[15px] font-semibold tracking-tight">
              AHP — {version.name}
            </h3>
          </div>
          <div className="text-[12px] text-(--color-ink-muted) tabular">
            Pair {step + 1} of {total} · {answeredCount}/{total} answered
          </div>
        </div>

        <div className="mb-5 h-1 bg-(--color-surface-2) rounded-full overflow-hidden">
          <div
            className="h-full bg-(--color-brand) transition-all"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>

        {currentPair && (
          <PairComparison
            a={currentPair.a}
            b={currentPair.b}
            value={currentValue}
            onSelect={v => setValue(currentPair.a, currentPair.b, v)}
          />
        )}

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft size={14} /> Previous
          </Button>
          {step < total - 1 ? (
            <Button
              variant="primary"
              onClick={() => setStep(s => s + 1)}
              disabled={currentValue === null}
            >
              Next <ArrowRight size={14} />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setShowResults(true)}
              disabled={!allCovered}
            >
              See results <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Pair comparison UI — 1-9 scale + reciprocals
// ============================================================

function PairComparison({
  a, b, value, onSelect,
}: {
  a: Criterion;
  b: Criterion;
  value: number | null;
  onSelect: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-[12px] uppercase tracking-wide text-(--color-ink-muted) font-semibold mb-2">
        Compare
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-(--color-bg) border border-(--color-border) rounded-md p-3">
          <div className="text-[11px] text-(--color-ink-muted) font-mono mb-1">A · {a.key}</div>
          <div className="text-[15px] font-semibold">{a.label}</div>
          {a.description && (
            <div className="text-[12px] text-(--color-ink-muted) mt-1">{a.description}</div>
          )}
        </div>
        <div className="bg-(--color-bg) border border-(--color-border) rounded-md p-3">
          <div className="text-[11px] text-(--color-ink-muted) font-mono mb-1">B · {b.key}</div>
          <div className="text-[15px] font-semibold">{b.label}</div>
          {b.description && (
            <div className="text-[12px] text-(--color-ink-muted) mt-1">{b.description}</div>
          )}
        </div>
      </div>

      <div className="text-[12px] text-(--color-ink-muted) mb-2">
        How important is <strong className="text-(--color-ink)">A</strong> relative to <strong className="text-(--color-ink)">B</strong>?
      </div>

      <div className="flex flex-col gap-1.5">
        {/* B more important (reciprocal values, descending intensity) */}
        {[...SAATY_LEVELS].reverse().filter(l => l.value !== 1).map(level => {
          const v = 1 / level.value;
          const selected = value !== null && Math.abs(value - v) < 1e-9;
          return (
            <ScaleButton
              key={`b-${level.value}`}
              selected={selected}
              direction="b"
              intensity={level.intensity}
              meaning={`B is ${level.intensity.toLowerCase()}-importance more than A`}
              onSelect={() => onSelect(v)}
            />
          );
        })}
        {/* Equal */}
        <ScaleButton
          selected={value === 1}
          direction="equal"
          intensity={SAATY_LEVELS[0].intensity}
          meaning={SAATY_LEVELS[0].meaning}
          onSelect={() => onSelect(1)}
        />
        {/* A more important (positive values, ascending intensity) */}
        {SAATY_LEVELS.filter(l => l.value !== 1).map(level => {
          const selected = value === level.value;
          return (
            <ScaleButton
              key={`a-${level.value}`}
              selected={selected}
              direction="a"
              intensity={level.intensity}
              meaning={`A is ${level.intensity.toLowerCase()}-importance more than B`}
              onSelect={() => onSelect(level.value)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ScaleButton({
  selected, direction, intensity, meaning, onSelect,
}: {
  selected: boolean;
  direction: 'a' | 'b' | 'equal';
  intensity: string;
  meaning: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md border text-left transition-colors',
        selected
          ? 'border-(--color-brand) bg-(--color-brand-soft) text-(--color-brand-strong)'
          : 'border-(--color-border) bg-(--color-bg) hover:bg-(--color-surface-2)',
      )}
    >
      <span className={cn(
        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
        selected ? 'border-(--color-brand) bg-(--color-brand)' : 'border-(--color-border-strong)',
      )}>
        {selected && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
      <span className={cn(
        'inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-wider w-14 px-1.5 py-0.5 rounded flex-shrink-0',
        direction === 'a' && 'bg-sky-100 text-sky-700',
        direction === 'b' && 'bg-fuchsia-100 text-fuchsia-700',
        direction === 'equal' && 'bg-zinc-100 text-zinc-600',
      )}>
        {direction === 'equal' ? 'Equal' : direction === 'a' ? 'A wins' : 'B wins'}
      </span>
      <span className="flex-1 min-w-0">
        <span className="text-[13px] font-medium">{intensity}</span>
        <span className="text-[12px] text-(--color-ink-muted) ml-2">{meaning}</span>
      </span>
    </button>
  );
}

// ============================================================
// Consistency Ratio badge
// ============================================================

function ConsistencyBadge({ cr, eigenvalue, n }: { cr: number; eigenvalue: number; n: number }) {
  const pct = (cr * 100).toFixed(1);
  const ok = cr <= 0.10;
  const undefinedRI = n <= 2;

  if (undefinedRI) {
    return (
      <div className="bg-(--color-surface-2) border border-(--color-border) rounded-md px-3 py-2 text-[12px] text-(--color-ink-muted)">
        Consistency check requires at least 3 criteria.
      </div>
    );
  }

  return (
    <div className={cn(
      'border rounded-md px-4 py-3 flex items-start gap-3',
      ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200',
    )}>
      {ok
        ? <CheckCircle2 size={16} className="text-emerald-700 flex-shrink-0 mt-0.5" />
        : <AlertTriangle size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />}
      <div>
        <div className={cn('text-[13px] font-semibold', ok ? 'text-emerald-800' : 'text-amber-800')}>
          {ok ? 'Consistent judgments' : 'Inconsistent judgments — revise'}
        </div>
        <div className={cn('text-[12px] mt-0.5', ok ? 'text-emerald-700' : 'text-amber-700')}>
          Consistency Ratio = <span className="font-mono">{pct}%</span>
          {' '}(λmax = {eigenvalue.toFixed(3)}, n = {n}).
          {' '}AHP convention: CR ≤ 10% is acceptable.
          {!ok && ' Go back and reconsider pairs that contradict each other (e.g. A>B, B>C, but C>A).'}
        </div>
      </div>
    </div>
  );
}
