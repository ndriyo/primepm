import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { PpSidebar } from './PpSidebar';
import { PpTopbar } from './PpTopbar';
import { apiClient } from '../../api/client';

interface Crumb { label: string; onClick?: () => void; }

export function PpShell({
  crumbs,
  children,
  mode = 'page',
}: {
  crumbs: Crumb[];
  children: ReactNode;
  /** "page" wraps content in a vertically-scrolling container.
   *  "full" gives a non-scrolling, flex-filling region (used by the scheduler). */
  mode?: 'page' | 'full';
}) {
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiClient.listProjects()
      .then(({ projects }) => { if (!cancelled) setProjectCount(projects.length); })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="pp-app">
      <PpSidebar projectCount={projectCount} />
      <div className="pp-main">
        <PpTopbar crumbs={crumbs} />
        <div className={mode === 'full' ? 'pp-content-full' : 'pp-content'}>
          {children}
        </div>
      </div>
    </div>
  );
}
