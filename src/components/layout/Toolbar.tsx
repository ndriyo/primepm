import { useState } from 'react';
import { useProjectStore, type AppView, type ZoomLevel } from '../../store/projectStore';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import {
  ArrowLeft,
  Calendar,
  CalendarRange,
  Crosshair,
  Keyboard,
  Search,
  Redo2,
  Sparkles,
  Undo2,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { isApiConfigured } from '../../api/client';
import { navigate } from '../../lib/router';

const ZOOM_OPTIONS: { value: ZoomLevel; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

const VIEW_OPTIONS: { value: AppView; label: string; icon: React.ReactNode }[] = [
  { value: 'schedule', label: 'Schedule', icon: <CalendarRange size={13} /> },
  { value: 'resources', label: 'Resources', icon: <Users size={13} /> },
];

export function Toolbar() {
  const project = useProjectStore(s => s.project);
  const setProjectName = useProjectStore(s => s.setProjectName);
  const zoom = useProjectStore(s => s.zoom);
  const setZoom = useProjectStore(s => s.setZoom);
  const view = useProjectStore(s => s.view);
  const setView = useProjectStore(s => s.setView);
  const showCriticalPath = useProjectStore(s => s.showCriticalPath);
  const toggleCriticalPath = useProjectStore(s => s.toggleCriticalPath);
  const undo = useProjectStore(s => s.undo);
  const redo = useProjectStore(s => s.redo);
  const past = useProjectStore(s => s.past);
  const future = useProjectStore(s => s.future);
  const setCommandOpen = useProjectStore(s => s.setCommandOpen);
  const setCheatsheetOpen = useProjectStore(s => s.setCheatsheetOpen);
  const setTemplatePickerOpen = useProjectStore(s => s.setTemplatePickerOpen);

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(project.name);

  return (
    <div className="h-12 flex items-center justify-between px-3 border-b border-(--color-border) bg-(--color-surface) gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {isApiConfigured ? (
          <Tooltip label="Back to projects">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              aria-label="Back to projects"
              className="w-7 h-7 rounded-md bg-(--color-brand) flex items-center justify-center text-white shadow-sm hover:bg-(--color-brand-strong) transition-colors group relative"
            >
              <Zap size={15} className="group-hover:hidden" />
              <ArrowLeft size={15} className="hidden group-hover:block" />
            </button>
          </Tooltip>
        ) : (
          <div className="w-7 h-7 rounded-md bg-(--color-brand) flex items-center justify-center text-white shadow-sm">
            <Zap size={15} />
          </div>
        )}
        {editingName ? (
          <input
            autoFocus
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            onBlur={() => { setEditingName(false); if (draftName.trim()) setProjectName(draftName.trim()); }}
            onKeyDown={e => {
              if (e.key === 'Enter') { setEditingName(false); if (draftName.trim()) setProjectName(draftName.trim()); }
              if (e.key === 'Escape') { setDraftName(project.name); setEditingName(false); }
            }}
            className="font-semibold text-[15px] tracking-tight bg-(--color-surface-2) px-2 py-0.5 rounded outline-none ring-1 ring-(--color-brand)"
          />
        ) : (
          <button
            onClick={() => { setDraftName(project.name); setEditingName(true); }}
            className="font-semibold text-[15px] tracking-tight px-2 py-0.5 rounded hover:bg-(--color-surface-2) transition-colors truncate"
          >
            {project.name}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-(--color-surface-2) p-0.5 rounded-md">
          {VIEW_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setView(opt.value)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 h-6 text-[12px] font-medium rounded transition-colors',
                view === opt.value
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

      <div className="flex items-center gap-1">
        <Tooltip label="Undo" shortcut="⌘Z">
          <Button
            variant="ghost"
            size="sm"
            disabled={past.length === 0}
            onClick={undo}
            aria-label="Undo"
          >
            <Undo2 size={14} />
          </Button>
        </Tooltip>
        <Tooltip label="Redo" shortcut="⌘⇧Z">
          <Button
            variant="ghost"
            size="sm"
            disabled={future.length === 0}
            onClick={redo}
            aria-label="Redo"
          >
            <Redo2 size={14} />
          </Button>
        </Tooltip>

        <div className="w-px h-5 bg-(--color-border) mx-1" />

        {view === 'schedule' && (
          <>
            <div className="flex bg-(--color-surface-2) p-0.5 rounded-md">
              {ZOOM_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setZoom(opt.value)}
                  className={cn(
                    'px-2.5 h-6 text-[12px] font-medium rounded transition-colors',
                    zoom === opt.value
                      ? 'bg-(--color-surface) text-(--color-ink) shadow-sm'
                      : 'text-(--color-ink-muted) hover:text-(--color-ink)',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Tooltip label="Critical path" shortcut="C">
              <Button
                variant={showCriticalPath ? 'primary' : 'ghost'}
                size="sm"
                onClick={toggleCriticalPath}
                aria-label="Toggle critical path"
              >
                <Crosshair size={14} />
              </Button>
            </Tooltip>

            <div className="w-px h-5 bg-(--color-border) mx-1" />
          </>
        )}

        <Tooltip label="Templates">
          <Button variant="ghost" size="sm" onClick={() => setTemplatePickerOpen(true)} aria-label="Templates">
            <Sparkles size={14} />
          </Button>
        </Tooltip>
        <Tooltip label="Command palette" shortcut="⌘K">
          <Button variant="ghost" size="sm" onClick={() => setCommandOpen(true)} aria-label="Open command palette">
            <Search size={14} />
            <span className="text-[11px] text-(--color-ink-muted)">⌘K</span>
          </Button>
        </Tooltip>
        <Tooltip label="Keyboard shortcuts" shortcut="?">
          <Button variant="ghost" size="sm" onClick={() => setCheatsheetOpen(true)} aria-label="Keyboard shortcuts">
            <Keyboard size={14} />
          </Button>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-(--color-ink-muted)">
        <Calendar size={13} />
        <span className="tabular">
          {project.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
