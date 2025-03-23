'use client';

import { useProjectSearch } from '@/app/contexts/ProjectSearchContext';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function ActiveFilters() {
  const { activeFilters, removeFilter } = useProjectSearch();
  
  if (activeFilters.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <div className="text-sm text-gray-500 flex items-center mr-2">
        <FunnelIcon className="h-4 w-4 mr-1" />
        Active Filters:
      </div>
      {activeFilters.map((filter) => (
        <span 
          key={filter.key}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {filter.label}
          <button
            type="button"
            className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
            onClick={() => removeFilter(filter.key)}
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
