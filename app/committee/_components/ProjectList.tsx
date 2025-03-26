'use client';

import React, { useState, useEffect } from 'react';
import { useCommittee, CommitteeProject } from '@/app/_contexts/CommitteeContext';
import { LoadingWrapper } from '@/app/_components/ui/LoadingWrapper';
import { SkeletonProjectList } from '@/app/_components/ui/skeleton/SkeletonProjectList';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * ProjectList Component
 * 
 * Displays a list of projects for committee review with filtering and sorting options.
 */
export const ProjectList: React.FC = () => {
  const { activeSession, projects, loading, fetchProjects } = useCommittee();
  const router = useRouter();
  
  // State for filtering and sorting
  const [filteredProjects, setFilteredProjects] = useState<CommitteeProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Apply filters and sorting when projects or filter settings change
  useEffect(() => {
    if (!projects) return;
    
    let result = [...projects];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(project => 
        project.name.toLowerCase().includes(term) || 
        (project.description && project.description.toLowerCase().includes(term))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(project => project.scoringProgress.status === statusFilter);
    }
    
    // Apply department filter
    if (departmentFilter !== 'ALL') {
      result = result.filter(project => project.department?.id === departmentFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'department':
          comparison = (a.department?.name || '').localeCompare(b.department?.name || '');
          break;
        case 'budget':
          comparison = (a.budget || 0) - (b.budget || 0);
          break;
        case 'progress':
          comparison = a.scoringProgress.progress - b.scoringProgress.progress;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredProjects(result);
  }, [projects, searchTerm, statusFilter, departmentFilter, sortBy, sortDirection]);
  
  // Get unique departments for filter
  const departments = React.useMemo(() => {
    if (!projects) return [];
    
    const deptMap = new Map();
    projects.forEach(project => {
      if (project.department) {
        deptMap.set(project.department.id, project.department.name);
      }
    });
    
    return Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);
  
  // Handle sort header click
  const handleSortClick = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  // Handle project click
  const handleProjectClick = (projectId: string) => {
    if (!activeSession) return;
    
    router.push(`/committee/project/${projectId}?sessionId=${activeSession.id}`);
  };
  
  // Format currency
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'NOT_STARTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Render loading state
  if (loading.projects) {
    return (
      <LoadingWrapper isLoading={true} skeleton={<SkeletonProjectList />}>
        <div />
      </LoadingWrapper>
    );
  }
  
  // Render empty state
  if (!projects || projects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">No Projects Available</h2>
        <p className="text-gray-600 mb-6">
          There are no projects available for review in this session.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="NOT_STARTED">Not Started</option>
            </select>
          </div>
          
          {/* Department Filter */}
          {departments.length > 0 && (
            <div className="w-full md:w-48">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      
      {/* Project Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('name')}
              >
                Project Name
                {sortBy === 'name' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('department')}
              >
                Department
                {sortBy === 'department' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('budget')}
              >
                Budget
                {sortBy === 'budget' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('progress')}
              >
                Status
                {sortBy === 'progress' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProjects.map((project) => (
              <tr 
                key={project.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleProjectClick(project.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{project.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{project.department?.name || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatCurrency(project.budget)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(project.scoringProgress.status)}`}>
                    {project.scoringProgress.status.replace('_', ' ')}
                  </span>
                  <div className="mt-1 w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${project.scoringProgress.progress}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectClick(project.id);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {project.scoringProgress.status === 'COMPLETED' ? 'View' : 
                     project.scoringProgress.status === 'IN_PROGRESS' ? 'Continue' : 'Score'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Empty Results */}
      {filteredProjects.length === 0 && (
        <div className="p-6 text-center">
          <p className="text-gray-500">No projects match your filters.</p>
        </div>
      )}
    </div>
  );
};
