'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/app/contexts/ProjectContext';
import { ProjectRadarChart } from '@/src/components/project-selection/ProjectRadarChart';
import { Project } from '@/src/data/projects';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

interface ProjectInformationProps {
  projectId?: string;
}

export const ProjectInformation = ({ projectId }: ProjectInformationProps) => {
  const { selectedProject, projects, setSelectedProject } = useProjects();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const router = useRouter();
  
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
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

  // Format number with thousand separator
  const formatNumber = (value?: number): string => {
    if (value === undefined) return '-';
    return value.toLocaleString();
  };

  if (!currentProject) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Project Information</h1>
        <div className="flex space-x-2">
          <button
            className="btn btn-primary flex items-center"
            onClick={handleCreateProject}
          >
            <PlusCircleIcon className="w-5 h-5 mr-1" />
            New Project
          </button>
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
      
      {/* Project overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentProject.name}</h2>
                <p className="text-sm text-gray-600">{currentProject.department}</p>
              </div>
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                  currentProject.status
                )}`}
              >
                {currentProject.status.charAt(0).toUpperCase() + currentProject.status.slice(1).replace('-', ' ')}
              </span>
            </div>
            
            <p className="text-gray-700 mb-6">{currentProject.description}</p>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                <p className="text-base font-medium text-gray-900">
                  {new Date(currentProject.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                <p className="text-base font-medium text-gray-900">
                  {new Date(currentProject.endDate).toLocaleDateString()}
                </p>
              </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Duration</h3>
            <p className="text-base font-medium text-gray-900">
              {Math.ceil(
                (new Date(currentProject.endDate).getTime() - new Date(currentProject.startDate).getTime()) /
                  (1000 * 60 * 60 * 24 * 30)
              )}{' '}
              months
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
              {formatNumber(currentProject.criteria.resources * 100)} mandays
            </p>
          </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {currentProject.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
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
          <ProjectRadarChart project={currentProject} />
          
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-gray-700">Revenue Impact</h4>
                <span className="text-sm font-medium text-gray-900">{currentProject.criteria.revenue}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${currentProject.criteria.revenue * 10}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-gray-700">Policy Impact</h4>
                <span className="text-sm font-medium text-gray-900">{currentProject.criteria.policyImpact}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${currentProject.criteria.policyImpact * 10}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-gray-700">Budget (Lower is Higher)</h4>
                <span className="text-sm font-medium text-gray-900">{currentProject.criteria.budget}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${currentProject.criteria.budget * 10}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-gray-700">Resources (Lower is More)</h4>
                <span className="text-sm font-medium text-gray-900">{currentProject.criteria.resources}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${currentProject.criteria.resources * 10}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-gray-700">Complexity (Lower is More Complex)</h4>
                <span className="text-sm font-medium text-gray-900">{currentProject.criteria.complexity}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${currentProject.criteria.complexity * 10}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
