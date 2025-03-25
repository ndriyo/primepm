import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Project } from '@/app/_contexts/ProjectContext';
import { useEffect, useState, useMemo } from 'react';
import { Criterion } from '@/app/_hooks/useCriteriaQuery';

interface ProjectRadarChartProps {
  project: Project;
  criteria?: Criterion[]; // Make criteria a prop with optional fallback to empty array
}

// Helper type for radar chart data
interface RadarChartItem {
  subject: string;
  value: number;
  fullMark: number;
  originalValue: number;
  min: number;
  max: number;
}

export const ProjectRadarChart = ({ project, criteria = [] }: ProjectRadarChartProps) => {
  const [chartData, setChartData] = useState<RadarChartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  
  // Calculate the global max value for the chart scale
  const chartMaxValue = useMemo(() => {
    if (!chartData.length) return 10;
    return Math.max(...chartData.map(item => item.max));
  }, [chartData]);
  
  useEffect(() => {
    
    setIsLoading(true);
    
    // Validate if we have criteria data
    if (!project.criteria || typeof project.criteria !== 'object') {
      console.error("ProjectRadarChart - Invalid criteria data:", project.criteria);
      setHasData(false);
      setIsLoading(false);
      return;
    }
    
    // Check if we have any criteria entries
    const criteriaEntries = Object.entries(project.criteria);
    if (criteriaEntries.length === 0) {
      console.log("ProjectRadarChart - No criteria data found for this project");
      setHasData(false);
      setIsLoading(false);
      return;
    }
    
    try {
      // Map criteria keys to their display names and determine which ones are inverse
      const criteriaMap = new Map(
        criteria.map(criterion => [criterion.key, {
          label: criterion.label || criterion.key,
          isInverse: criterion.isInverse || false,
          min: criterion.scale?.min !== undefined ? Number(criterion.scale.min) : 1,
          max: criterion.scale?.max !== undefined ? Number(criterion.scale.max) : 5
        }])
      );
      
      // Build chart data dynamically from available criteria
      const data: RadarChartItem[] = criteriaEntries.map(([key, value]) => {
        // Ensure value is a number
        const numValue = typeof value === 'number' ? value : 
                        typeof value === 'string' ? parseFloat(value) : 0; // Default to 0, not 5
        
        // Get criterion details from context or use defaults
        const criterionInfo = criteriaMap.get(key) || { 
          label: key,
          isInverse: false,
          min: 1,
          max: 10
        };
        
        const { min, max } = criterionInfo;
        
        // console.log(`ProjectRadarChart - Processing criterion: ${key}`, {
        //   rawValue: numValue,
        //   isInverse: criterionInfo.isInverse,
        //   label: criterionInfo.label,
        //   scale: { min, max }
        // });
        
        // Normalize value to 0-1 range based on min-max scale
        const normalizedValue = (numValue - min) / (max - min);
        
        // Adjust if inverse (lower is better)
        const adjustedNormalizedValue = criterionInfo.isInverse ? 1 - normalizedValue : normalizedValue;
        
        // Convert back to chart scale (0 to max)
        const adjustedValue = adjustedNormalizedValue * max;
        
        return {
          subject: criterionInfo.label,
          value: adjustedValue,
          fullMark: max,
          originalValue: numValue,
          min: min,
          max: max
        };
      });
      
      console.log("ProjectRadarChart - Final chart data:", data);
      
      setChartData(data);
      setHasData(data.length > 0);
    } catch (error) {
      console.error("Error processing radar chart data:", error);
      setHasData(false);
    } finally {
      setIsLoading(false);
    }
  }, [project, criteria]);

  if (isLoading) {
    return (
      <div className="h-[300px] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading chart data...</p>
        </div>
      </div>
    );
  }
  
  if (!hasData) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No criteria data available for this project</p>
          <p className="text-sm text-gray-400 mt-1">Please add criteria scores in database to enable analysis</p>
        </div>
      </div>
    );
  }

  // Custom tooltip for showing original values with correct ranges
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 shadow rounded border border-gray-200">
          <p className="font-medium text-sm">{data.subject}</p>
          <p className="text-sm text-gray-600">
            Score: {data.originalValue} / {data.max}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} domain={[0, chartMaxValue]} />
        <Radar 
          name={project.name} 
          dataKey="value" 
          stroke="#0284c7" 
          fill="#0284c7" 
          fillOpacity={0.6} 
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
};
