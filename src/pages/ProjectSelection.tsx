import { useState } from 'react';
import { Project } from '../data/projects';
import { useProjects } from '../contexts/ProjectContext';
import { ProjectCard } from '../components/project-selection/ProjectCard';
import { ProjectMatrix } from '../components/project-selection/ProjectMatrix';
import { ProjectSelectionTable } from '../components/project-selection/ProjectSelectionTable';

export const ProjectSelection = () => {
  const { projects, setSelectedProject } = useProjects();
  const [selectedViewProjects, setSelectedViewProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'matrix' | 'cards' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['planning']);

  const filteredProjects = projects.filter(project => {
    // Apply search filter
    const matchesSearch = 
      searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Only show projects with planning status
    const matchesStatus = project.status === 'planning';
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    if (!selectedViewProjects.some(p => p.id === project.id)) {
      setSelectedViewProjects([...selectedViewProjects, project]);
    }
  };

  const handleRemoveProject = (projectId: string) => {
    setSelectedViewProjects(selectedViewProjects.filter(p => p.id !== projectId));
  };

  const toggleStatusFilter = (status: string) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Filters sidebar */}
        <div className="md:col-span-3 space-y-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
              <div className="space-y-2">
                {['planning', 'in-progress', 'completed', 'on-hold'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 rounded"
                      checked={statusFilter.includes(status)}
                      onChange={() => toggleStatusFilter(status)}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          {selectedViewProjects.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Projects</h3>
              <div className="space-y-2">
                {selectedViewProjects.map(project => (
                  <div key={project.id} className="flex justify-between items-center">
                    <span className="text-sm">{project.name}</span>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveProject(project.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Main content */}
        <div className="md:col-span-9">
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
        </div>
      </div>
    </div>
  );
};
