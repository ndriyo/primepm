'use client';

import { ProjectProvider } from '@/app/_contexts/ProjectContext';
import { Suspense } from 'react';

export default function CriteriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading criteria data...</div>}>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </Suspense>
  );
}
