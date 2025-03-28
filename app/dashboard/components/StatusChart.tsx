'use client';

import React, { useEffect, useState } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useProjects } from '@/app/_contexts/ProjectContext';
import { useAuth } from '@/app/_contexts/AuthContext';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';
import { SkeletonChart } from '@/app/_components/ui/skeleton';

// Colors for the chart
const CHART_COLORS = [
  '#60a5fa', // blue-400
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#ef4444', // red-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
];

export const StatusChart: React.FC = () => {
  const { projects, loading: projectsLoading } = useProjects();
  const { user } = useAuth();
  const [chartData, setChartData] = useState<Array<{name: string, value: number, fill: string}>>([]);
  const [chartTitle, setChartTitle] = useState('Budget Distribution');
  
  // Add client-side only state to control rendering
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Filter projects based on user role
  useEffect(() => {
    if (!projects || projects.length === 0) return;
    
    const filteredProjects = user?.role === 'projectManager' && user?.departmentId
      ? projects.filter(p => p.departmentId === user.departmentId)
      : projects;
    
    // Different chart data based on user role
    if (user?.role === 'projectManager') {
      // For PM: Distribution of budget data for each project
      const projectBudgetData = filteredProjects
        .filter(project => project.budget && project.budget > 0)
        .map((project, index) => ({
          name: project.name,
          value: project.budget || 0,
          fill: CHART_COLORS[index % CHART_COLORS.length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Limit to top 10 projects by budget
      
      setChartData(projectBudgetData);
      setChartTitle('Project Budget Distribution');
    } else {
      // For PMO: Distribution of total budget per department
      const departmentBudgets: Record<string, number> = {};
      
      // Calculate total budget per department
      filteredProjects.forEach(project => {
        if (project.budget && project.department) {
          departmentBudgets[project.department] = (departmentBudgets[project.department] || 0) + project.budget;
        }
      });
      
      // Convert to chart data format
      const departmentBudgetData = Object.entries(departmentBudgets)
        .map(([department, budget], index) => ({
          name: department,
          value: budget,
          fill: CHART_COLORS[index % CHART_COLORS.length]
        }))
        .sort((a, b) => b.value - a.value);
      
      setChartData(departmentBudgetData);
      setChartTitle('Department Budget Distribution');
    }
  }, [projects, user?.role, user?.departmentId]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Budget: ${data.value.toLocaleString()}</p>
          <p className="text-sm">
            {percentage}% of total budget
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card h-[300px]">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{chartTitle}</h3>
      {/* Use consistent initial rendering */}
      {!isMounted || projectsLoading ? (
        <SkeletonChart height="220px" />
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <Treemap
            data={chartData}
            dataKey="value"
            nameKey="name"
            aspectRatio={4/3}
            stroke="#fff"
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      )}
    </div>
  );
};
