export interface Project {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  status: 'initiation' | 'planning' | 'in-progress' | 'completed' | 'on-hold';
  criteria: Record<string, number>; // Dynamic criteria
  startDate: string;
  endDate: string;
  department: string;
  resources: number;
  tags: string[];
  budget?: number; // Project budget in currency units
}

export const projects: Project[] = [
  {
    id: 'p1',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Digital Transformation Initiative',
    description: 'Enterprise-wide digital transformation to modernize legacy systems and implement cloud solutions.',
    status: 'in-progress',
    criteria: {
      revenue: 9,
      policyImpact: 8,
      budget: 3, // High budget (inverse scale)
      resources: 2, // High resources needed (inverse scale)
      complexity: 2, // High complexity (inverse scale)
    },
    startDate: '2025-01-15',
    endDate: '2025-12-31',
    department: 'Information Technology',
    resources: 100,
    tags: ['digital', 'cloud', 'transformation', 'high-priority'],
  },
  {
    id: 'p2',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Customer Experience Redesign',
    description: 'Redesign the customer experience journey across all touchpoints to improve satisfaction and loyalty.',
    status: 'planning',
    criteria: {
      revenue: 8,
      policyImpact: 7,
      budget: 4,
      resources: 4,
      complexity: 5,
    },
    startDate: '2025-04-01',
    endDate: '2025-09-30',
    department: 'Marketing',
    resources: 100,
    tags: ['customer-experience', 'design', 'marketing'],
  },
  {
    id: 'p3',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Supply Chain Optimization',
    description: 'Optimize the supply chain to reduce costs and improve delivery times.',
    status: 'in-progress',
    criteria: {
      revenue: 7,
      policyImpact: 6,
      budget: 5,
      resources: 5,
      complexity: 4,
    },
    startDate: '2025-02-10',
    endDate: '2025-08-15',
    department: 'Operations',
    resources: 100,
    tags: ['supply-chain', 'optimization', 'logistics'],
  },
  {
    id: 'p4',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'New Product Launch: Smart Office',
    description: 'Launch a new product line focused on smart office technologies.',
    status: 'planning',
    criteria: {
      revenue: 10,
      policyImpact: 7,
      budget: 3,
      resources: 3,
      complexity: 4,
    },
    startDate: '2025-06-01',
    endDate: '2026-01-31',
    department: 'Product Development',
    resources: 100,
    tags: ['product-launch', 'innovation', 'tech', 'high-priority'],
  },
  {
    id: 'p5',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Employee Wellness Program',
    description: 'Implement a comprehensive employee wellness program to improve satisfaction and productivity.',
    status: 'completed',
    criteria: {
      revenue: 4,
      policyImpact: 9,
      budget: 7,
      resources: 6,
      complexity: 8,
    },
    startDate: '2024-10-01',
    endDate: '2025-02-28',
    department: 'Human Resources',
    resources: 100,
    tags: ['hr', 'wellness', 'employee-experience'],
  },
  {
    id: 'p6',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Data Analytics Platform',
    description: 'Build a centralized data analytics platform to improve decision-making across departments.',
    status: 'in-progress',
    criteria: {
      revenue: 8,
      policyImpact: 9,
      budget: 4,
      resources: 4,
      complexity: 3,
    },
    startDate: '2025-01-05',
    endDate: '2025-10-15',
    department: 'Business Intelligence',
    resources: 100,
    tags: ['data', 'analytics', 'decision-making', 'high-priority'],
  },
  {
    id: 'p7',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Sustainability Initiative',
    description: 'Implement sustainability practices across the organization to reduce environmental impact.',
    status: 'planning',
    criteria: {
      revenue: 3,
      policyImpact: 10,
      budget: 6,
      resources: 5,
      complexity: 6,
    },
    startDate: '2025-05-01',
    endDate: '2026-04-30',
    department: 'Operations',
    resources: 100,
    tags: ['sustainability', 'environmental', 'corporate-responsibility'],
  },
  {
    id: 'p8',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Mobile Application Overhaul',
    description: 'Completely redesign and rebuild the company mobile application with new features.',
    status: 'on-hold',
    criteria: {
      revenue: 7,
      policyImpact: 6,
      budget: 5,
      resources: 4,
      complexity: 3,
    },
    startDate: '2025-03-15',
    endDate: '2025-09-30',
    department: 'Information Technology',
    resources: 100,
    tags: ['mobile', 'app-development', 'customer-facing'],
  },
  {
    id: 'p9',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Market Expansion: Asia',
    description: 'Strategic initiative to expand business operations into key Asian markets.',
    status: 'planning',
    criteria: {
      revenue: 10,
      policyImpact: 10,
      budget: 2,
      resources: 3,
      complexity: 2,
    },
    startDate: '2025-07-01',
    endDate: '2026-06-30',
    department: 'Strategic Development',
    resources: 100,
    tags: ['international', 'expansion', 'asia', 'high-priority'],
  },
  {
    id: 'p10',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Regulatory Compliance Update',
    description: 'Update systems and processes to comply with new regulatory requirements.',
    status: 'in-progress',
    criteria: {
      revenue: 2,
      policyImpact: 10,
      budget: 6,
      resources: 5,
      complexity: 4,
    },
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    department: 'Legal & Compliance',
    resources: 100,
    tags: ['compliance', 'regulatory', 'legal'],
  },
  {
    id: 'p11',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'AI Assistant Implementation',
    description: 'Implement AI-powered assistants across customer service and internal support functions.',
    status: 'planning',
    criteria: {
      revenue: 8,
      policyImpact: 7,
      budget: 4,
      resources: 4,
      complexity: 3,
    },
    startDate: '2025-04-15',
    endDate: '2025-11-30',
    department: 'Information Technology',
    resources: 100,
    tags: ['ai', 'automation', 'customer-service', 'innovation'],
  },
  {
    id: 'p12',
    organizationId: '11111111-1111-1111-1111-111111111111',
    name: 'Office Relocation',
    description: 'Relocate the headquarters to a new facility to accommodate growth and improve workspace.',
    status: 'on-hold',
    criteria: {
      revenue: 1,
      policyImpact: 8,
      budget: 2,
      resources: 3,
      complexity: 5,
    },
    startDate: '2025-08-01',
    endDate: '2026-02-28',
    department: 'Facilities',
    resources: 100,
    tags: ['facilities', 'relocation', 'infrastructure'],
  },
];

