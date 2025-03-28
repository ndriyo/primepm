import { useProjects, Project } from '@/app/_contexts/ProjectContext';
import { useAuth } from '@/app/_contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';
import { SkeletonTable } from '@/app/_components/ui/skeleton';
import { useState } from 'react';

export const TopProjects = () => {
  const { projects, weightSettings, setSelectedProject, getProjectScore, loading } = useProjects();
  const { user } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const projectsPerPage = 10;
  
  // Filter projects based on user role
  const filteredProjects = user?.role === 'projectManager' && user?.departmentId
    ? projects.filter(p => p.departmentId === user.departmentId)
    : projects;
  
  // Sort all projects by score to get global ranking
  const allProjectsSorted = projects.length > 0 
    ? [...projects]
      .sort((a, b) => {
        // Use the database score if available, otherwise calculate it
        const scoreA = a.score !== null && a.score !== undefined ? a.score : getProjectScore(a);
        const scoreB = b.score !== null && b.score !== undefined ? b.score : getProjectScore(b);
        return scoreB - scoreA;
      })
    : [];
    
  // Create a map of project ID to global rank
  const projectRankMap = new Map<string, number>();
  allProjectsSorted.forEach((project, index) => {
    projectRankMap.set(project.id, index + 1);
  });
  
  // Filter projects based on user role
  const topProjects = filteredProjects.length > 0 
    ? [...filteredProjects]
      .sort((a, b) => {
        // Use the database score if available, otherwise calculate it
        const scoreA = a.score !== null && a.score !== undefined ? a.score : getProjectScore(a);
        const scoreB = b.score !== null && b.score !== undefined ? b.score : getProjectScore(b);
        return scoreB - scoreA;
      })
    : [];
    
  // Paginate projects
  const startIndex = (page - 1) * projectsPerPage;
  const paginatedProjects = topProjects.slice(startIndex, startIndex + projectsPerPage);
  const totalPages = Math.ceil(topProjects.length / projectsPerPage);
  
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    router.push(`/details/${project.id}`);
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="card overflow-hidden">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Projects Ranked by Score</h3>
      <LoadingWrapper
        isLoading={loading}
        skeleton={<SkeletonTable rows={10} columns={4} className="mt-4" showHeader={true} />}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProjects.map((project, index) => (
                <tr 
                  key={project.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleProjectClick(project)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{projectRankMap.get(project.id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary-600">
                      {project.score !== null && project.score !== undefined 
                        ? project.score.toFixed(2) 
                        : getProjectScore(project).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${project.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      ${project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${project.status === 'planning' ? 'bg-blue-100 text-blue-800' : ''}
                      ${project.status === 'on-hold' ? 'bg-red-100 text-red-800' : ''}
                    `}
                    >
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.department}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + projectsPerPage, topProjects.length)}
                    </span>{' '}
                    of <span className="font-medium">{topProjects.length}</span> projects
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        page === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pageNum
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        page === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </LoadingWrapper>
    </div>
  );
};
