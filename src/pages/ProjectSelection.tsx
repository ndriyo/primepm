import { useState } from 'react';
import { Project } from '../data/projects';
import { useProjects } from '../contexts/ProjectContext';
import { ProjectCard } from '../components/project-selection/ProjectCard';
import { ProjectMatrix } from '../components/project-selection/ProjectMatrix';
import { ProjectSelectionTable } from '../components/project-selection/ProjectSelectionTable';
import { CriteriaManagement } from '../components/project-selection/CriteriaManagement';

export const ProjectSelection = () => {
  const { projects, setSelectedProject } = useProjects();
  const [viewMode, setViewMode] = useState<'matrix' | 'cards' | 'table' | 'criteria'>('table');
  
  // Filter projects to only show those in planning status
  const filteredProjects = projects.filter(project => project.status === 'planning');

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
  };

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
        {/* Main content */}
        <div className="w-full">
          {viewMode === 'matrix' && (
            <ProjectMatrix projects={filteredProjects} onSelectProject={handleSelectProject} />
          )}
          
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleSelectProject(project)}
                />
              ))}
            </div>
          )}
          
          {viewMode === 'table' && (
            <ProjectSelectionTable projects={filteredProjects} />
          )}
          
          {viewMode === 'criteria' && (
            <CriteriaManagement />
          )}
        </div>
      </div>
    </div>
  );
};
