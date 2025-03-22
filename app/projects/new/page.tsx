'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import ProjectEntryForm from '@/app/components/project-entry/ProjectEntryForm';
import { LoadingWrapper } from '@/components/ui/LoadingWrapper';
import { SkeletonProjectForm } from '@/components/ui/skeleton';

export default function NewProjectPage() {
  const [isLoading, setIsLoading] = useState(true);

  // This will simulate initial loading while the form initializes
  // In a real implementation, we would use a context or hook for loading state
  useEffect(() => {
    // Set a short timeout to simulate form initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <LoadingWrapper
          isLoading={isLoading}
          skeleton={<SkeletonProjectForm />}
        >
          <ProjectEntryForm />
        </LoadingWrapper>
      </div>
    </PageLayout>
  );
}
