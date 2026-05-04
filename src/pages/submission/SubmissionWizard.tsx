import { useEffect, useMemo, useState } from 'react';
import { format, addDays } from 'date-fns';
import { ArrowLeft, ArrowRight, FilePlus2, HelpCircle, X } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { Criterion, CriteriaVersion, Department, SubmissionInput } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { Stepper } from '../../components/ui/Stepper';
import { NumberInput } from '../../components/ui/NumberInput';
import { TagInput } from '../../components/ui/TagInput';
import { computeWeightedScore } from '../../lib/scoreCalculator';
import { cn } from '../../lib/cn';
import { ScoreRadar } from './ScoreRadar';

const STATUSES = ['Initiation', 'Planning', 'In Progress', 'On Hold', 'Completed'];

interface ProjectInfo {
  name: string;
  description: string;
  departmentId: string | null;
  status: string;
  startDate: string;
  endDate: string;
  budget: string;
  resources: string;
  tags: string[];
}

const todayIso = () => format(new Date(), 'yyyy-MM-dd');
const isoPlus = (n: number) => format(addDays(new Date(), n), 'yyyy-MM-dd');

interface Props {
  /** When set, the wizard loads this project for editing. */
  projectId?: string;
  onCancel?: () => void;
  onSaved?: () => void;
}

