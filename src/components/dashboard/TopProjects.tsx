import { useProjects, Project } from '@/app/contexts/ProjectContext';
import { useRouter } from 'next/navigation';
import { LoadingWrapper } from '@/components/ui/LoadingWrapper';
import { SkeletonTable } from '@/components/ui/skeleton';

export const TopProjects = () => {
  const { projects, weightSettings, setSelectedProject, getProjectScore, loading } = useProjects();
  const router = useRouter();
  
  // Calculate scores, sort, and take top 5 projects
  const topProjects = projects.length > 0 
    ? [...projects]
      .map(project => ({
        ...project,
        score: getProjectScore(project)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
    : [];
  
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    router.push(`/details/${project.id}`);
  };

  return (
    <div className="card overflow-hidden">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Top Projects</h3>
      <LoadingWrapper
        isLoading={loading}
        skeleton={<SkeletonTable rows={5} columns={4} className="mt-4" showHeader={true} />}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
              {topProjects.map((project) => (
                <tr 
                  key={project.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleProjectClick(project)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary-600">{project.score}</div>
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
        </div>
      </LoadingWrapper>
    </div>
  );
};
