import { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Project } from '../../data/projects';
import { useProjects } from '../../contexts/ProjectContext';

interface ProjectMatrixProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

type CriterionKey = 'revenue' | 'policyImpact' | 'budget' | 'resources' | 'complexity';

interface CriterionOption {
  key: CriterionKey;
  label: string;
  isInverse: boolean;
}

const criteriaOptions: CriterionOption[] = [
  { key: 'revenue', label: 'Revenue Impact', isInverse: false },
  { key: 'policyImpact', label: 'Policy Impact', isInverse: false },
  { key: 'budget', label: 'Budget', isInverse: true },
  { key: 'resources', label: 'Resources', isInverse: true },
  { key: 'complexity', label: 'Complexity', isInverse: true },
];

export const ProjectMatrix = ({ projects, onSelectProject }: ProjectMatrixProps) => {
  const { getProjectScore } = useProjects();
  const [xAxis, setXAxis] = useState<CriterionKey>('revenue');
  const [yAxis, setYAxis] = useState<CriterionKey>('policyImpact');
  const [zAxis, setZAxis] = useState<CriterionKey>('complexity');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project.id);
    onSelectProject(project);
  };

  // Create data for scatter plot
  const data = projects.map(project => {
    const xValue = criteriaOptions.find(option => option.key === xAxis)?.isInverse
      ? 10 - project.criteria[xAxis]
      : project.criteria[xAxis];
    
    const yValue = criteriaOptions.find(option => option.key === yAxis)?.isInverse
      ? 10 - project.criteria[yAxis]
      : project.criteria[yAxis];
    
    const zValue = criteriaOptions.find(option => option.key === zAxis)?.isInverse
      ? 10 - project.criteria[zAxis]
      : project.criteria[zAxis];
    
    return {
      x: xValue,
      y: yValue,
      z: zValue,
      score: getProjectScore(project),
      name: project.name,
      project,
    };
  });

  return (
    <div className="card p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Project Comparison Matrix</h3>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">X-Axis</label>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value as CriterionKey)}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {criteriaOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Y-Axis</label>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value as CriterionKey)}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {criteriaOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bubble Size</label>
          <select
            value={zAxis}
            onChange={(e) => setZAxis(e.target.value as CriterionKey)}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {criteriaOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid />
            <XAxis 
              type="number" 
              dataKey="x" 
              name={criteriaOptions.find(option => option.key === xAxis)?.label}
              domain={[0, 10]}
              label={{ value: criteriaOptions.find(option => option.key === xAxis)?.label, position: 'bottom' }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name={criteriaOptions.find(option => option.key === yAxis)?.label}
              domain={[0, 10]}
              label={{ value: criteriaOptions.find(option => option.key === yAxis)?.label, angle: -90, position: 'left' }}
            />
            <ZAxis 
              type="number" 
              dataKey="z" 
              range={[50, 400]} 
              name={criteriaOptions.find(option => option.key === zAxis)?.label}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip bg-white p-3 border rounded shadow-md">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm">
                        {criteriaOptions.find(option => option.key === xAxis)?.label}: {data.x}
                      </p>
                      <p className="text-sm">
                        {criteriaOptions.find(option => option.key === yAxis)?.label}: {data.y}
                      </p>
                      <p className="text-sm">
                        {criteriaOptions.find(option => option.key === zAxis)?.label}: {data.z}
                      </p>
                      <p className="text-sm font-medium text-primary-600">Score: {data.score.toFixed(1)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Projects" data={data} onClick={(data) => handleProjectClick(data.project)}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={selectedProject === entry.project.id ? '#ef4444' : '#0284c7'}
                  fillOpacity={0.7}
                  stroke={selectedProject === entry.project.id ? '#b91c1c' : '#075985'}
                  strokeWidth={selectedProject === entry.project.id ? 2 : 1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Click on any bubble to view detailed project information. Bubble size represents {criteriaOptions.find(option => option.key === zAxis)?.label}.
      </div>
    </div>
  );
};
