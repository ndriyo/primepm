import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { PpSidebar } from './PpSidebar';
import { PpTopbar } from './PpTopbar';
import { apiClient } from '../../api/client';

interface Crumb { label: string; onClick?: () => void; }

export function PpShell({
  crumbs,
  children,
}: {
  crumbs: Crumb[];
  children: ReactNode;
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
        {children}
      </div>
    </div>
  );
}
