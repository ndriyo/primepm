'use client';

import { ProjectProvider } from '@/app/_contexts/ProjectContext';
import { Suspense } from 'react';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading reports data...</div>}>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </Suspense>
  );
}
