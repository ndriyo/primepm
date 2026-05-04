import { useMemo, useRef, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { GridCell } from '../grid/GridCell';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';
import { Plus, Trash2, Users, AlertTriangle, Receipt, ListChecks } from 'lucide-react';
import { computeAllUtilization } from '../../lib/utilization';
import { UtilizationStrip } from './UtilizationStrip';
import { CostBreakdown } from './CostBreakdown';

const RES_COLORS = ['#0ea5e9', '#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#facc15', '#94a3b8'];

const COL = {
  marker: 36,
  color: 36,
  code: 100,
  name: 220,
  allocation: 90,
  rate: 100,
  tasks: 70,
  booked: 80,
  peak: 80,
  utilization: 320,
  delete: 36,
};

type SubView = 'registered' | 'cost';

export function ResourcesView() {
  const [subView, setSubView] = useState<SubView>('registered');

  return (
    <div className="h-full flex flex-col bg-(--color-bg)">
      <div className="px-6 pt-4 pb-2 bg-(--color-surface) border-b border-(--color-border)">
        <div className="flex bg-(--color-surface-2) p-0.5 rounded-md inline-flex">
          {([
            { value: 'registered', label: 'Registered', icon: <ListChecks size={13} /> },
            { value: 'cost', label: 'Cost breakdown', icon: <Receipt size={13} /> },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setSubView(opt.value)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 h-7 text-[12px] font-medium rounded transition-colors',
                subView === opt.value
                  ? 'bg-(--color-surface) text-(--color-ink) shadow-sm'
                  : 'text-(--color-ink-muted) hover:text-(--color-ink)',
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {subView === 'registered' ? <RegisteredView /> : <CostBreakdown />}
      </div>
    </div>
  );
}

function RegisteredView() {
  const resources = useProjectStore(s => s.resources);
  const order = useProjectStore(s => s.resourceOrder);
  const tasks = useProjectStore(s => s.tasks);
  const assignments = useProjectStore(s => s.assignments);
  const schedule = useProjectStore(s => s.schedule);
  const calendar = useProjectStore(s => s.calendar);
  const addResource = useProjectStore(s => s.addResource);
  const updateResource = useProjectStore(s => s.updateResource);
  const deleteResource = useProjectStore(s => s.deleteResource);

  const codeFor = useMemo(() => {
    const m = new Map<string, number>();
    order.forEach((id, i) => m.set(id, i + 1));
    return m;
  }, [order]);

  const utilizations = useMemo(
    () => computeAllUtilization(resources, assignments, tasks, schedule, calendar),
    [resources, assignments, tasks, schedule, calendar],
  );

  const stats = useMemo(() => {
    const m = new Map<string, { taskCount: number; bookedDays: number }>();
    for (const r of resources.values()) m.set(r.id, { taskCount: 0, bookedDays: 0 });
    for (const a of assignments.values()) {
      const t = tasks.get(a.taskId);
      const cur = m.get(a.resourceId);
      if (!t || !cur) continue;
      cur.taskCount += 1;
      cur.bookedDays += (t.durationDays ?? 0) * (a.allocationPct / 100);
    }
    return m;
  }, [resources, tasks, assignments]);

  const totalWidth =
    COL.marker + COL.color + COL.code + COL.name + COL.allocation + COL.rate +
    COL.tasks + COL.booked + COL.peak + COL.utilization + COL.delete;

  const scrollRef = useRef<HTMLDivElement>(null);

  // Aggregate over-allocation summary
  const overAllocCount = useMemo(() => {
    let c = 0;
    for (const u of utilizations.values()) if (u.overAllocDays > 0) c++;
    return c;
  }, [utilizations]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-3 border-b border-(--color-border) bg-(--color-surface) flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-(--color-brand-soft) text-(--color-brand-strong) flex items-center justify-center">
            <Users size={14} />
          </div>
          <div>
            <div className="text-[14px] font-semibold tracking-tight">Registered resources</div>
            <div className="text-[12px] text-(--color-ink-muted)">
              People and roles for this project. Assign them to tasks from the Schedule view.
            </div>
          </div>
          {overAllocCount > 0 && (
            <span className="ml-3 inline-flex items-center gap-1 text-[11px] font-semibold text-(--color-danger) bg-red-50 px-2 py-1 rounded">
              <AlertTriangle size={11} />
              {overAllocCount} over-allocated
            </span>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={() => addResource()}>
          <Plus size={13} /> Add resource
        </Button>
      </div>

      {order.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-(--color-surface) border border-(--color-border) flex items-center justify-center mb-3">
              <Users size={22} className="text-(--color-ink-muted)" />
            </div>
            <div className="text-[14px] font-semibold mb-1">No resources yet</div>
            <div className="text-[12px] text-(--color-ink-muted) mb-3">
              Add the people, roles, or teams that will work on this project. Each
              gets a code (e.g. <code className="font-mono">DEV1</code>), a name,
              a project allocation, and a daily rate.
            </div>
            <Button onClick={() => addResource({ code: 'DEV1', name: 'Lead Developer' })}>
              <Plus size={13} /> Add first resource
            </Button>
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div style={{ width: totalWidth, minWidth: '100%' }}>
            <div
              className="flex items-stretch text-[11px] font-semibold uppercase tracking-wide text-(--color-ink-muted) bg-(--color-surface) border-b border-(--color-border) sticky top-0 z-10"
              style={{ height: 36 }}
            >
              <div className="flex items-center justify-center" style={{ width: COL.marker }}>#</div>
              <div className="flex items-center justify-center" style={{ width: COL.color }} />
              <div className="flex items-center px-2 border-l border-(--color-border)" style={{ width: COL.code }}>Code</div>
              <div className="flex items-center px-2 border-l border-(--color-border)" style={{ width: COL.name }}>Name</div>
              <div className="flex items-center px-2 border-l border-(--color-border)" style={{ width: COL.allocation }}>Alloc.</div>
              <div className="flex items-center px-2 border-l border-(--color-border)" style={{ width: COL.rate }}>Rate /day</div>
              <div className="flex items-center px-2 border-l border-(--color-border)" style={{ width: COL.tasks }}>Tasks</div>
              <div className="flex items-center px-2 border-l border-(--color-border)" style={{ width: COL.booked }}>Booked</div>
              <div className="flex items-center px-2 border-l border-(--color-border)" style={{ width: COL.peak }}>Peak</div>
              <div className="flex items-center px-2 border-l border-(--color-border)" style={{ width: COL.utilization }}>Utilization timeline</div>
              <div className="flex items-center justify-center border-l border-(--color-border)" style={{ width: COL.delete }} />
            </div>

            {order.map(id => {
              const r = resources.get(id);
              const s = stats.get(id);
              const u = utilizations.get(id);
              if (!r) return null;
              const peak = u?.peakPct ?? 0;
              const overAlloc = (u?.overAllocDays ?? 0) > 0;
              return (
                <div
                  key={id}
                  className="flex items-stretch border-b border-(--color-border)/60 hover:bg-(--color-surface-2) bg-(--color-surface)"
                  style={{ height: 56 }}
                >
                  <div
                    className="flex items-center justify-center text-[11px] tabular text-(--color-ink-subtle)"
                    style={{ width: COL.marker }}
                  >
                    {codeFor.get(id)}
                  </div>
                  <div className="flex items-center justify-center" style={{ width: COL.color }}>
                    <ColorPicker value={r.color} onChange={c => updateResource(id, { color: c })} />
                  </div>
                  <div className="flex items-center px-1 border-l border-(--color-border)/60" style={{ width: COL.code }}>
                    <GridCell
                      value={r.code}
                      className="text-[13px] font-mono"
                      onCommit={v => updateResource(id, { code: v })}
                      placeholder="CODE"
                    />
                  </div>
                  <div className="flex items-center px-1 border-l border-(--color-border)/60" style={{ width: COL.name }}>
                    <GridCell
                      value={r.name}
                      className="text-[13px]"
                      onCommit={v => updateResource(id, { name: v })}
                      placeholder="Name"
                    />
                  </div>
                  <div className="flex items-center px-1 border-l border-(--color-border)/60" style={{ width: COL.allocation }}>
                    <GridCell
                      value={`${r.defaultAllocationPct}%`}
                      className="text-[13px] tabular"
                      onCommit={v => {
                        const n = parseInt(v.replace('%', '').trim(), 10);
                        if (!Number.isNaN(n)) updateResource(id, { defaultAllocationPct: Math.max(0, Math.min(100, n)) });
                      }}
                    />
                  </div>
                  <div className="flex items-center px-1 border-l border-(--color-border)/60" style={{ width: COL.rate }}>
                    <GridCell
                      value={(r.ratePerDay ?? 0).toString()}
                      className="text-[13px] tabular"
                      placeholder="0"
                      onCommit={v => {
                        const n = Number(v.replace(/[^0-9.-]/g, ''));
                        if (!Number.isNaN(n)) updateResource(id, { ratePerDay: Math.max(0, n) });
                      }}
                    />
                  </div>
                  <div
                    className={cn(
                      'flex items-center justify-end px-2 border-l border-(--color-border)/60 text-[12px] tabular',
                      (s?.taskCount ?? 0) === 0 && 'text-(--color-ink-subtle)',
                    )}
                    style={{ width: COL.tasks }}
                  >
                    {s?.taskCount ?? 0}
                  </div>
                  <div
                    className={cn(
                      'flex items-center justify-end px-2 border-l border-(--color-border)/60 text-[12px] tabular',
                      (s?.bookedDays ?? 0) === 0 && 'text-(--color-ink-subtle)',
                    )}
                    style={{ width: COL.booked }}
                  >
                    {(s?.bookedDays ?? 0).toFixed(1)}d
                  </div>
                  <div
                    className={cn(
                      'flex items-center justify-end px-2 border-l border-(--color-border)/60 text-[12px] tabular gap-1',
                      overAlloc && 'text-(--color-danger) font-semibold',
                      !overAlloc && peak === 0 && 'text-(--color-ink-subtle)',
                    )}
                    style={{ width: COL.peak }}
                    title={overAlloc ? `${u?.overAllocDays} over-allocated days` : undefined}
                  >
                    {overAlloc && <AlertTriangle size={11} />}
                    {Math.round(peak)}%
                  </div>
                  <div className="flex items-center justify-center px-3 border-l border-(--color-border)/60" style={{ width: COL.utilization }}>
                    {u && <UtilizationStrip utilization={u} width={COL.utilization - 24} height={28} />}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteResource(id)}
                    aria-label="Delete resource"
                    className="flex items-center justify-center text-(--color-ink-subtle) hover:text-(--color-danger) hover:bg-(--color-surface-2) border-l border-(--color-border)/60"
                    style={{ width: COL.delete }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
            <div className="flex items-stretch border-b border-(--color-border)/40" style={{ height: 40 }}>
              <div className="flex items-center justify-center" style={{ width: COL.marker }}>
                <button
                  onClick={() => addResource()}
                  className="w-5 h-5 rounded-full bg-(--color-brand) text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                  aria-label="Add resource"
                >
                  <Plus size={12} />
                </button>
              </div>
              <div
                className="flex items-center px-2 text-[12px] text-(--color-ink-subtle) italic"
                style={{ width: totalWidth - COL.marker }}
              >
                Click + or "Add resource" to define another role
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-(--color-border) bg-(--color-surface) px-6 py-2.5 text-[11px] text-(--color-ink-subtle)">
        <strong className="text-(--color-ink-muted)">Utilization timeline:</strong> bars show per-day total allocation across all assignments. Red = over-allocated (&gt; 100%). Grey = non-working days.
      </div>
    </div>
  );
}

function ColorPicker({ value, onChange }: { value?: string; onChange: (c: string) => void }) {
  return (
    <div className="relative group">
      <button
        type="button"
        className="w-5 h-5 rounded-full ring-2 ring-(--color-border) hover:ring-(--color-brand) transition-colors"
        style={{ background: value ?? '#cbd5e1' }}
        aria-label="Resource color"
      />
      <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 z-20 hidden group-hover:flex p-1.5 rounded-md bg-(--color-surface) shadow-(--shadow-popover) border border-(--color-border) gap-1">
        {RES_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className="w-5 h-5 rounded-full ring-2 ring-transparent hover:ring-(--color-ink) transition-transform hover:scale-110"
            style={{ background: c }}
            aria-label={`Set color ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
