'use client';

import React, { Suspense } from 'react';
import { CommitteeProvider } from '@/app/_contexts/CommitteeContext';
import { CommitteeDashboard } from '@/app/committee/_components/CommitteeDashboard';
import { PageLayout } from '@/app/_components/layout/PageLayout';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';
import { SkeletonDashboard } from '@/app/_components/ui/skeleton/SkeletonDashboard';

/**
 * CommitteePage Component
 * 
 * This is the main entry point for the committee review interface.
 * It provides the CommitteeProvider context and renders the CommitteeDashboard.
 */
export default function CommitteePage() {
  return (
    <PageLayout>
      <Suspense fallback={<LoadingWrapper isLoading={true} skeleton={<SkeletonDashboard />}><div /></LoadingWrapper>}>
        <CommitteeProvider>
          <CommitteeDashboard />
        </CommitteeProvider>
      </Suspense>
    </PageLayout>
  );
}
