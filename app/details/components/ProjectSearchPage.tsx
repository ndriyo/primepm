'use client';

import { ProjectHeader } from './ProjectHeader';
import { SearchBar } from './SearchBar';
import { ActiveFilters } from './ActiveFilters';
import { FilterPanel } from './FilterPanel';
import { ProjectsTable } from './ProjectsTable';

export function ProjectSearchPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <ProjectHeader />
        
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <SearchBar />
          <ActiveFilters />
          <FilterPanel />
        </div>
      </div>
      
      {/* Projects Table Section */}
      <ProjectsTable />
    </div>
  );
}