// Helper functions for working with project data

export const calculateOverallScore = (
  project: Project, 
  weights: Record<string, number> = {},
  inverseCriteria: string[] = []
) => {
  // Get all criteria keys that exist in the project
  const criteriaKeys = Object.keys(project.criteria);
  
  // Filter weights to only include criteria that exist in the project
  const filteredWeights: Record<string, number> = {};
  
  // Default weight of 1 for all criteria if not specified
  criteriaKeys.forEach(key => {
    filteredWeights[key] = weights[key] || 1;
  });
  
  const totalWeight = Object.values(filteredWeights).reduce((sum, weight) => sum + weight, 0);
  
  if (totalWeight === 0) return 0;
  
  let weightedSum = 0;
  
  // Calculate weighted sum, handling inverse criteria
  criteriaKeys.forEach(key => {
    let value = project.criteria[key];
    const weight = filteredWeights[key] || 0;
    
    // For inverse criteria, invert the scale (10 - value + 1)
    // This makes lower values score higher
    if (inverseCriteria.includes(key)) {
      value = 5 - value; // Invert scale: 1->10, 2->9, 3->8, etc.
    }
    
    weightedSum += value * weight;
  });
  
  return parseFloat((weightedSum / totalWeight).toFixed(2));
};

export const getProjectsByStatus = (status: Project['status']) => {
  return projects.filter(project => project.status === status);
};

export const getTopProjects = (
  count = 5, 
  weights: Record<string, number> = {},
  inverseCriteria: string[] = []
) => {
  return [...projects]
    .map(project => ({
      ...project,
      score: calculateOverallScore(project, weights, inverseCriteria)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
};

export const getStatusCounts = () => {
  return projects.reduce((counts, project) => {
    counts[project.status] = (counts[project.status] || 0) + 1;
    return counts;
  }, {} as Record<Project['status'], number>);
};
