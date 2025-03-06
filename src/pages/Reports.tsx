import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { projects } from '../data/projects';

type ReportType = 'department' | 'status' | 'criteria' | 'timeline';

export const Reports = () => {
  const [reportType, setReportType] = useState<ReportType>('department');
  
  // Generate department data
  const departmentData = projects.reduce((acc, project) => {
    const dept = project.department;
    const found = acc.find((item) => item.name === dept);
    if (found) {
      found.count += 1;
    } else {
      acc.push({ name: dept, count: 1 });
    }
    return acc;
  }, [] as { name: string; count: number }[]);
  
  // Generate criteria average data
  const criteriaData = [
    { name: 'Revenue', value: projects.reduce((sum, p) => sum + p.criteria.revenue, 0) / projects.length },
    { name: 'Policy', value: projects.reduce((sum, p) => sum + p.criteria.policyImpact, 0) / projects.length },
    { name: 'Budget', value: 10 - projects.reduce((sum, p) => sum + p.criteria.budget, 0) / projects.length },
    { name: 'Resources', value: 10 - projects.reduce((sum, p) => sum + p.criteria.resources, 0) / projects.length },
    { name: 'Complexity', value: 10 - projects.reduce((sum, p) => sum + p.criteria.complexity, 0) / projects.length },
  ];
  
  // Status data - ensure one entry per status type with proper count
  const statusCounts = projects.reduce((counts, project) => {
    const status = project.status;
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
    value: count
  }));
  
  // Timeline data (projects by quarters)
  const timelineData = projects.reduce((acc, project) => {
    const startDate = new Date(project.startDate);
    const quarter = `Q${Math.floor((startDate.getMonth() / 3)) + 1} ${startDate.getFullYear()}`;
    
    const found = acc.find((item) => item.name === quarter);
    if (found) {
      found.count += 1;
    } else {
      // Create an entry for this quarter
      acc.push({ name: quarter, count: 1 });
    }
    return acc;
  }, [] as { name: string; count: number }[]).sort((a, b) => {
    // Sort by year and quarter
    const [qA, yearA] = a.name.split(' ');
    const [qB, yearB] = b.name.split(' ');
    return (parseInt(yearA) - parseInt(yearB)) || (qA.localeCompare(qB));
  });
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const renderReport = () => {
    switch (reportType) {
      case 'department':
        return (
          <div className="h-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Projects by Department</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                {/* Number of projects removed from legend as requested */}
                <Bar dataKey="count" fill="#0284c7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'status':
        return (
          <div className="h-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Projects by Status</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  innerRadius={60}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                {/* Fixed legend position to be inside the chart area */}
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'criteria':
        return (
          <div className="h-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Average Criteria Scores</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={criteriaData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                {/* Fixed legend position to be inside the chart area */}
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="value" name="Average Score (0-10)" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'timeline':
        return (
          <div className="h-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Projects by Quarter</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timelineData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                {/* Fixed legend position to be inside the chart area */}
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="count" name="Number of Projects Started" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      default:
        return <div>Select a report type</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex space-x-2">
          <button className="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export
          </button>
          <button className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            New Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          className={`card text-center py-4 transition-all ${
            reportType === 'department' ? 'bg-primary-50 border-primary-500 border-2' : ''
          }`}
          onClick={() => setReportType('department')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-primary-600 mb-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
          </svg>
          <span className="font-medium">By Department</span>
        </button>
        
        <button
          className={`card text-center py-4 transition-all ${
            reportType === 'status' ? 'bg-primary-50 border-primary-500 border-2' : ''
          }`}
          onClick={() => setReportType('status')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-primary-600 mb-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
          </svg>
          <span className="font-medium">By Status</span>
        </button>
        
        <button
          className={`card text-center py-4 transition-all ${
            reportType === 'criteria' ? 'bg-primary-50 border-primary-500 border-2' : ''
          }`}
          onClick={() => setReportType('criteria')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-primary-600 mb-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <span className="font-medium">By Criteria</span>
        </button>
        
        <button
          className={`card text-center py-4 transition-all ${
            reportType === 'timeline' ? 'bg-primary-50 border-primary-500 border-2' : ''
          }`}
          onClick={() => setReportType('timeline')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-primary-600 mb-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <span className="font-medium">By Timeline</span>
        </button>
      </div>

      <div className="card p-6">
        {renderReport()}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Summary</h3>
        <p className="text-gray-700 mb-4">
          {reportType === 'department' && 'This report shows the distribution of projects across different departments. Understanding which departments handle the most projects can help with resource allocation and budget planning.'}
          {reportType === 'status' && 'This report visualizes the current status of all projects. It helps identify the balance between planning, in-progress, completed, and on-hold projects.'}
          {reportType === 'criteria' && 'This report displays the average scores across all projects for each criterion. It provides insights into how projects are generally evaluated and which criteria tend to score higher or lower.'}
          {reportType === 'timeline' && 'This report shows project start dates by quarter, helping identify seasonal patterns and workload distribution over time.'}
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {reportType === 'department' && (
              <>
                <li>Information Technology department has the most projects ({departmentData.find(d => d.name === 'Information Technology')?.count || 0}).</li>
                <li>Strategic Development department may need additional resources for their high-impact projects.</li>
                <li>Smaller departments like Facilities manage fewer but critical infrastructure projects.</li>
              </>
            )}
            {reportType === 'status' && (
              <>
                <li>{statusData.find(d => d.name === 'Planning')?.value || 0} projects are in the planning phase.</li>
                <li>{statusData.find(d => d.name === 'In progress')?.value || 0} projects are currently active and in progress.</li>
                <li>Only {statusData.find(d => d.name === 'Completed')?.value || 0} projects have been completed, suggesting a need to improve completion rates.</li>
              </>
            )}
            {reportType === 'criteria' && (
              <>
                <li>Revenue impact scores average {criteriaData[0].value.toFixed(1)} out of 10.</li>
                <li>Policy impact is generally rated highly, averaging {criteriaData[1].value.toFixed(1)} out of 10.</li>
                <li>Complexity scores suggest most projects have moderate to high complexity.</li>
              </>
            )}
            {reportType === 'timeline' && (
              <>
                <li>Project initiations peak in Q2 of each year.</li>
                <li>There's a notable increase in project starts for {timelineData[timelineData.length - 1]?.name}.</li>
                <li>Resource planning should account for these quarterly patterns.</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
