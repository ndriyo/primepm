import { useState } from 'react';
import { PageLayout } from '@/app/_components/layout/PageLayout';
import { ProjectImportPage } from '@/app/projects/import/components/ProjectImportPage';

export default function ImportProjectsPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
        <ProjectImportPage />
      </div>
    </PageLayout>
  );
}
