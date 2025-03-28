'use client';

import { ProjectProvider } from '@/app/_contexts/ProjectContext';
import { Suspense } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading dashboard data...</div>}>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </Suspense>
  );
}
