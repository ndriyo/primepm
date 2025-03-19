import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { useProjects } from '@/app/contexts/ProjectContext';

export const RiskQuadrantChart = () => {
  const { projects } = useProjects();
  
  // Generate risk data based on project criteria
  // Using revenue impact as a proxy for impact and complexity as a proxy for probability
  const riskData = projects.map(project => {
    const impact = project.criteria.revenue;
    const probability = project.criteria.complexity;
    
    // Determine risk type based on quadrant
    let riskType = "";
    if (impact >= 5 && probability >= 5) {
      riskType = "Critical Risk";
    } else if (impact >= 5 && probability < 5) {
      riskType = "High Impact Risk";
    } else if (impact < 5 && probability >= 5) {
      riskType = "High Probability Risk";
    } else {
      riskType = "Low Risk";
    }
    
    return {
      name: project.name,
      impact: impact, // X-axis: Impact (using revenue as proxy)
      probability: probability, // Y-axis: Probability (using complexity as proxy)
      department: project.department, // Used for coloring
      riskType: riskType // Added risk type for tooltip display
    };
  });
  
  // Generate unique departments for coloring
  const departments = [...new Set(riskData.map(item => item.department))];
  
  // Assign colors to each department
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className="card h-[300px]">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Risk Assessment</h3>
      <div className="h-[85%]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="impact" 
              name="Impact" 
              domain={[0, 10]}
              label={{ value: 'Impact', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number" 
              dataKey="probability" 
              name="Probability" 
              domain={[0, 10]}
              label={{ value: 'Probability', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border border-gray-200 shadow-sm rounded">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm">{data.riskType}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Legend removed as requested */}
            
            {/* Create a scatter plot for each department with different colors */}
            {departments.map((dept, index) => (
              <Scatter 
                key={dept}
                name={dept} 
                data={riskData.filter(d => d.department === dept)} 
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
