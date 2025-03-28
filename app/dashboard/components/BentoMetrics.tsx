'use client';

import { useProjects } from '@/app/_contexts/ProjectContext';
import { useAuth } from '@/app/_contexts/AuthContext';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';
import { SkeletonCard } from '@/app/_components/ui/skeleton';
import { BentoCard } from '@/app/_components/ui/BentoCard';
import { useEffect, useState } from 'react';
import { PortfolioSelection } from '@/app/_repositories/PortfolioRepository';

export const BentoMetrics = () => {
  const { projects, loading: projectsLoading } = useProjects();
  const { user } = useAuth();
  const [activePortfolio, setActivePortfolio] = useState<PortfolioSelection | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Set isMounted to true after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter projects based on user role
  const filteredProjects = user?.role === 'projectManager' && user?.departmentId
    ? projects.filter(p => p.departmentId === user.departmentId)
    : projects;

  // Fetch active portfolio from API
  useEffect(() => {
    const fetchActivePortfolio = async () => {
      if (user?.organizationId && user?.id) {
        try {
          // Use the API route instead of direct repository access
          const response = await fetch('/api/portfolios/active', {
            headers: {
              'x-organization-id': user.organizationId,
              'x-user-id': user.id,
              'x-user-role': user.role
            }
          });
          
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          
          const portfolio = await response.json();
          setActivePortfolio(portfolio);
        } catch (error) {
          console.error('Error fetching active portfolio:', error);
        } finally {
          setPortfolioLoading(false);
        }
      }
    };

    fetchActivePortfolio();
  }, [user?.organizationId, user?.id, user?.role]);

  // Calculate metrics
  const totalProjects = filteredProjects.length;
  
  // Get approved projects (projects selected in the active portfolio)
  const approvedProjects = activePortfolio?.portfolioProjects
    ? filteredProjects.filter(project => 
        activePortfolio.portfolioProjects?.some(
          pp => pp.projectId === project.id && pp.isSelected
        )
      ).length
    : 0;
  
  // Calculate pending projects (total - approved)
  const pendingProjects = totalProjects - approvedProjects;
  
  // Calculate total budget and mandays (resources)
  const totalBudget = filteredProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
  const totalMandays = filteredProjects.reduce((sum, project) => sum + (project.resources || 0), 0);

  // Define metrics with colors from the reference
  const metrics = [
    {
      title: 'Total Projects',
      value: totalProjects,
      colors: ["#3B82F6", "#60A5FA", "#93C5FD"], // Blue gradient
      delay: 0.2,
    },
    {
      title: 'Approved Projects',
      value: approvedProjects,
      subtitle: `${approvedProjects > 0 ? Math.round((approvedProjects / totalProjects) * 100) : 0}% of total projects`,
      colors: ["#10b981", "#34D399", "#6EE7B7"], // Green gradient
      delay: 0.4,
    },
    {
      title: 'Pending Projects',
      value: pendingProjects,
      subtitle: `${pendingProjects > 0 ? Math.round((pendingProjects / totalProjects) * 100) : 0}% of total projects`,
      colors: ["#F59E0B", "#FBBF24", "#FCD34D"], // Amber gradient
      delay: 0.6,
    },
    {
      title: 'Total Budget',
      value: `$${totalBudget.toLocaleString()}`,
      colors: ["#3B82F6", "#A78BFA", "#FBCFE8"], // Blue-purple-pink gradient
      delay: 0.8,
    },
    {
      title: 'Total Mandays',
      value: totalMandays.toLocaleString(),
      subtitle: 'Resource allocation across all projects',
      colors: ["#8B5CF6", "#EC4899", "#F472B6"], // Purple-pink gradient
      delay: 1.0,
    },
  ];

  return (
    <>
      {/* Use consistent initial rendering */}
      {!isMounted || projectsLoading || portfolioLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {metrics.map((metric, index) => (
            <BentoCard
              key={index}
              title={metric.title}
              value={metric.value}
              subtitle={metric.subtitle}
              colors={metric.colors}
              delay={0.1 * index}
            />
          ))}
        </div>
      )}
    </>
  );
};
