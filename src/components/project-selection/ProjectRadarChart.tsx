import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Project } from '@/src/data/projects';

interface ProjectRadarChartProps {
  project: Project;
}

export const ProjectRadarChart = ({ project }: ProjectRadarChartProps) => {
  const { revenue, policyImpact, budget, resources, complexity } = project.criteria;

  // Convert inverse scales to regular scales for visualization (10 - value)
  const adjustedBudget = 10 - budget;
  const adjustedResources = 10 - resources;
  const adjustedComplexity = 10 - complexity;

  const data = [
    { subject: 'Revenue', value: revenue, fullMark: 10 },
    { subject: 'Policy Impact', value: policyImpact, fullMark: 10 },
    { subject: 'Budget', value: adjustedBudget, fullMark: 10 },
    { subject: 'Resources', value: adjustedResources, fullMark: 10 },
    { subject: 'Complexity', value: adjustedComplexity, fullMark: 10 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} domain={[0, 10]} />
        <Radar name={project.name} dataKey="value" stroke="#0284c7" fill="#0284c7" fillOpacity={0.6} />
      </RadarChart>
    </ResponsiveContainer>
  );
};
