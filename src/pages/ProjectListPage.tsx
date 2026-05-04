import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../api/client';
import type { ProjectSummary } from '../api/types';
import { Button } from '../components/ui/Button';
import { navigate } from '../lib/router';
import { cn } from '../lib/cn';

export function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function refresh() {
    try {
      const { projects } = await apiClient.listProjects();
      setProjects(projects);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'load_error');
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleDelete(id: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient.deleteProject(id);
      setConfirmDelete(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete_error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-full overflow-auto bg-(--color-bg)">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Ongoing projects</h1>
            <p className="text-[13px] text-(--color-ink-muted) mt-0.5">
              Open a project to edit its schedule. Submit new projects from the Project Submission tab.
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/projects/new')}>
            <Plus size={14} /> Submit new project
          </Button>
        </div>

        {error && <div className="mb-4 text-[13px] text-(--color-danger)">{error}</div>}

        {projects === null ? (
          <div className="text-(--color-ink-muted) text-[13px] py-8 text-center">
            Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-(--color-surface) border border-dashed border-(--color-border) rounded-lg">
            <div className="w-12 h-12 mx-auto rounded-full bg-(--color-surface-2) flex items-center justify-center mb-3">
              <FolderOpen size={20} className="text-(--color-ink-muted)" />
            </div>
            <div className="text-[14px] font-semibold">No projects yet</div>
            <div className="text-[12px] text-(--color-ink-muted) mt-1 mb-4">
              Submit your first project to start scheduling.
            </div>
            <Button variant="primary" onClick={() => navigate('/projects/new')}>
              <Plus size={14} /> Submit new project
            </Button>
          </div>
        ) : (
          <ul className="bg-(--color-surface) border border-(--color-border) rounded-lg divide-y divide-(--color-border)/60">
            {projects.map(p => (
              <li
                key={p.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 hover:bg-(--color-surface-2) transition-colors',
                  confirmDelete === p.id && 'bg-red-50',
                )}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/p/${p.id}`)}
                  className="flex-1 text-left flex items-center gap-3 min-w-0"
                >
                  <div className="w-8 h-8 rounded-md bg-(--color-brand-soft) text-(--color-brand-strong) flex items-center justify-center flex-shrink-0">
                    <FolderOpen size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium truncate">{p.name}</div>
                    <div className="text-[12px] text-(--color-ink-muted) flex items-center gap-3 mt-0.5">
                      <span className="inline-flex items-center gap-1 tabular">
                        <Calendar size={11} />
                        {format(new Date(p.startDate), 'MMM d, yyyy')} – {format(new Date(p.endDate), 'MMM d, yyyy')}
                      </span>
                      <span>{p.taskCount} task{p.taskCount === 1 ? '' : 's'}</span>
                      {p.description && <span className="truncate">· {p.description}</span>}
                    </div>
                  </div>
                </button>
                {confirmDelete === p.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-(--color-danger)">Delete?</span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => void handleDelete(p.id)}
                      disabled={busy}
                    >
                      Yes, delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDelete(null)}
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(p.id)}
                    aria-label="Delete project"
                    className="text-(--color-ink-subtle) hover:text-(--color-danger) p-1.5 rounded hover:bg-(--color-surface-2)"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
