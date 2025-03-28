'use client';

import { PageLayout } from '@/app/_components/layout/PageLayout';
import { ProjectSearchPage } from '@/app/details/components/ProjectSearchPage';
import { Suspense } from 'react';

export default function ProjectDetailsPage() {
  return (
    <PageLayout>
      <Suspense fallback={<div className="p-4">Loading projects...</div>}>
        <ProjectSearchPage />
      </Suspense>
    </PageLayout>
  );
}
