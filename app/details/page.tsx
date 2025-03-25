'use client';

import { PageLayout } from '@/app/_components/layout/PageLayout';
import { ProjectSearchProvider } from '@/app/_contexts/ProjectSearchContext';
import { ProjectSearchPage } from '@/app/details/components/ProjectSearchPage';
import { Suspense } from 'react';

export default function ProjectDetailsPage() {
  return (
    <PageLayout>
      <Suspense fallback={<div className="p-4">Loading projects...</div>}>
        <ProjectSearchProvider>
          <ProjectSearchPage />
        </ProjectSearchProvider>
      </Suspense>
    </PageLayout>
  );
}
