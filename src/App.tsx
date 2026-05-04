import { useEffect, useRef, useState } from 'react';
import { useResizeDrag } from './lib/useResize';
import { Toolbar } from './components/layout/Toolbar';
import { StatusBar } from './components/layout/StatusBar';
import { GanttChart } from './components/gantt/GanttChart';
import { TaskGrid } from './components/grid/TaskGrid';
import { TaskInspector } from './components/inspector/TaskInspector';
import { TemplatePicker } from './components/templates/TemplatePicker';
import { CommandPalette } from './components/command/CommandPalette';
import { KeyboardCheatsheet } from './components/shortcuts/KeyboardCheatsheet';
import { ResourcesView } from './components/resources/ResourcesView';
import { useGlobalShortcuts } from './components/shortcuts/useGlobalShortcuts';
import { loadFromApi, loadFromStorage, usePersistence } from './store/persistence';
import { useProjectStore } from './store/projectStore';
import { useAuth } from './auth/useAuth';
import { LoginPage } from './auth/LoginPage';
import { isApiConfigured } from './api/client';
import { useRoute, navigate } from './lib/router';
import { PpShell } from './components/layout/PpShell';
import { SubmissionPage } from './pages/submission/SubmissionPage';
import { SelectionPage } from './pages/selection/SelectionPage';
import { DashboardRealPage } from './pages/dashboard/DashboardRealPage';
import { DashboardSoonPage } from './pages/dashboard/DashboardSoonPage';
import { OngoingProjectListPage } from './pages/ongoing/OngoingProjectListPage';
import { OngoingProjectDetailPage } from './pages/ongoing/OngoingProjectDetailPage';
import { OngoingProjectSoonPage } from './pages/ongoing/OngoingProjectSoonPage';
import { OngoingProjectSoonDetailPage } from './pages/ongoing/OngoingProjectSoonDetailPage';
import { SoonPage } from './pages/SoonPage';
import { ObjectivesSoonPage } from './pages/soon/ObjectivesSoonPage';
import { RisksSoonPage } from './pages/soon/RisksSoonPage';

const GRID_PANE_MIN = 240;
const GRID_PANE_MAX = 1400;

export default function App() {
  const { session, loading: authLoading, configured } = useAuth();
  const route = useRoute();
  const apiMode = isApiConfigured;

  if (route.name === 'login') {
    // Already authenticated — skip the login screen
    if (configured && apiMode && !authLoading && session) {
      navigate('/projects');
      return null;
    }
    return <LoginPage />;
  }

  if (configured && apiMode) {
    if (authLoading) {
      return <div className="h-full w-full flex items-center justify-center text-(--color-ink-muted) text-[13px]">Loading…</div>;
    }
    if (!session) {
      navigate('/login');
      return null;
    }
  }

  if (apiMode) {
    // Scheduler now lives inside the new shell (sidebar visible across navs).
    if (route.name === 'project') {
      return (
        <PpShell
          mode="full"
          crumbs={[
            { label: 'Projects', onClick: () => navigate('/projects') },
            { label: 'Schedule' },
          ]}
        >
          <AppContent projectId={route.id} key={route.id} />
        </PpShell>
      );
    }

    // New design routes (each page provides its own PpShell wrapper)
    if (route.name === 'dashboard') return <DashboardRealPage />;
    if (route.name === 'dashboard-soon') return <DashboardSoonPage />;
    if (route.name === 'list') return <OngoingProjectListPage />;
    if (route.name === 'project-detail') return <OngoingProjectDetailPage projectId={route.id} key={route.id} />;
    if (route.name === 'ongoing-soon') return <OngoingProjectSoonPage />;
    if (route.name === 'ongoing-soon-detail') return <OngoingProjectSoonDetailPage id={route.id} key={route.id} />;
    if (route.name === 'soon') {
      if (route.kind === 'objectives') return <ObjectivesSoonPage />;
      if (route.kind === 'risks') return <RisksSoonPage />;
      return <SoonPage kind={route.kind} />;
    }

    // Existing pages — wrap inside the new shell (their internal styling stays light/old).
    if (route.name === 'submission') {
      return <PpShell crumbs={[{ label: 'Projects' }, { label: 'Project Submission' }]}><SubmissionPage /></PpShell>;
    }
    if (route.name === 'selection') {
      return <PpShell crumbs={[{ label: 'Projects' }, { label: 'Project Selection' }]}><SelectionPage /></PpShell>;
    }
    // 'project-edit' uses SubmissionPage internal edit mode — for now route to submission list.
    if (route.name === 'project-edit') {
      return <PpShell crumbs={[{ label: 'Projects' }, { label: 'Project Submission' }]}><SubmissionPage /></PpShell>;
    }

    // Fallback → dashboard
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/dashboard');
      return <DashboardRealPage />;
    }
  }

  return <AppContent projectId={null} />;
}

function AppContent({ projectId }: { projectId: string | null }) {
  const [scrollY, setScrollY] = useState(0);
  const [gridPaneWidth, setGridPaneWidth] = useState(720);
  const startGridWidth = useRef(720);
  const view = useProjectStore(s => s.view);
  const apiMode = isApiConfigured && projectId != null;

  const { savedAgo } = usePersistence(
    apiMode ? { mode: 'api', projectId: projectId! } : { mode: 'local' },
  );
  useGlobalShortcuts();

  const onPaneResize = useResizeDrag({
    axis: 'x',
    onStart: () => { startGridWidth.current = gridPaneWidth; },
    onResize: delta => {
      const next = Math.max(GRID_PANE_MIN, Math.min(GRID_PANE_MAX, startGridWidth.current + delta));
      setGridPaneWidth(next);
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (apiMode && projectId) {
        useProjectStore.getState().reset();
        try {
          const ok = await loadFromApi(projectId);
          if (cancelled) return;
          if (ok) {
            const state = useProjectStore.getState();
            const isEmpty = state.tasks.size === 0 && state.taskOrder.length === 0;
            useProjectStore.getState().setTemplatePickerOpen(isEmpty);
            return;
          }
          navigate('/projects');
        } catch {
          navigate('/projects');
        }
        return;
      }
      const had = loadFromStorage();
      if (cancelled) return;
      if (!had) useProjectStore.getState().setTemplatePickerOpen(true);
      else useProjectStore.getState().setTemplatePickerOpen(false);
    }

    void bootstrap();
    return () => { cancelled = true; };
  }, [apiMode, projectId]);

  return (
    <div className="h-full w-full flex flex-col bg-(--color-bg)">
      <Toolbar />
      <div className="flex-1 flex relative overflow-hidden min-h-0">
        {view === 'schedule' ? (
          <>
            <div style={{ width: gridPaneWidth, flexShrink: 0 }} className="relative">
              <TaskGrid scrollY={scrollY} onScrollY={setScrollY} />
            </div>
            <div
              className="relative w-1 bg-(--color-border) hover:bg-(--color-brand) cursor-col-resize transition-colors group flex-shrink-0"
              onPointerDown={onPaneResize}
              title="Drag to resize"
            >
              <div className="absolute -left-1 -right-1 top-0 bottom-0" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-(--color-border-strong) group-hover:bg-white rounded-full pointer-events-none" />
            </div>
            <div className="flex-1 relative min-w-0">
              <GanttChart scrollY={scrollY} onScrollY={setScrollY} />
              <TaskInspector />
            </div>
          </>
        ) : (
          <div className="flex-1 min-w-0"><ResourcesView /></div>
        )}
      </div>
      <StatusBar savedAgo={savedAgo} />
      <TemplatePicker />
      <CommandPalette />
      <KeyboardCheatsheet />
    </div>
  );
}
