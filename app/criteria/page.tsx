'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { CriteriaVersionManagement } from '@/src/components/project-selection/CriteriaVersionManagement';

export default function CriteriaPage() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Criteria Management</h1>
        <p className="text-gray-600 mb-8">
          Manage criteria versions and define weights using the AHP (Analytic Hierarchy Process) wizard.
          Only one version can be active at a time, and the active version will be used for project scoring.
        </p>
        
        <CriteriaVersionManagement />
      </div>
    </PageLayout>
  );
}
