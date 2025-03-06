export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  criteria: {
    revenue: number; // Scale 1-10, higher is better
    policyImpact: number; // Scale 1-10, higher is better
    budget: number; // Scale 1-10, lower number is higher budget (inverse scale)
    resources: number; // Scale 1-10, lower number is more resources (inverse scale)
    complexity: number; // Scale 1-10, lower number is more complex (inverse scale)
  };
  startDate: string;
  endDate: string;
  team: string[];
  department: string;
  tags: string[];
}

export const projects: Project[] = [
  {
    id: 'p1',
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
    team: ['John Smith', 'Maria Chen', 'Robert Taylor', 'Sarah Johnson'],
    department: 'Information Technology',
    tags: ['digital', 'cloud', 'transformation', 'high-priority'],
  },
  {
    id: 'p2',
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
    team: ['Emily Wong', 'David Miller', 'Lisa Chen'],
    department: 'Marketing',
    tags: ['customer-experience', 'design', 'marketing'],
  },
  {
    id: 'p3',
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
    team: ['Michael Rodriguez', 'Susan Lee', 'James Wilson'],
    department: 'Operations',
    tags: ['supply-chain', 'optimization', 'logistics'],
  },
  {
    id: 'p4',
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
    team: ['Patricia Evans', 'Thomas Brown', 'Jennifer Davis', 'Andrew Wilson'],
    department: 'Product Development',
    tags: ['product-launch', 'innovation', 'tech', 'high-priority'],
  },
  {
    id: 'p5',
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
    team: ['Sandra Martinez', 'Kevin Thompson'],
    department: 'Human Resources',
    tags: ['hr', 'wellness', 'employee-experience'],
  },
  {
    id: 'p6',
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
    team: ['Daniel Kim', 'Rachel Green', 'Alex Johnson', 'Maya Patel'],
    department: 'Business Intelligence',
    tags: ['data', 'analytics', 'decision-making', 'high-priority'],
  },
  {
    id: 'p7',
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
    team: ['Chris Peterson', 'Olivia Wang', 'Nathan Thompson'],
    department: 'Operations',
    tags: ['sustainability', 'environmental', 'corporate-responsibility'],
  },
  {
    id: 'p8',
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
    team: ['Tyler Jones', 'Samantha Lee', 'Ryan Martinez'],
    department: 'Information Technology',
    tags: ['mobile', 'app-development', 'customer-facing'],
  },
  {
    id: 'p9',
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
    team: ['Linda Park', 'Jason Wong', 'Michelle Tanaka', 'Robert Chen', 'Elizabeth Sanders'],
    department: 'Strategic Development',
    tags: ['international', 'expansion', 'asia', 'high-priority'],
  },
  {
    id: 'p10',
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
    team: ['Jonathan Lewis', 'Karen Miller', 'David Clark'],
    department: 'Legal & Compliance',
    tags: ['compliance', 'regulatory', 'legal'],
  },
  {
    id: 'p11',
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
    team: ['Sophia Rodriguez', 'Ethan Williams', 'Ava Johnson', 'Noah Garcia'],
    department: 'Information Technology',
    tags: ['ai', 'automation', 'customer-service', 'innovation'],
  },
  {
    id: 'p12',
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
    team: ['Benjamin Harris', 'Jessica Taylor', 'Matthew Anderson'],
    department: 'Facilities',
    tags: ['facilities', 'relocation', 'infrastructure'],
  },
];

// Helper functions for working with project data

export const calculateOverallScore = (project: Project, weights = {
  revenue: 1,
  policyImpact: 1,
  budget: 1,
  resources: 1, 
  complexity: 1
}) => {
  const { revenue, policyImpact, budget, resources, complexity } = project.criteria;
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  const score = (
    (revenue * weights.revenue) +
    (policyImpact * weights.policyImpact) +
    (budget * weights.budget) +
    (resources * weights.resources) +
    (complexity * weights.complexity)
  ) / totalWeight;
  
  return parseFloat(score.toFixed(2));
};

export const getProjectsByStatus = (status: Project['status']) => {
  return projects.filter(project => project.status === status);
};

export const getTopProjects = (count = 5, weights = {
  revenue: 1,
  policyImpact: 1,
  budget: 1,
  resources: 1,
  complexity: 1
}) => {
  return [...projects]
    .map(project => ({
      ...project,
      score: calculateOverallScore(project, weights)
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
