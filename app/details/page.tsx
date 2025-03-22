'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/app/contexts/ProjectContext';
import { LoadingWrapper } from '@/components/ui/LoadingWrapper';
import { SkeletonRedirect } from '@/components/ui/skeleton';
import { PageLayout } from '@/components/layout/PageLayout';

export default function ProjectInformationPage() {
  const router = useRouter();
  const { projects, selectedProject, loading } = useProjects();
  const [redirecting, setRedirecting] = useState(true);
  
  useEffect(() => {
    // Don't attempt to redirect until projects are loaded
    if (loading) return;
    
    const redirectTimeout = setTimeout(() => {
      // If there's a selected project, redirect to its details page
      if (selectedProject) {
        router.push(`/details/${selectedProject.id}`);
      } 
      // If there's no selected project but there are projects, redirect to the first one
      else if (projects.length > 0) {
        router.push(`/details/${projects[0].id}`);
      }
      // If there are no projects, redirect to selection page
      else {
        router.push('/selection');
      }
    }, 800); // Small delay for better UX
    
    return () => clearTimeout(redirectTimeout);
  }, [router, selectedProject, projects, loading]);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <LoadingWrapper
          isLoading={true} // Always show the skeleton while redirecting
          skeleton={<SkeletonRedirect />}
        >
          <div className="flex justify-center items-center h-32">
            <p>Redirecting to project information...</p>
          </div>
        </LoadingWrapper>
      </div>
    </PageLayout>
  );
}
