'use client';

import { useProjects } from '@/app/contexts/ProjectContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { LoadingWrapper } from '@/components/ui/LoadingWrapper';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { PortfolioSelection } from '@/src/repositories/PortfolioRepository';

export const MetricsSummary = () => {
  const { projects, loading } = useProjects();
  const { user } = useAuth();
  const [activePortfolio, setActivePortfolio] = useState<PortfolioSelection | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

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

  const metrics = [
    {
      label: 'Total Projects',
      value: totalProjects,
      gradientId: 'projectsGradient',
      gradientColors: ['#4f46e5', '#8b5cf6'], // primary-600 to purple-500
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
        </svg>
      ),
    },
    {
      label: 'Approved Projects',
      value: approvedProjects,
      gradientId: 'approvedGradient',
      gradientColors: ['#10b981', '#14b8a6'], // emerald-500 to teal-500
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      label: 'Pending Projects',
      value: pendingProjects,
      gradientId: 'pendingGradient',
      gradientColors: ['#f59e0b', '#f97316'], // amber-500 to orange-500
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    },
    {
      label: 'Total Budget',
      value: `$${totalBudget.toLocaleString()}`,
      gradientId: 'budgetGradient',
      gradientColors: ['#3b82f6', '#06b6d4'], // blue-500 to cyan-500
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
        </svg>
      ),
    },
    {
      label: 'Total Mandays',
      value: totalMandays.toLocaleString(),
      gradientId: 'mandaysGradient',
      gradientColors: ['#8b5cf6', '#ec4899'], // purple-500 to pink-500
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
    },
  ];


  return (
    <LoadingWrapper
      isLoading={loading || portfolioLoading}
      skeleton={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric, index) => (
          <div 
            key={index}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br shadow-md p-6"
            style={{
              backgroundImage: `linear-gradient(to bottom right, ${metric.gradientColors[0]}, ${metric.gradientColors[1]})`
            }}
          >
            <div className="flex items-center">
              <div className="bg-white/20 text-white p-3 rounded-lg mr-4">
                {metric.icon}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{metric.label}</p>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </LoadingWrapper>
  );
};
