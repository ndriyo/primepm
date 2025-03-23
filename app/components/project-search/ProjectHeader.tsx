'use client';

import { useProjectSearch } from '@/app/contexts/ProjectSearchContext';
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export function ProjectHeader() {
  const { handleCreateProject, handleImportProjects } = useProjectSearch();
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Project Information</h1>
      <div className="flex gap-2">
        <button
          className="btn btn-secondary flex items-center"
          onClick={handleImportProjects}
        >
          <ArrowDownTrayIcon className="w-5 h-5 mr-1" />
          Import from Excel
        </button>
        <button
          className="btn btn-primary flex items-center"
          onClick={handleCreateProject}
        >
          <PlusIcon className="w-5 h-5 mr-1" />
          New Project
        </button>
      </div>
    </div>
  );
}
