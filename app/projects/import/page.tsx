'use client';

import { useState } from 'react';
import { PageLayout } from '@/app/_components/layout/PageLayout';
import { ProjectImportPage } from '@/app/projects/import/components/ProjectImportPage';
import { CriteriaVersionWarning } from '@/app/_components/ui/CriteriaVersionWarning';

export default function ImportProjectsPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6">
          <CriteriaVersionWarning customMessage="Active criteria version required: Without an active criteria version, you cannot import projects or download templates." />
        </div>
        <ProjectImportPage />
      </div>
    </PageLayout>
  );
}
