import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';
import { useProjects } from '@/app/_contexts/ProjectContext';
import { useAuth } from '@/app/_contexts/AuthContext';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';
import { SkeletonChart } from '@/app/_components/ui/skeleton';
import { useMemo } from 'react';

export const ScoreQuadrantChart = () => {
  const { projects, getProjectScore, loading } = useProjects();
  const { user } = useAuth();
  
  // Define types for our chart data
  type ProjectDataPoint = {
    name: string;
    score: number;
    budget: number;
    department: string | undefined;
  };
  
  type DepartmentDataPoint = {
    name: string;
    score: number;
    budget: number;
    projectCount: number;
  };
  
  // Generate chart data based on user role
  const chartData = useMemo<ProjectDataPoint[] | DepartmentDataPoint[]>(() => {
    // Different data processing based on user role
    if (user?.role === 'projectManager') {
      // PM view: individual projects
      return projects.map(project => ({
        name: project.name,
        score: project.score !== null && project.score !== undefined ? project.score : getProjectScore(project),
        budget: project.budget || 0,
        department: project.department
      })) as ProjectDataPoint[];
    } else {
      // PMO view: aggregated by department
      const departmentData = new Map<string, {
        name: string;
        projects: any[];
        totalBudget: number;
        totalScore: number;
      }>();
      
      // Group projects by department
      projects.forEach(project => {
        const dept = project.department || 'Unassigned';
        if (!departmentData.has(dept)) {
          departmentData.set(dept, {
            name: dept,
            projects: [],
            totalBudget: 0,
            totalScore: 0
          });
        }
        
        const deptData = departmentData.get(dept)!;
        const score = project.score !== null && project.score !== undefined ? project.score : getProjectScore(project);
        deptData.projects.push(project);
        deptData.totalBudget += (project.budget || 0);
        deptData.totalScore += score;
      });
      
      // Calculate averages and format for chart
      return Array.from(departmentData.values()).map(dept => ({
        name: dept.name,
        score: dept.projects.length > 0 ? dept.totalScore / dept.projects.length : 0,
        budget: dept.totalBudget,
        projectCount: dept.projects.length
      })) as DepartmentDataPoint[];
    }
  }, [projects, getProjectScore, user?.role]);
  
  // Chart title based on user role
  const chartTitle = user?.role === 'projectManager' 
    ? 'Project Budget vs Score' 
    : 'Department Budget vs Score';
  
  // X-axis label based on user role
  const xAxisLabel = user?.role === 'projectManager' 
    ? 'Project Budget ($)' 
    : 'Department Budget ($)';
  
  // Generate unique departments/categories for coloring
  const categories = useMemo(() => {
    if (user?.role === 'projectManager') {
      // For PM view, get unique departments
      return [...new Set((chartData as ProjectDataPoint[]).map(item => item.department))];
    } else {
      // For PMO view, each department is already unique by name
      return (chartData as DepartmentDataPoint[]).map(item => item.name);
    }
  }, [chartData, user?.role]);
  
  // Assign colors to each category
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className="card h-[300px]">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{chartTitle}</h3>
      <LoadingWrapper
        isLoading={loading}
        skeleton={<SkeletonChart height="220px" />}
      >
        <div className="h-[85%]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="budget" 
                name="Budget" 
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -5 }}
                tickFormatter={(value) => {
                  if (value >= 1000000000) {
                    return `${(value / 1000000000).toFixed(1)}B`;
                  } else if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                  }
                  return value;
                }}
              />
              <YAxis 
                type="number" 
                dataKey="score" 
                name="Score" 
                domain={[0, 5]}
                label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis range={[60, 60]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: any, name: string) => {
                  if (name === 'budget') {
                    if (value >= 1000000000) {
                      return [`$${(value / 1000000000).toFixed(2)}B`, 'Budget'];
                    } else if (value >= 1000000) {
                      return [`$${(value / 1000000).toFixed(2)}M`, 'Budget'];
                    } else if (value >= 1000) {
                      return [`$${(value / 1000).toFixed(2)}K`, 'Budget'];
                    }
                    return [`$${value.toLocaleString()}`, 'Budget'];
                  }
                  if (name === 'score') return [value.toFixed(2), 'Score'];
                  return [value, name];
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-gray-200 shadow-sm rounded">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm">Score: {data.score.toFixed(2)}</p>
                        <p className="text-sm">Budget: ${data.budget.toLocaleString()}</p>
                        {user?.role !== 'projectManager' && (
                          <p className="text-sm">Projects: {data.projectCount}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              {/* Create scatter plots with different colors */}
              {user?.role === 'projectManager' ? (
                // For PM: Group by department
                categories.map((dept, index) => (
                  <Scatter 
                    key={dept}
                    name={dept as string} 
                    data={(chartData as ProjectDataPoint[]).filter(d => d.department === dept)} 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))
              ) : (
                // For PMO: Each department is its own point
                <Scatter 
                  name="Departments" 
                  data={chartData} 
                  fill="#8884d8"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Scatter>
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </LoadingWrapper>
    </div>
  );
};
