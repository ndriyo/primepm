'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/app/contexts/ProjectContext';

export default function ProjectInformationPage() {
  const router = useRouter();
  const { projects, selectedProject } = useProjects();
  
  useEffect(() => {
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
  }, [router, selectedProject, projects]);

  // This page doesn't render anything, it just redirects
  return (
    <div className="flex justify-center items-center h-32">
      <p>Redirecting to project information...</p>
    </div>
  );
}
