'use client';

import { useProjectSearch } from '@/app/contexts/ProjectSearchContext';
import { PlusIcon } from '@heroicons/react/24/outline';

export function ProjectHeader() {
  const { handleCreateProject } = useProjectSearch();
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Project Information</h1>
      <button
        className="btn btn-primary flex items-center"
        onClick={handleCreateProject}
      >
        <PlusIcon className="w-5 h-5 mr-1" />
        New Project
      </button>
    </div>
  );
}
