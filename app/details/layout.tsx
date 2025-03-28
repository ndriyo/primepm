'use client';

import { ProjectProvider } from '@/app/_contexts/ProjectContext';
import { ProjectSearchProvider } from '@/app/_contexts/ProjectSearchContext';
import { Suspense } from 'react';

export default function DetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading project data...</div>}>
      <ProjectProvider>
        <ProjectSearchProvider>
          {children}
        </ProjectSearchProvider>
      </ProjectProvider>
    </Suspense>
  );
}
