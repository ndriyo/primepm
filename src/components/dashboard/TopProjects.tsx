import { useProjects } from '../../contexts/ProjectContext';
import { getTopProjects } from '../../data/projects';

export const TopProjects = () => {
  const { weightSettings } = useProjects();
  const topProjects = getTopProjects(5, weightSettings);

  return (
    <div className="card overflow-hidden">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Top Projects</h3>
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
              <tr key={project.id} className="hover:bg-gray-50">
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
    </div>
  );
};
