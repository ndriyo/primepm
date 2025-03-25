'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/app/_components/layout/PageLayout';
import { CriteriaVersionManagement } from '@/app/criteria/components/CriteriaVersionManagement';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';
import { SkeletonCriteriaVersion } from '@/app/_components/ui/skeleton';
import { useCriteria } from '@/app/_hooks/useCriteria';
import { useAuth } from '@/app/_contexts/AuthContext';

export default function CriteriaPage() {
  const { organization } = useAuth();
  const { useVersionsQuery } = useCriteria();
  const organizationId = organization?.id || '';
  
  // We'll use this to determine if we should show loading state
  const { isLoading: versionsLoading } = useVersionsQuery(organizationId);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Criteria Management</h1>
        <p className="text-gray-600 mb-8">
          Manage criteria versions and define weights using the AHP (Analytic Hierarchy Process) wizard.
          Only one version can be active at a time, and the active version will be used for project scoring.
        </p>
        
        <LoadingWrapper
          isLoading={versionsLoading}
          skeleton={<SkeletonCriteriaVersion />}
        >
          <CriteriaVersionManagement />
        </LoadingWrapper>
      </div>
    </PageLayout>
  );
}
