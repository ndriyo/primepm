'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects, Project } from '@/app/contexts/ProjectContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useCriteria } from '@/app/contexts/CriteriaContext';
import { useDepartments } from '@/app/contexts/DepartmentContext';
import { ProjectRadarChart } from '@/src/components/project-selection/ProjectRadarChart';
import { 
  PlusCircleIcon, 
  PencilSquareIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface ProjectInformationProps {
  projectId?: string;
}

// API function to delete a project
const deleteProject = async (projectId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
};

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
  const { selectedProject, projects, setSelectedProject, refreshProjects } = useProjects();
  const { user } = useAuth();
  const { criteria } = useCriteria();
  const { departments } = useDepartments();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // Function to get department name from department ID
  const getDepartmentName = (departmentId: string): string => {
    if (!departmentId) return 'Unknown Department';
    
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : 'Unknown Department';
  };
  
  // Refresh projects data when component mounts or user changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await refreshProjects();
      setIsLoading(false);
    };
    
    fetchData();
  }, [refreshProjects, user]);
  
  useEffect(() => {
    // If projectId is provided, find the project by ID
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        setCurrentProject(project);
      } else {
        // If project ID is invalid, redirect to selection page
        router.push('/selection');
      }
    } 
    // If no projectId but selectedProject exists in context, use that
    else if (selectedProject) {
      setCurrentProject(selectedProject);
    } 
    // If neither projectId nor selectedProject, redirect to selection
    else {
      router.push('/selection');
    }
  }, [projectId, selectedProject, projects, setSelectedProject, router]);
  
  const handleChangeProject = (direction: 'next' | 'prev') => {
    const currentIndex = projects.findIndex(p => p.id === currentProject?.id);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % projects.length;
    } else {
      newIndex = (currentIndex - 1 + projects.length) % projects.length;
    }
    
    const nextProject = projects[newIndex];
    setSelectedProject(nextProject);
    setCurrentProject(nextProject);
    
    // Update URL to reflect the new project ID
    router.push(`/details/${nextProject.id}`);
  };

  const handleCreateProject = () => {
    router.push('/projects/new');
  };
  
  const handleEditProject = () => {
    if (currentProject) {
      router.push(`/projects/new?projectId=${currentProject.id}`);
    }
  };
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!currentProject) return;
    
    try {
      const success = await deleteProject(currentProject.id);
      
      if (success) {
        // Find the next project to navigate to
        const currentIndex = projects.findIndex(p => p.id === currentProject.id);
        
        // Refresh the projects list
        await refreshProjects();
        
        if (projects.length > 1) {
          // Calculate next index, avoiding the deleted project
          const nextIndex = (currentIndex + 1) % projects.length;
          // If we're deleting the last project, go to the first one
          const nextProject = projects[nextIndex === currentIndex ? 0 : nextIndex];
          router.push(`/details/${nextProject.id}`);
        } else {
          // No other projects exist, go back to selection
          router.push('/selection');
        }
      }
    } catch (error) {
      console.error('Error during project deletion:', error);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Format number with thousand separator
  const formatNumber = (value?: number): string => {
    if (value === undefined) return '-';
    return value.toLocaleString();
  };

  if (isLoading || !currentProject) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Project Information</h1>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-primary flex items-center"
            onClick={handleCreateProject}
          >
            <PlusCircleIcon className="w-5 h-5 mr-1" />
            New Project
          </button>
          <button
            className="btn btn-primary flex items-center"
            onClick={handleEditProject}
          >
            <PencilSquareIcon className="w-5 h-5 mr-1" />
            Edit
          </button>
          <button
            className="btn btn-danger flex items-center"
            onClick={handleDeleteClick}
          >
            <TrashIcon className="w-5 h-5 mr-1" />
            Delete
          </button>
          <div className="flex space-x-2">
            <button
              className="btn btn-secondary"
              onClick={() => handleChangeProject('prev')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Previous
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleChangeProject('next')}
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Project overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentProject.name}</h2>
                <p className="text-sm text-gray-600">
                  {currentProject.departmentId 
                    ? getDepartmentName(currentProject.departmentId) 
                    : (typeof currentProject.department === 'string' && !currentProject.department.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i) 
                      ? currentProject.department 
                      : getDepartmentName(currentProject.department || ''))}
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">{currentProject.description}</p>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                <p className="text-base font-medium text-gray-900">
                  {new Date(currentProject.startDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                <p className="text-base font-medium text-gray-900">
                  {new Date(currentProject.endDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                <p className="text-base font-medium text-gray-900">
                  ${formatNumber(currentProject.budget)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Resources</h3>
                <p className="text-base font-medium text-gray-900">
                  {formatNumber(currentProject.resources)} mandays
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {currentProject.tags.map((tag) => (
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
          {/* Add debug info before rendering, but not inside JSX */}
          <div className="hidden">
            {(() => {
              console.log('Current project in ProjectInformation:', currentProject);
              console.log('Criteria data being passed to RadarChart:', currentProject.criteria);
              return null;
            })()}
          </div>
          <ProjectRadarChart project={currentProject} />
          
          <div className="mt-6 space-y-4">
            {Object.keys(currentProject.criteria).length > 0 ? (
              Object.entries(currentProject.criteria).map(([key, value]) => {
                // Find the criterion in the context
                const criterionFromContext = criteria.find(c => c.key === key);
                
                // Use context data or default to basic info
                const criterion = {
                  label: criterionFromContext?.label || key,
                  isInverse: criterionFromContext?.isInverse || false,
                  min: criterionFromContext?.scale?.min !== undefined ? Number(criterionFromContext.scale.min) : 1,
                  max: criterionFromContext?.scale?.max !== undefined ? Number(criterionFromContext.scale.max) : 10
                };
                
                // Determine color based on score and whether criterion is inverse
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
      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete "${currentProject?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};
