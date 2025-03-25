'use client';

import { useProjectSearch } from '@/app/_contexts/ProjectSearchContext';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function SearchBar() {
  const { 
    filters, 
    handleSearchChange, 
    isFilterPanelOpen, 
    setIsFilterPanelOpen, 
    activeFilters, 
    handleClearFilters 
  } = useProjectSearch();
  
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      {/* Search Input */}
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search projects by name, description, or tags..."
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>
      
      {/* Filter Toggle Button */}
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
        {isFilterPanelOpen ? 'Hide Filters' : 'Show Filters'}
      </button>
      
      {/* Clear Filters Button - Only show if any filters are active */}
      {activeFilters.length > 0 && (
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          onClick={handleClearFilters}
        >
          <XMarkIcon className="h-5 w-5 mr-2" />
          Clear All Filters
        </button>
      )}
    </div>
  );
}
