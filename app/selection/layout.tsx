'use client';

import { ProjectProvider } from '@/app/_contexts/ProjectContext';
import { Suspense } from 'react';

export default function SelectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading project data...</div>}>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </Suspense>
  );
}
