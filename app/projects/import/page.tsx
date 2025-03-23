'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProjectImportPage } from '@/app/components/project-import/ProjectImportPage';

export default function ImportProjectsPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
        <ProjectImportPage />
      </div>
    </PageLayout>
  );
}
