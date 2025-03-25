'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Project } from '@/app/_contexts/ProjectContext';
import { useAuth } from '@/app/_contexts/AuthContext';
import { useProjectDetails, ProjectWithDetails } from '@/app/_hooks/useProjectDetails';
import { useCriteriaQuery } from '@/app/_hooks/useCriteriaQuery';
import { ProjectRadarChart } from '@/src/components/project-selection/ProjectRadarChart';
import { 
  PlusCircleIcon, 
  PencilSquareIcon, 
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ConfirmationDialog } from '@/app/_components/ui/ConfirmationDialog';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';
import { SkeletonCard } from '@/app/_components/ui/skeleton';

interface ProjectInformationProps {
  projectId: string;
}

// Tag color variants based on string hash
const TAG_COLORS = [
  'bg-blue-100 text-blue-800',   // Blue
  'bg-green-100 text-green-800', // Green
  'bg-yellow-100 text-yellow-800', // Yellow
  'bg-purple-100 text-purple-800', // Purple
  'bg-pink-100 text-pink-800',   // Pink
  'bg-indigo-100 text-indigo-800', // Indigo
  'bg-red-100 text-red-800',     // Red
  'bg-orange-100 text-orange-800', // Orange
  'bg-teal-100 text-teal-800',   // Teal
];

// Generate a consistent color for a tag
const getTagColor = (tag: string): string => {
  // Simple string hash
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash + tag.charCodeAt(i)) % TAG_COLORS.length;
  }
  return TAG_COLORS[hash];
};

export const ProjectInformation = ({ projectId }: ProjectInformationProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { criteria } = useCriteriaQuery();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Use our optimized hook to fetch project details
  const { 
    data: project,
    isLoading,
    error,
    refetch
  } = useProjectDetails(projectId);

  // Prefetch next and previous projects when available
  useEffect(() => {
    const prefetchProjects = async () => {
      try {
        // This could be enhanced with logic to prefetch next/prev projects
        // based on the current project's position in a list
      } catch (error) {
        console.error('Error prefetching projects:', error);
      }
    };
    
    prefetchProjects();
  }, [projectId]);

  // Handle navigation to create/edit project
  const handleCreateProject = () => {
    router.push('/projects/new');
  };
  
  const handleEditProject = () => {
    router.push(`/projects/new?projectId=${projectId}`);
  };
  
  // Delete project handler
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'x-organization-id': user?.organizationId || '',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || '',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      
      // Navigate to projects selection page
      router.push('/details');
    } catch (error) {
      console.error('Error during project deletion:', error);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Format number with thousand separator
  const formatNumber = (value?: number | null): string => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString();
  };

  // If there's an error, show an error message
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <h3 className="text-lg font-medium">Error loading project</h3>
        <p>{(error as Error).message || 'Unknown error occurred'}</p>
        <button 
          className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md"
          onClick={() => refetch()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Project Information</h1>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-secondary flex items-center"
            onClick={() => router.push('/details')}
            disabled={isLoading}
          >
            <XMarkIcon className="w-5 h-5 mr-1" />
            Cancel
          </button>
          <button
            className="btn btn-primary flex items-center"
            onClick={handleEditProject}
            disabled={isLoading}
          >
            <PencilSquareIcon className="w-5 h-5 mr-1" />
            Edit
          </button>
          <button
            className="btn btn-danger flex items-center"
            onClick={handleDeleteClick}
            disabled={isLoading}
          >
            <TrashIcon className="w-5 h-5 mr-1" />
            Delete
          </button>
        </div>
      </div>
      
      <LoadingWrapper
        isLoading={isLoading}
        skeleton={
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SkeletonCard className="h-64"/>
            </div>
            <div>
              <SkeletonCard className="h-64"/>
            </div>
          </div>
        }
      >
        {project && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
                    <p className="text-sm text-gray-600">
                      {project.department?.name || 'Unknown Department'}
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6">{project.description}</p>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(project.startDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(project.endDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                    <p className="text-base font-medium text-gray-900">
                      ${formatNumber(project.budget)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Resources</h3>
                    <p className="text-base font-medium text-gray-900">
                      {formatNumber(project.resources)} mandays
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Criteria Analysis</h3>
              
              {/* Overall Score */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700">Overall Score</h4>
                  <span className={`text-lg font-bold ${
                    (project.score || 0) >= 7 ? 'text-green-600' : 
                    (project.score || 0) >= 4 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {project.score?.toFixed(2) || 'N/A'}
                  </span>
                </div>
                {project.score && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(project.score / 10) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
              
              <ProjectRadarChart 
                project={project as unknown as Project} 
                criteria={criteria}
              />
              
              <div className="mt-6 space-y-4">
                {Object.keys(project.criteria).length > 0 ? (
                  Object.entries(project.criteria).map(([key, value]) => {
                    // Find the criterion in the context
                    const criterionFromContext = criteria.find((c: { key: string }) => c.key === key);
                    
                    // Use context data or default to basic info
                    const criterion = {
                      label: criterionFromContext?.label || key,
                      isInverse: criterionFromContext?.isInverse || false,
                      min: criterionFromContext?.scale?.min !== undefined ? Number(criterionFromContext.scale.min) : 1,
                      max: criterionFromContext?.scale?.max !== undefined ? Number(criterionFromContext.scale.max) : 10
                    };
                    
                    // Determine color based on score and criterion properties
                    const getColorClass = (score: number, isInverse: boolean, min: number, max: number) => {
                      // Calculate threshold points as percentages of the range
                      const range = max - min;
                      const lowThreshold = min + range * 0.3;
                      const midThreshold = min + range * 0.7;
                      
                      if (isInverse) {
                        return score <= lowThreshold ? 'bg-green-500' : 
                              score <= midThreshold ? 'bg-yellow-500' : 'bg-red-500';
                      } else {
                        return score >= midThreshold ? 'bg-green-500' :
                              score >= lowThreshold ? 'bg-blue-500' : 'bg-red-500';
                      }
                    };
                    
                    // Calculate width percentage based on the criterion's scale
                    const getWidthPercentage = (value: number, min: number, max: number) => {
                      const percentage = ((value - min) / (max - min)) * 100;
                      return Math.max(0, Math.min(100, percentage)); // Clamp between 0-100
                    };
                    
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-medium text-gray-700">
                            {criterion.label}
                            {criterion.isInverse && <span className="ml-1 text-xs text-gray-500">(Lower is better)</span>}
                          </h4>
                          <span className="text-sm font-medium text-gray-900">{value}/{criterion.max}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${getColorClass(value, criterion.isInverse, criterion.min, criterion.max)} h-2 rounded-full`}
                            style={{ width: `${getWidthPercentage(value, criterion.min, criterion.max)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>No criteria scores available for this project</p>
                    <p className="text-sm mt-1">Add criteria scores in the database to see analysis here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </LoadingWrapper>
      
      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete "${project?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};
