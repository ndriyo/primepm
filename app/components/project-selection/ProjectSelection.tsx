'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectCard } from '@/src/components/project-selection/ProjectCard';
import { ProjectMatrix } from '@/src/components/project-selection/ProjectMatrix';
import { ProjectSelectionTable } from '@/src/components/project-selection/ProjectSelectionTable';
import { CriteriaManagement } from '@/src/components/project-selection/CriteriaManagement';
import { useProjects } from '@/src/hooks/useProjects';
import { useCriteria } from '@/src/hooks/useCriteria';
import { adaptRepositoryProjects } from '@/src/lib/adapters';
import { Project } from '@/src/data/projects';
import { LoadingWrapper } from '@/components/ui/LoadingWrapper';
import { 
  SkeletonTable,
  SkeletonCard,
  SkeletonProjectList  
} from '@/components/ui/skeleton';

export const ProjectSelection = () => {
  // Sample organization ID - in a real app, this would come from auth context
  const organizationId = "org-1"; // Placeholder - replace with actual org ID
  
  const { useProjectsQuery } = useProjects();
  const { useActiveVersionQuery } = useCriteria();
  
  const [viewMode, setViewMode] = useState<'matrix' | 'cards' | 'table' | 'criteria'>('table');
  const router = useRouter();

  // Query hooks
  const { 
    data: repoProjects = [], 
    isLoading: projectsLoading, 
    error: projectsError 
  } = useProjectsQuery({ organizationId, status: 'planning' });
  
  const {
    data: activeVersion,
    isLoading: versionLoading,
    error: versionError
  } = useActiveVersionQuery(organizationId);

  // Convert repository projects to the format expected by UI components
  const projects = adaptRepositoryProjects(repoProjects);

  const handleSelectProject = (project: Project) => {
    // Navigate to project details
    router.push(`/details/${project.id}`);
  };
  
  // Handle error states
  if (projectsError) {
    return <div className="p-6 bg-red-50 border border-red-200 rounded-md">
      <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Projects</h3>
      <p className="text-red-700">
        {projectsError instanceof Error ? projectsError.message : 'An unknown error occurred'}
      </p>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Project Selection</h1>
        <div className="flex space-x-2">
          <button
            className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('table')}
          >
            Table View
          </button>
          <button
            className={`btn ${viewMode === 'matrix' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('matrix')}
          >
            Matrix View
          </button>
          <button
            className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('cards')}
          >
            Card View
          </button>
          <button
            className={`btn ${viewMode === 'criteria' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('criteria')}
          >
            Manage Criteria
          </button>
        </div>
      </div>

      <div className="w-full">
        {/* Main content with appropriate skeleton loaders */}
        <div className="w-full">
          {viewMode === 'matrix' && (
            <LoadingWrapper
              isLoading={projectsLoading}
              skeleton={<SkeletonTable rows={8} columns={5} showHeader={true} />}
            >
              <ProjectMatrix projects={projects} onSelectProject={handleSelectProject} />
            </LoadingWrapper>
          )}
          
          {viewMode === 'cards' && (
            <LoadingWrapper
              isLoading={projectsLoading}
              skeleton={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} headerAction footerAction />
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => handleSelectProject(project)}
                  />
                ))}
              </div>
            </LoadingWrapper>
          )}
          
          {viewMode === 'table' && (
            <ProjectSelectionTable 
              projects={projects} 
              onSelectProject={handleSelectProject}
              loading={projectsLoading}
            />
          )}
          
          {viewMode === 'criteria' && (
            <LoadingWrapper
              isLoading={versionLoading}
              skeleton={<SkeletonProjectList count={3} />}
            >
              {versionError ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Criteria Version</h3>
                  <p className="text-red-700">
                    {versionError instanceof Error ? versionError.message : 'An unknown error occurred'}
                  </p>
                </div>
              ) : activeVersion ? (
                <CriteriaManagement versionId={activeVersion.id} />
              ) : (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">No Active Criteria Version</h3>
                  <p className="text-yellow-700">
                    There is no active criteria version. Please create a version first using the Criteria Version Management.
                  </p>
                </div>
              )}
            </LoadingWrapper>
          )}
        </div>
      </div>
    </div>
  );
};