export function SubmissionWizard({ projectId, onCancel, onSaved }: Props) {
  const isEditing = projectId != null;

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditing);

  const [info, setInfo] = useState<ProjectInfo>({
    name: '',
    description: '',
    departmentId: null,
    status: 'Initiation',
    startDate: todayIso(),
    endDate: isoPlus(90),
    budget: '',
    resources: '',
    tags: [],
  });

  const [scores, setScores] = useState<Record<string, number>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [criteriaVersion, setCriteriaVersion] = useState<CriteriaVersion | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  // Bootstrap: load departments + active criteria, plus existing project if editing.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [deps, active, full] = await Promise.all([
          apiClient.listDepartments(),
          apiClient.getActiveCriteria(),
          isEditing && projectId ? apiClient.getProjectFull(projectId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setDepartments(deps.departments);
        setCriteriaVersion(active.version);
        setCriteria(active.criteria);

        if (full) {
          const p = full.project;
          setInfo({
            name: p.name,
            description: p.description ?? '',
            departmentId: p.departmentId,
            status: p.status,
            startDate: p.startDate.slice(0, 10),
            endDate: p.endDate.slice(0, 10),
            budget: p.budget !== null ? String(p.budget) : '',
            resources: p.resources ? String(p.resources) : '',
            tags: p.tags ?? [],
          });
          // Build initial scores: prefer existing rows; for criteria not present
          // (e.g. project was scored under a different version), fall back to scale.min.
          const sMap: Record<string, number> = {};
          const min = active.version?.scoreMin ?? 0;
          for (const c of active.criteria) sMap[c.id] = min;
          for (const s of full.scores) sMap[s.criterionId] = s.score;
          setScores(sMap);
        } else {
          const initial: Record<string, number> = {};
          const min = active.version?.scoreMin ?? 0;
          for (const c of active.criteria) initial[c.id] = min;
          setScores(initial);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'load_error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, isEditing]);

  const range = useMemo(
    () => ({ min: criteriaVersion?.scoreMin ?? 0, max: criteriaVersion?.scoreMax ?? 5 }),
    [criteriaVersion],
  );
  const weightedScore = useMemo(
    () => computeWeightedScore(scores, criteria, range),
    [scores, criteria, range],
  );

  const stepDefs = [
    { label: 'Project info' },
    { label: 'Self-assessment' },
    { label: 'Review & submit' },
  ];

  function canAdvance(): boolean {
    if (step === 0) {
      return info.name.trim() !== '' && info.startDate !== '' && info.endDate !== '';
    }
    if (step === 1) {
      return criteria.every(c => scores[c.id] !== undefined);
    }
    return true;
  }

  async function handleSubmit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const body: SubmissionInput = {
        name: info.name.trim(),
        description: info.description.trim() || null,
        departmentId: info.departmentId,
        status: info.status,
        startDate: info.startDate,
        endDate: info.endDate,
        budget: info.budget ? Number(info.budget) : null,
        resources: info.resources ? Number(info.resources) : 0,
        tags: info.tags,
        scores: criteria.map(c => ({ criterionId: c.id, score: scores[c.id] ?? range.min })),
        weightedScore,
      };
      if (isEditing && projectId) {
        await apiClient.updateProjectFull(projectId, body);
      } else {
        await apiClient.submitProject(body);
      }
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'submit_error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-[13px] text-(--color-ink-muted)">
        Loading project…
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-(--color-bg)">
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-(--color-brand-soft) text-(--color-brand-strong) flex items-center justify-center">
              <FilePlus2 size={16} />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight">
                {isEditing ? 'Edit project submission' : 'Submit a project'}
              </h1>
              <p className="text-[13px] text-(--color-ink-muted)">
                {isEditing
                  ? 'Update project info and self-assessment scores.'
                  : 'Provide project info and a self-assessment against the active criteria.'}
              </p>
            </div>
          </div>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X size={13} /> Cancel
            </Button>
          )}
        </div>

        <div className="mb-6">
          <Stepper steps={stepDefs} current={step} onJump={i => i < step && setStep(i)} />
        </div>

        <div className="bg-(--color-surface) border border-(--color-border) rounded-lg p-6 shadow-sm">
          {step === 0 && (
            <ProjectInfoStep
              info={info}
              setInfo={setInfo}
              departments={departments}
              showRadar={isEditing && criteria.length > 0}
              criteria={criteria}
              scores={scores}
              range={range}
            />
          )}
          {step === 1 && (
            <SelfAssessmentStep
              criteria={criteria}
              scores={scores}
              setScores={setScores}
              versionName={criteriaVersion?.name ?? null}
              range={range}
            />
          )}
          {step === 2 && (
            <ReviewSubmitStep
              info={info}
              departments={departments}
              criteria={criteria}
              scores={scores}
              weightedScore={weightedScore}
            />
          )}
        </div>

        {error && <div className="mt-4 text-[13px] text-(--color-danger)">{error}</div>}

        <div className="mt-6 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0 || busy}
          >
            <ArrowLeft size={14} /> Back
          </Button>
          {step < 2 ? (
            <Button
              variant="primary"
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance() || busy}
            >
              Next <ArrowRight size={14} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={busy}>
              {busy ? 'Saving…' : isEditing ? 'Save changes' : 'Submit project'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

// =====================================================================
// Step 1 — Project info
// =====================================================================

function ProjectInfoStep({
  info, setInfo, departments, showRadar, criteria, scores, range,
}: {
  info: ProjectInfo;
  setInfo: (u: ProjectInfo | ((p: ProjectInfo) => ProjectInfo)) => void;
  departments: Department[];
  showRadar: boolean;
  criteria: Criterion[];
  scores: Record<string, number>;
  range: { min: number; max: number };
}) {
  const update = <K extends keyof ProjectInfo>(k: K, v: ProjectInfo[K]) =>
    setInfo(p => ({ ...p, [k]: v }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" required full>
          <input
            required
            autoFocus
            value={info.name}
            onChange={e => update('name', e.target.value)}
            className={inputCls}
            placeholder="e.g. Mobile app launch"
          />
        </Field>
        <Field label="Description" full>
          <textarea
            rows={3}
            value={info.description}
            onChange={e => update('description', e.target.value)}
            className={cn(inputCls, 'resize-none')}
            placeholder="One paragraph summary"
          />
        </Field>
        <Field label="Department">
          <select
            value={info.departmentId ?? ''}
            onChange={e => update('departmentId', e.target.value || null)}
            className={inputCls}
          >
            <option value="">— None —</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={info.status} onChange={e => update('status', e.target.value)} className={inputCls}>
            {STATUSES.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        </Field>
        <Field label="Start date" required>
          <input type="date" required value={info.startDate} onChange={e => update('startDate', e.target.value)} className={inputCls} />
        </Field>
        <Field label="End date" required>
          <input type="date" required value={info.endDate} onChange={e => update('endDate', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Budget">
          <NumberInput value={info.budget} onChange={v => update('budget', v)} placeholder="0" min={0} />
        </Field>
        <Field label="Resources (mandays)">
          <NumberInput value={info.resources} onChange={v => update('resources', v)} placeholder="0" min={0} />
        </Field>
        <Field label="Tags" full hint="Press Enter or comma to add">
          <TagInput
            tags={info.tags}
            onChange={tags => update('tags', tags)}
            placeholder="mobile, q4-launch, growth"
          />
        </Field>
      </div>
      {showRadar && <ScoreRadar criteria={criteria} scores={scores} range={range} />}
    </div>
  );
}

// =====================================================================
// Step 2 — Self-Assessment (rubric on demand)
// =====================================================================

function SelfAssessmentStep({
  criteria, scores, setScores, versionName, range,
}: {
  criteria: Criterion[];
  scores: Record<string, number>;
  setScores: (u: Record<string, number> | ((p: Record<string, number>) => Record<string, number>)) => void;
  versionName: string | null;
  range: { min: number; max: number };
}) {
  const [rubricOpen, setRubricOpen] = useState<Record<string, boolean>>({});

  if (criteria.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="text-[14px] font-semibold mb-1">No active criteria</div>
        <div className="text-[12px] text-(--color-ink-muted)">
          Define criteria in <strong>Project Selection</strong> first, then mark a version active.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {versionName && (
        <div className="text-[12px] text-(--color-ink-muted)">
          Scoring against <strong className="text-(--color-ink)">{versionName}</strong>
        </div>
      )}
      {criteria.map(c => {
        const value = scores[c.id] ?? range.min;
        const isOpen = !!rubricOpen[c.id];
        const hasRubric = c.rubric && Object.keys(c.rubric).length > 0;
        return (
          <div key={c.id} className="border border-(--color-border) rounded-md p-4 bg-(--color-bg)">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold flex items-center gap-2">
                  {c.label}
                  {c.isInverse && (
                    <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      Inverse — lower is better
                    </span>
                  )}
                </div>
                {c.description && (
                  <div className="text-[12px] text-(--color-ink-muted) mt-0.5">{c.description}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={range.min}
                  max={range.max}
                  step={1}
                  value={value}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setScores(s => ({ ...s, [c.id]: Math.max(range.min, Math.min(range.max, v)) }));
                  }}
                  className={cn(inputCls, 'w-20 text-center tabular')}
                />
                <span className="text-[11px] text-(--color-ink-subtle) tabular whitespace-nowrap">
                  {range.min}–{range.max}
                </span>
              </div>
            </div>
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={1}
              value={value}
              onChange={e => setScores(s => ({ ...s, [c.id]: Number(e.target.value) }))}
              className="w-full accent-(--color-brand)"
            />
            {hasRubric && (
              <button
                type="button"
                onClick={() => setRubricOpen(p => ({ ...p, [c.id]: !p[c.id] }))}
                className="mt-2 inline-flex items-center gap-1 text-[12px] text-(--color-brand-strong) hover:underline"
              >
                <HelpCircle size={11} />
                {isOpen ? 'Hide rubric' : 'Show scoring rubric'}
              </button>
            )}
            {hasRubric && isOpen && (
              <div className="mt-2 bg-(--color-surface) border border-(--color-border)/70 rounded p-3">
                <div className="text-[11px] uppercase tracking-wide text-(--color-ink-muted) font-semibold mb-1.5">Rubric</div>
                <ul className="text-[12px] flex flex-col gap-1">
                  {Object.entries(c.rubric)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([k, v]) => (
                      <li key={k} className={cn(
                        'flex gap-2',
                        Math.round(value) === Number(k) && 'font-semibold text-(--color-brand-strong)',
                      )}>
                        <span className="font-mono tabular w-6 text-right">{k}:</span>
                        <span>{v}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =====================================================================
// Step 3 — Review & Submit
// =====================================================================

function ReviewSubmitStep({
  info, departments, criteria, scores, weightedScore,
}: {
  info: ProjectInfo;
  departments: Department[];
  criteria: Criterion[];
  scores: Record<string, number>;
  weightedScore: number | null;
}) {
  const dept = departments.find(d => d.id === info.departmentId)?.name ?? '—';
  const fmtNum = (s: string) => (s ? Number(s).toLocaleString() : '—');
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-[13px] font-semibold mb-2">Project info</div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
          <Row label="Name">{info.name || '—'}</Row>
          <Row label="Status">{info.status}</Row>
          <Row label="Department">{dept}</Row>
          <Row label="Dates">{info.startDate} → {info.endDate}</Row>
          <Row label="Budget">{fmtNum(info.budget)}</Row>
          <Row label="Mandays">{fmtNum(info.resources)}</Row>
          <Row label="Tags" wide>
            {info.tags.length === 0
              ? '—'
              : (
                <span className="inline-flex flex-wrap gap-1">
                  {info.tags.map(t => (
                    <span key={t} className="inline-flex items-center text-[11.5px] font-medium bg-(--color-surface-2) border border-(--color-border) rounded-md px-2 py-0.5">
                      {t}
                    </span>
                  ))}
                </span>
              )}
          </Row>
          <Row label="Description" wide>{info.description || '—'}</Row>
        </dl>
      </div>

      <div>
        <div className="text-[13px] font-semibold mb-2">Self-assessment</div>
        {criteria.length === 0 ? (
          <div className="text-[12px] text-(--color-ink-muted)">No criteria scored.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-(--color-ink-muted) border-b border-(--color-border)">
                <th className="text-left py-1.5 font-semibold">Criterion</th>
                <th className="text-right py-1.5 font-semibold">Weight</th>
                <th className="text-right py-1.5 font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map(c => (
                <tr key={c.id} className="border-b border-(--color-border)/50 last:border-0">
                  <td className="py-1.5">{c.label}</td>
                  <td className="py-1.5 text-right tabular">{(c.weight ?? 0).toFixed(3)}</td>
                  <td className="py-1.5 text-right tabular">{scores[c.id] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-(--color-brand-soft) border border-(--color-brand)/30 rounded-md px-4 py-3 flex items-center justify-between">
        <div className="text-[13px] font-medium text-(--color-brand-strong)">Weighted score</div>
        <div className="text-[20px] font-semibold tabular text-(--color-brand-strong)">
          {weightedScore === null ? '—' : weightedScore.toFixed(3)}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Helpers
// =====================================================================

const inputCls =
  'w-full px-3 py-2 rounded border border-(--color-border) bg-(--color-bg) text-[14px] outline-none focus:ring-2 focus:ring-(--color-brand) transition-shadow';

function Field({
  label, children, required, full, hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  full?: boolean;
  hint?: string;
}) {
  return (
    <label className={cn('flex flex-col gap-1', full && 'col-span-2')}>
      <span className="text-[12px] text-(--color-ink-muted)">
        {label}{required && <span className="text-(--color-danger) ml-0.5">*</span>}
        {hint && <span className="text-(--color-ink-subtle) font-normal ml-1">— {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Row({
  label, children, wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <dt className={cn('text-[12px] text-(--color-ink-muted)', wide && 'col-span-1')}>{label}</dt>
      <dd className={cn('text-[13px] text-(--color-ink) truncate', wide && 'col-span-1')}>{children}</dd>
    </>
  );
}
