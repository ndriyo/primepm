import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Project } from '@/src/data/projects';
import { useProjects } from '@/app/contexts/ProjectContext';
import { useCriteria } from '@/app/contexts/CriteriaContext';

interface ProjectMatrixProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

export const ProjectMatrix = ({ projects, onSelectProject }: ProjectMatrixProps) => {
  const { getProjectScore } = useProjects();
  const { criteria } = useCriteria();
  
  // State for axis selections
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [zAxis, setZAxis] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Initialize with default criteria if available
  useEffect(() => {
    if (criteria.length > 0) {
      if (!xAxis && criteria.length > 0) setXAxis(criteria[0].key);
      if (!yAxis && criteria.length > 1) setYAxis(criteria[1].key);
      if (!zAxis && criteria.length > 2) setZAxis(criteria[2].key);
    }
  }, [criteria, xAxis, yAxis, zAxis]);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project.id);
    onSelectProject(project);
  };

  // Create data for scatter plot
  const data = projects.map(project => {
    // Find the criteria configuration for each axis
    const xCriterion = criteria.find(criterion => criterion.key === xAxis);
    const yCriterion = criteria.find(criterion => criterion.key === yAxis);
    const zCriterion = criteria.find(criterion => criterion.key === zAxis);
    
    // Handle the case where criteria doesn't exist in the project
    let xValue = project.criteria[xAxis] || 5;
    let yValue = project.criteria[yAxis] || 5;
    let zValue = project.criteria[zAxis] || 5;
    
    // Apply inverse transformation if needed
    if (xCriterion?.isInverse) xValue = 11 - xValue;
    if (yCriterion?.isInverse) yValue = 11 - yValue;
    if (zCriterion?.isInverse) zValue = 11 - zValue;
    
    return {
      x: xValue,
      y: yValue,
      z: zValue,
      score: getProjectScore(project),
      name: project.name,
      project,
    };
  });

  if (criteria.length === 0) {
    return (
      <div className="card p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Comparison Matrix</h3>
        <p>No criteria defined. Please add criteria to view the matrix.</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Project Comparison Matrix</h3>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">X-Axis</label>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {criteria.map((criterion) => (
              <option key={criterion.id} value={criterion.key}>
                {criterion.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Y-Axis</label>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {criteria.map((criterion) => (
              <option key={criterion.id} value={criterion.key}>
                {criterion.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bubble Size</label>
          <select
            value={zAxis}
            onChange={(e) => setZAxis(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {criteria.map((criterion) => (
              <option key={criterion.id} value={criterion.key}>
                {criterion.label}
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
              name={criteria.find(criterion => criterion.key === xAxis)?.label || ''}
              domain={[0, 10]}
              label={{ 
                value: criteria.find(criterion => criterion.key === xAxis)?.label || '', 
                position: 'bottom' 
              }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name={criteria.find(criterion => criterion.key === yAxis)?.label || ''}
              domain={[0, 10]}
              label={{ 
                value: criteria.find(criterion => criterion.key === yAxis)?.label || '', 
                angle: -90, 
                position: 'left' 
              }}
            />
            <ZAxis 
              type="number" 
              dataKey="z" 
              range={[50, 400]} 
              name={criteria.find(criterion => criterion.key === zAxis)?.label || ''}
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
                        {criteria.find(criterion => criterion.key === xAxis)?.label || ''}: {data.x}
                      </p>
                      <p className="text-sm">
                        {criteria.find(criterion => criterion.key === yAxis)?.label || ''}: {data.y}
                      </p>
                      <p className="text-sm">
                        {criteria.find(criterion => criterion.key === zAxis)?.label || ''}: {data.z}
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
        Click on any bubble to view detailed project information. 
        Bubble size represents {criteria.find(criterion => criterion.key === zAxis)?.label || ''}.
      </div>
    </div>
  );
};
