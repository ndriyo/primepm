'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/contexts/AuthContext';
import { fetchWithAuth } from '@/src/lib/fetchInterceptor';
import { LoadingWrapper } from '@/components/ui/LoadingWrapper';
import { SkeletonRedirect } from '@/components/ui/skeleton';
import { PageLayout } from '@/components/layout/PageLayout';

export default function ProjectRedirectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, organization } = useAuth();
  
  useEffect(() => {
    // Use a more efficient approach that doesn't require full project data
    const getFirstProjectId = async () => {
      try {
        // Check cache first to avoid unnecessary network requests
        const cachedProjects = queryClient.getQueryData(['projects']);
        
        if (cachedProjects && Array.isArray(cachedProjects) && cachedProjects.length > 0) {
          // If we have cached projects data, use the first project's ID
          router.push(`/details/${cachedProjects[0].id}`);
          return;
        }
        
        // Make a request with proper auth
        const response = await fetchWithAuth('/api/projects', {}, user);
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const projects = await response.json();
        
        if (projects && projects.length > 0) {
          router.push(`/details/${projects[0].id}`);
        } else {
          // If no projects are available, redirect to selection page
          router.push('/selection');
        }
      } catch (error) {
        console.error('Error redirecting to project details:', error);
        router.push('/selection');
      }
    };
    
    // Small delay for better UX
    const redirectTimeout = setTimeout(() => {
      getFirstProjectId();
    }, 300);
    
    return () => clearTimeout(redirectTimeout);
  }, [router, queryClient, user]);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <LoadingWrapper
          isLoading={true}
          skeleton={<SkeletonRedirect />}
        >
          <div className="flex justify-center items-center h-32">
            <p>Finding your project...</p>
          </div>
        </LoadingWrapper>
      </div>
    </PageLayout>
  );
}
