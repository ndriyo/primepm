import { useState } from 'react';
import { Project, calculateOverallScore } from '../../data/projects';
import { useProjects } from '../../contexts/ProjectContext';
import { ProjectRadarChart } from './ProjectRadarChart';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const { weightSettings } = useProjects();
  const [showDetails, setShowDetails] = useState(false);
  
  const score = calculateOverallScore(project, weightSettings);
  const scoreColor = 
    score >= 8 ? 'text-emerald-600' :
    score >= 6 ? 'text-blue-600' :
    score >= 4 ? 'text-amber-600' : 'text-red-600';

  return (
    <div 
      className="card hover:shadow-xl cursor-pointer transition-all duration-300"
      onClick={() => {
        setShowDetails(!showDetails);
        if (onClick) onClick();
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{project.department}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className={`text-2xl font-bold ${scoreColor}`}>{score.toFixed(1)}</div>
          <span
            className={`px-2 text-xs font-semibold rounded-full mt-1
              ${project.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
              ${project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${project.status === 'planning' ? 'bg-blue-100 text-blue-800' : ''}
              ${project.status === 'on-hold' ? 'bg-red-100 text-red-800' : ''}
            `}
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{project.description}</p>
      
      {showDetails && (
        <div className="mt-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Criteria Breakdown</h4>
            <ProjectRadarChart project={project} />
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Start Date</p>
              <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500">End Date</p>
              <p className="font-medium">{new Date(project.endDate).toLocaleDateString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">Team</p>
              <p className="font-medium">{project.team.slice(0, 3).join(', ')}{project.team.length > 3 ? ` +${project.team.length - 3} more` : ''}</p>
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-1">
            {project.tags.map((tag) => (
              <span key={tag} className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs font-medium text-gray-800">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
