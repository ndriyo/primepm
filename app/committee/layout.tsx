'use client';

import { Suspense } from 'react';
import { ProjectProvider } from '@/app/_contexts/ProjectContext';
import { CommitteeProvider } from '@/app/_contexts/CommitteeContext';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';

export default function CommitteeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-4">Loading committee data...</div>}>
      <ProjectProvider>
        <CommitteeProvider>
          {children}
        </CommitteeProvider>
      </ProjectProvider>
    </Suspense>
  );
}
