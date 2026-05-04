import { useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { cn } from '../../lib/cn';
import { Receipt } from 'lucide-react';

const fmtCurrency = (n: number): string =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });

export function CostBreakdown() {
  const tasks = useProjectStore(s => s.tasks);
  const order = useProjectStore(s => s.taskOrder);
  const resources = useProjectStore(s => s.resources);
  const assignments = useProjectStore(s => s.assignments);

  const summaryIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks.values()) if (t.parentId) set.add(t.parentId);
    return set;
  }, [tasks]);

  const taskCost = useMemo(() => {
    const m = new Map<string, { cost: number; assigned: Array<{ code: string; pct: number; days: number; cost: number }> }>();
    for (const t of tasks.values()) m.set(t.id, { cost: 0, assigned: [] });
    for (const a of assignments.values()) {
      const task = tasks.get(a.taskId);
      const res = resources.get(a.resourceId);
      const entry = m.get(a.taskId);
      if (!task || !res || !entry) continue;
      const days = task.durationDays > 0 ? task.durationDays : 0;
      const personDays = days * (a.allocationPct / 100);
      const cost = personDays * (res.ratePerDay ?? 0);
      entry.cost += cost;
      entry.assigned.push({ code: res.code, pct: a.allocationPct, days: personDays, cost });
    }
    return m;
  }, [tasks, resources, assignments]);

  // Roll up costs to summary tasks (sum of descendants)
  const rolledCost = useMemo(() => {
    const childrenOf = new Map<string, string[]>();
    for (const t of tasks.values()) {
      if (t.parentId) {
        const arr = childrenOf.get(t.parentId);
        if (arr) arr.push(t.id);
        else childrenOf.set(t.parentId, [t.id]);
      }
    }
    const out = new Map<string, number>();
    for (const t of tasks.values()) {
      if (childrenOf.has(t.id)) {
        // Walk descendants
        let total = 0;
        const stack = [...(childrenOf.get(t.id) ?? [])];
        while (stack.length) {
          const id = stack.pop()!;
          const kids = childrenOf.get(id);
          if (kids) stack.push(...kids);
          else total += taskCost.get(id)?.cost ?? 0;
        }
        out.set(t.id, total);
      } else {
        out.set(t.id, taskCost.get(t.id)?.cost ?? 0);
      }
    }
    return out;
  }, [tasks, taskCost]);

  const grandTotal = useMemo(() => {
    let total = 0;
    for (const id of order) {
      const t = tasks.get(id);
      if (!t) continue;
      // Only count leaves (children) so we don't double-count rolled up summaries
      if (!summaryIds.has(id)) total += taskCost.get(id)?.cost ?? 0;
    }
    return total;
  }, [order, tasks, taskCost, summaryIds]);

  const depthOf = useMemo(() => {
    const m = new Map<string, number>();
    for (const id of order) {
      let d = 0;
      let cur = tasks.get(id);
      while (cur && cur.parentId) {
        d++;
        cur = tasks.get(cur.parentId);
      }
      m.set(id, d);
    }
    return m;
  }, [order, tasks]);

  const COL = {
    name: 320,
    duration: 80,
    assigned: 380,
    cost: 140,
  };
  const totalWidth = COL.name + COL.duration + COL.assigned + COL.cost;

  return (
    <div className="h-full flex flex-col bg-(--color-bg)">
      <div className="px-6 py-4 border-b border-(--color-border) bg-(--color-surface) flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-(--color-brand-soft) text-(--color-brand-strong) flex items-center justify-center">
            <Receipt size={14} />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight">Cost breakdown</div>
            <div className="text-[12px] text-(--color-ink-muted)">
              cost = duration × allocation% × resource rate. Set rates on the Registered tab.
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wide text-(--color-ink-muted)">Project total</div>
          <div className="text-[20px] font-semibold tabular text-(--color-ink)">
            {fmtCurrency(grandTotal)}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div style={{ width: totalWidth, minWidth: '100%' }}>
          {/* Header */}
          <div
            className="flex items-stretch text-[11px] font-semibold uppercase tracking-wide text-(--color-ink-muted) bg-(--color-surface) border-b border-(--color-border) sticky top-0 z-10"
            style={{ height: 36 }}
          >
            <div className="flex items-center px-3" style={{ width: COL.name }}>Task</div>
            <div className="flex items-center px-2 border-l border-(--color-border)" style={{ width: COL.duration }}>Duration</div>
            <div className="flex items-center px-2 border-l border-(--color-border)" style={{ width: COL.assigned }}>Assignments</div>
            <div className="flex items-center justify-end px-3 border-l border-(--color-border)" style={{ width: COL.cost }}>Cost</div>
          </div>

          {order.map(id => {
            const t = tasks.get(id);
            if (!t) return null;
            const isSummary = summaryIds.has(id);
            const depth = depthOf.get(id) ?? 0;
            const cost = isSummary ? (rolledCost.get(id) ?? 0) : (taskCost.get(id)?.cost ?? 0);
            const entry = taskCost.get(id);
            return (
              <div
                key={id}
                className={cn(
                  'flex items-stretch border-b border-(--color-border)/60 hover:bg-(--color-surface-2)',
                  isSummary && 'bg-(--color-surface)/60',
                )}
                style={{ height: 36 }}
              >
                <div className="flex items-center px-3" style={{ width: COL.name }}>
                  <div style={{ width: depth * 14 }} className="flex-shrink-0" />
                  <div className={cn('text-[13px] truncate', isSummary && 'font-semibold')}>
                    {t.name}
                  </div>
                </div>
                <div className="flex items-center justify-end px-2 border-l border-(--color-border)/60 text-[12px] tabular text-(--color-ink-muted)" style={{ width: COL.duration }}>
                  {isSummary ? '—' : `${t.durationDays}d`}
                </div>
                <div className="flex items-center px-2 border-l border-(--color-border)/60 text-[12px] tabular gap-1.5 truncate" style={{ width: COL.assigned }}>
                  {isSummary ? (
                    <span className="text-(--color-ink-subtle) italic">{rolledCost.has(id) ? 'rolled up' : ''}</span>
                  ) : entry && entry.assigned.length > 0 ? (
                    entry.assigned.map((a, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-(--color-surface-2) text-(--color-ink-muted) font-mono text-[11px]">
                        {a.code} · {a.pct}% · {fmtCurrency(a.cost)}
                      </span>
                    ))
                  ) : (
                    <span className="text-(--color-ink-subtle)">—</span>
                  )}
                </div>
                <div className={cn(
                  'flex items-center justify-end px-3 border-l border-(--color-border)/60 text-[13px] tabular',
                  cost === 0 && 'text-(--color-ink-subtle)',
                  isSummary && 'font-semibold',
                )} style={{ width: COL.cost }}>
                  {fmtCurrency(cost)}
                </div>
              </div>
            );
          })}

          {/* Footer total */}
          <div
            className="flex items-stretch border-b border-(--color-border) bg-(--color-surface) text-[13px] font-semibold tabular sticky bottom-0"
            style={{ height: 40 }}
          >
            <div className="flex items-center px-3" style={{ width: COL.name + COL.duration + COL.assigned }}>
              Total
            </div>
            <div className="flex items-center justify-end px-3 border-l border-(--color-border)" style={{ width: COL.cost }}>
              {fmtCurrency(grandTotal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
