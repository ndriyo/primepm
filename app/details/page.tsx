'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { ProjectSearchProvider } from '@/app/contexts/ProjectSearchContext';
import { ProjectSearchPage } from '@/app/components/project-search/ProjectSearchPage';
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
