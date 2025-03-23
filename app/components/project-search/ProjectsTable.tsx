'use client';

import { useProjectSearch } from '@/app/contexts/ProjectSearchContext';
import { LoadingWrapper } from '@/components/ui/LoadingWrapper';
import { SkeletonTable } from '@/components/ui/skeleton';

export function ProjectsTable() {
  const { 
    isLoading, 
    projects,
    resultsCount,
    page,
    setPage,
    pageSize,
    handleSelectProject, 
    formatCurrency, 
    formatDate,
    formatNumber
  } = useProjectSearch();

  return (
    <LoadingWrapper
      isLoading={isLoading}
      skeleton={<SkeletonTable rows={10} columns={6} showHeader={true} />}
    >
      {projects.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resources</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr 
                  key={project.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectProject(project.id)}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.departmentName || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(project.budget)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(project.resources)} mandays
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(project.startDate)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${project.status === 'active' ? 'bg-green-100 text-green-800' : 
                       project.status === 'planning' ? 'bg-blue-100 text-blue-800' : 
                       project.status === 'completed' ? 'bg-gray-100 text-gray-800' : 
                       'bg-red-100 text-red-800'}`}>
                      {project.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <p className="text-lg text-gray-500">No projects found matching your filters.</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your search criteria or clearing filters.</p>
        </div>
      )}
      
      {projects.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
          
          {/* Pagination with page numbers */}
          <div className="flex space-x-1">
            {/* Calculate total pages based on results count and page size */}
            {Array.from({ length: Math.ceil(resultsCount / pageSize) || 1 }, (_, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded-md ${
                  page === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </LoadingWrapper>
  );
}
