import { Dialog } from '../ui/Dialog';
import { useProjectStore } from '../../store/projectStore';

const SECTIONS = [
  {
    title: 'General',
    items: [
      ['⌘ K', 'Open command palette'],
      ['?', 'Show this cheatsheet'],
      ['⌘ Z', 'Undo'],
      ['⌘ ⇧ Z', 'Redo'],
      ['Esc', 'Clear selection'],
    ],
  },
  {
    title: 'Tasks',
    items: [
      ['Enter', 'Commit cell edit'],
      ['Double-click', 'Edit cell'],
      ['⌘ ⏎', 'Insert task below selected'],
      ['⌘ ⇧ ⏎', 'Insert task above selected'],
      ['⌘ ⌥ ⏎', 'Insert sub-task under selected'],
      ['Right-click', 'Open task context menu'],
      ['Drag handle', 'Re-order / re-parent task'],
      ['Tab', 'Indent (make sub-task)'],
      ['⇧ Tab', 'Outdent (un-nest)'],
      ['⌥ ↑ / ⌥ ↓', 'Move selected task'],
      ['Delete', 'Delete selected task'],
    ],
  },
  {
    title: 'Gantt',
    items: [
      ['Drag bar', 'Move task'],
      ['Drag bar edge', 'Resize task'],
      ['Drag from nub', 'Create dependency (auto-typed FS/SS/FF/SF)'],
      ['Hover arrow + click ×', 'Delete dependency'],
      ['C', 'Toggle critical path'],
      ['1 / 2 / 3 / 4', 'Zoom: Day / Week / Month / Quarter'],
    ],
  },
  {
    title: 'Smart input',
    items: [
      ['3w', 'Duration: 3 weeks (15 working days)'],
      ['next Mon', 'Date: next Monday'],
      ['+5d / -2w', 'Date: relative to now'],
      ['Dec 15', 'Date: any natural format'],
    ],
  },
];

export function KeyboardCheatsheet() {
  const open = useProjectStore(s => s.cheatsheetOpen);
  const close = () => useProjectStore.getState().setCheatsheetOpen(false);
  return (
    <Dialog open={open} onClose={close} className="w-[min(720px,92vw)] p-6">
      <div className="text-center mb-4">
        <h2 className="text-[20px] font-semibold tracking-tight">Keyboard shortcuts</h2>
        <p className="mt-0.5 text-[13px] text-(--color-ink-muted)">
          The fastest way to plan. Most actions have a key.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        {SECTIONS.map(sec => (
          <div key={sec.title}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-(--color-ink-muted) mb-2">
              {sec.title}
            </div>
            <ul className="space-y-1.5">
              {sec.items.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between text-[13px]">
                  <span className="text-(--color-ink-muted)">{v}</span>
                  <kbd className="font-mono text-[11px] bg-(--color-surface-2) border border-(--color-border) rounded px-1.5 py-0.5 text-(--color-ink) min-w-7 text-center">
                    {k}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
