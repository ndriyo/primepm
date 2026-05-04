import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { useProjectStore } from '../../store/projectStore';
import { ArrowRight, Plus, Sparkles, Crosshair, Calendar as CalendarIcon, ChevronsRight, Download, IndentIncrease, IndentDecrease } from 'lucide-react';

function exportJson() {
  const state = useProjectStore.getState();
  const out = {
    project: { ...state.project, start: state.project.start.toISOString() },
    tasks: [...state.tasks.values()].map(t => ({
      ...t,
      manualStart: t.manualStart ? t.manualStart.toISOString() : undefined,
      constraint:
        t.constraint.kind === 'ASAP'
          ? { kind: 'ASAP' }
          : { kind: t.constraint.kind, date: t.constraint.date.toISOString() },
    })),
    taskOrder: state.taskOrder,
    dependencies: [...state.dependencies.values()],
  };
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.project.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords?: string;
  run: () => void;
}

export function CommandPalette() {
  const open = useProjectStore(s => s.commandOpen);
  const close = () => useProjectStore.getState().setCommandOpen(false);
  const tasks = useProjectStore(s => s.tasks);
  const setSelection = useProjectStore(s => s.setSelection);
  const toggleCriticalPath = useProjectStore(s => s.toggleCriticalPath);
  const setTemplatePickerOpen = useProjectStore(s => s.setTemplatePickerOpen);
  const setZoom = useProjectStore(s => s.setZoom);
  const shiftProject = useProjectStore(s => s.shiftProject);
  const addTask = useProjectStore(s => s.addTask);
  const indentTask = useProjectStore(s => s.indentTask);
  const outdentTask = useProjectStore(s => s.outdentTask);
  const selection = useProjectStore(s => s.selection);
  const expandAll = useProjectStore(s => s.expandAll);
  const collapseAll = useProjectStore(s => s.collapseAll);

  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [shiftMode, setShiftMode] = useState(false);
  const [shiftValue, setShiftValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlight(0);
      setShiftMode(false);
      setShiftValue('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const baseCommands: Command[] = useMemo(
    () => [
      {
        id: 'new-task',
        label: 'Add new task',
        icon: <Plus size={14} />,
        keywords: 'create insert',
        run: () => { const id = addTask(); setSelection([id]); close(); },
      },
      {
        id: 'move-project',
        label: 'Move project…',
        hint: 'Shift entire schedule by N days',
        icon: <ChevronsRight size={14} />,
        keywords: 'shift slip delay',
        run: () => setShiftMode(true),
      },
      {
        id: 'critical-path',
        label: 'Toggle critical path',
        icon: <Crosshair size={14} />,
        keywords: 'cpm slack',
        run: () => { toggleCriticalPath(); close(); },
      },
      {
        id: 'templates',
        label: 'Browse templates',
        icon: <Sparkles size={14} />,
        keywords: 'starter examples',
        run: () => { setTemplatePickerOpen(true); close(); },
      },
      ...([
        ['day', 'Zoom: Day'],
        ['week', 'Zoom: Week'],
        ['month', 'Zoom: Month'],
        ['quarter', 'Zoom: Quarter'],
      ] as const).map(([z, label]) => ({
        id: `zoom-${z}`,
        label,
        icon: <CalendarIcon size={14} />,
        run: () => { setZoom(z); close(); },
      })),
      {
        id: 'indent',
        label: 'Indent task — make child of row above',
        hint: 'Tab',
        icon: <IndentIncrease size={14} />,
        keywords: 'wbs nest summary parent rollup hierarchy',
        run: () => {
          for (const id of selection) indentTask(id);
          close();
        },
      },
      {
        id: 'outdent',
        label: 'Outdent task — un-nest from parent',
        hint: 'Shift+Tab',
        icon: <IndentDecrease size={14} />,
        keywords: 'unnest hierarchy promote',
        run: () => {
          for (const id of selection) outdentTask(id);
          close();
        },
      },
      {
        id: 'expand-all',
        label: 'Expand all summaries',
        icon: <IndentDecrease size={14} />,
        keywords: 'show open uncollapse',
        run: () => { expandAll(); close(); },
      },
      {
        id: 'collapse-all',
        label: 'Collapse all summaries',
        icon: <IndentIncrease size={14} />,
        keywords: 'hide close fold',
        run: () => { collapseAll(); close(); },
      },
      {
        id: 'export-json',
        label: 'Export project as JSON',
        icon: <Download size={14} />,
        keywords: 'download save backup',
        run: () => { exportJson(); close(); },
      },
    ],
    [addTask, setSelection, toggleCriticalPath, setTemplatePickerOpen, setZoom, indentTask, outdentTask, selection, expandAll, collapseAll],
  );

  const taskCommands: Command[] = useMemo(
    () =>
      [...tasks.values()].map(t => ({
        id: `task-${t.id}`,
        label: `Go to: ${t.name}`,
        icon: <ArrowRight size={14} />,
        keywords: 'jump select',
        run: () => { setSelection([t.id]); close(); },
      })),
    [tasks, setSelection],
  );

  const filtered = useMemo(() => {
    const all = [...baseCommands, ...taskCommands];
    if (!query.trim()) return all.slice(0, 12);
    const q = query.toLowerCase();
    return all
      .filter(c => c.label.toLowerCase().includes(q) || (c.keywords ?? '').toLowerCase().includes(q))
      .slice(0, 12);
  }, [baseCommands, taskCommands, query]);

  useEffect(() => { setHighlight(h => Math.min(h, Math.max(0, filtered.length - 1))); }, [filtered.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (shiftMode) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const n = parseInt(shiftValue, 10);
        if (!isNaN(n)) shiftProject(n);
        close();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShiftMode(false);
      }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(filtered.length - 1, h + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(0, h - 1)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      filtered[highlight]?.run();
    }
  };

  return (
    <Dialog open={open} onClose={close} className="w-[min(560px,92vw)]">
      <div className="flex flex-col">
        {shiftMode ? (
          <div className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-(--color-ink-muted) mb-2">
              Shift the entire project by…
            </div>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={shiftValue}
                onChange={e => setShiftValue(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="e.g. 7  or  -3"
                className="flex-1 h-10 px-3 rounded-md bg-(--color-surface-2) outline-none text-[14px] tabular focus:bg-(--color-surface) focus:ring-2 focus:ring-(--color-brand)"
              />
              <span className="text-[12px] text-(--color-ink-muted)">days</span>
            </div>
            <div className="mt-2 text-[11px] text-(--color-ink-subtle)">
              Positive = later. Negative = earlier. Press Enter to apply.
            </div>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a command, or jump to a task…"
              className="px-4 h-12 text-[15px] outline-none border-b border-(--color-border) bg-transparent"
            />
            <div className="max-h-[360px] overflow-auto py-1">
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-[13px] text-(--color-ink-subtle)">
                  No matches.
                </div>
              )}
              {filtered.map((c, i) => (
                <button
                  key={c.id}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => c.run()}
                  className={`flex w-full items-center gap-3 px-4 h-9 text-[13px] text-left ${
                    highlight === i ? 'bg-(--color-brand-soft)' : ''
                  }`}
                >
                  <span className="text-(--color-ink-muted)">{c.icon}</span>
                  <span className="flex-1 truncate">{c.label}</span>
                  {c.hint && <span className="text-[11px] text-(--color-ink-subtle) truncate">{c.hint}</span>}
                </button>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-(--color-border) text-[11px] text-(--color-ink-subtle) flex items-center gap-3">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">⏎</kbd> select</span>
              <span><kbd className="font-mono">esc</kbd> close</span>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
