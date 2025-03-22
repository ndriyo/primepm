import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useProjects } from '@/app/contexts/ProjectContext';
import { LoadingWrapper } from '@/components/ui/LoadingWrapper';
import { SkeletonChart } from '@/components/ui/skeleton';

const STATUS_COLORS = {
  'planning': '#60a5fa', // blue-400
  'in-progress': '#f59e0b', // amber-500
  'completed': '#10b981', // emerald-500
  'on-hold': '#ef4444', // red-500
};

export const StatusChart = () => {
  const { projects, loading } = useProjects();
  
  // Calculate status counts from projects in context
  const getStatusCounts = () => {
    return projects.reduce((counts, project) => {
      counts[project.status] = (counts[project.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  };
  
  const statusCounts = getStatusCounts();
  
  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
    value: count,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280',
  }));

  return (
    <div className="card h-[300px]">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Project Status Distribution</h3>
      <LoadingWrapper
        isLoading={loading}
        skeleton={<SkeletonChart height="220px" />}
      >
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} Projects`, 'Count']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </LoadingWrapper>
    </div>
  );
};
