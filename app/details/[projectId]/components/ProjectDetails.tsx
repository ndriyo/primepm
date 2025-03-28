'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/app/_contexts/ProjectContext';
import { useCriteria } from '@/app/_contexts/CriteriaContext';
import { ProjectRadarChart } from '@/src/components/project-selection/ProjectRadarChart';
import { Project } from '@/app/_contexts/ProjectContext';
import { Criterion } from '@/app/_hooks/useCriteriaQuery';

interface ProjectDetailsProps {
  projectId?: string;
}

export const ProjectDetails = ({ projectId }: ProjectDetailsProps) => {
  const { selectedProject, projects, setSelectedProject } = useProjects();
  const { criteria } = useCriteria(); // Get criteria from context
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
  
  if (!currentProject) {
    return <div>Loading...</div>;
  }
  
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
    const currentIndex = projects.findIndex(p => p.id === currentProject.id);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Project Details</h1>
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
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                <p className="text-base font-medium text-gray-900">
                  {Math.ceil(
                    (new Date(currentProject.endDate).getTime() - new Date(currentProject.startDate).getTime()) /
                      (1000 * 60 * 60 * 24 * 30)
                  )}{' '}
                  months
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
          
          {/* Overall Score */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700">Overall Score</h4>
              <span className={`text-lg font-bold ${
                criteria.length > 0 
                  ? (currentProject.score || 0) >= 7 ? 'text-green-600' : 
                    (currentProject.score || 0) >= 4 ? 'text-yellow-600' : 'text-red-600'
                  : (currentProject.score || 0) >= 3.5 ? 'text-green-600' : 
                    (currentProject.score || 0) > 2 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {currentProject.score?.toFixed(2) || 'N/A'}
              </span>
            </div>
            {currentProject.score && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ 
                    width: `${(currentProject.score / (criteria.length > 0 ? 10 : 5)) * 100}%` 
                  }}
                ></div>
              </div>
            )}
          </div>
          
          <ProjectRadarChart 
            project={currentProject} 
            criteria={criteria as unknown as Criterion[]} 
          />
          
          <div className="mt-6 space-y-4">
            {/* Dynamically generate criteria bars based on active criteria */}
            {criteria.length > 0 ? (
              Object.entries(currentProject.criteria || {}).map(([key, value]) => {
                // Find the criterion in the context
                const criterionFromContext = criteria.find(c => c.key === key);
                
                if (!criterionFromContext) return null;
                
                // Get criterion details
                const label = criterionFromContext.label || key;
                const isInverse = criterionFromContext.isInverse || false;
                const min = criterionFromContext.scale?.min !== undefined ? Number(criterionFromContext.scale.min) : 1;
                const max = criterionFromContext.scale?.max !== undefined ? Number(criterionFromContext.scale.max) : 10;
                
                // Determine color based on criterion properties
                const getColorClass = (isInverse: boolean) => {
                  if (isInverse) {
                    return 'bg-yellow-500'; // Lower is better
                  } else {
                    return 'bg-green-500'; // Higher is better
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
                        {label}
                        {isInverse && <span className="ml-1 text-xs text-gray-500">(Lower is better)</span>}
                      </h4>
                      <span className="text-sm font-medium text-gray-900">{value}/{max}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${getColorClass(isInverse)} h-2 rounded-full`}
                        style={{ width: `${getWidthPercentage(value, min, max)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback to hardcoded criteria if no active criteria available
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Project timeline - simplified placeholder */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline</h3>
        <div className="relative">
          <div className="absolute top-0 left-6 h-full w-0.5 bg-gray-200"></div>
          
          <div className="mb-8 flex items-center">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-medium text-gray-900">Project Start</h4>
              <p className="text-sm text-gray-600">{new Date(currentProject.startDate).toLocaleDateString()}</p>
              <p className="mt-1 text-sm text-gray-600">Kickoff meeting and initial planning</p>
            </div>
          </div>
          
          <div className="mb-8 flex items-center">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-medium text-gray-900">Milestone: Requirements Completed</h4>
              <p className="text-sm text-gray-600">{new Date(new Date(currentProject.startDate).setMonth(new Date(currentProject.startDate).getMonth() + 1)).toLocaleDateString()}</p>
              <p className="mt-1 text-sm text-gray-600">All project requirements finalized and approved</p>
            </div>
          </div>
          
          <div className="mb-8 flex items-center">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-medium text-gray-900">Milestone: Development Complete</h4>
              <p className="text-sm text-gray-600">{new Date(new Date(currentProject.endDate).setMonth(new Date(currentProject.endDate).getMonth() - 1)).toLocaleDateString()}</p>
              <p className="mt-1 text-sm text-gray-600">Core development phase completed</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-medium text-gray-900">Project Completion</h4>
              <p className="text-sm text-gray-600">{new Date(currentProject.endDate).toLocaleDateString()}</p>
              <p className="mt-1 text-sm text-gray-600">Project closure and handover</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
