'use client';

import React, { useState } from 'react';
import { useCommittee } from '../_contexts/CommitteeContext';
import { PageLayout } from '../_components/layout/PageLayout';

/**
 * Committee Review main page
 * This page serves as the entry point for committee members to review and score projects
 */
export default function CommitteePage() {
  const { 
    sessions, 
    activeSession, 
    projects, 
    progress, 
    loading, 
    error, 
    setActiveSession 
  } = useCommittee();

  // Local state for filtering
  const [filters, setFilters] = useState({
    status: [] as string[],
    department: [] as string[],
    search: ''
  });

  // Handle session change
  const handleSessionChange = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(session);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Filter projects based on current filters
  const filteredProjects = projects ? projects.filter(project => {
    // Filter by status
    if (filters.status.length > 0 && !filters.status.includes(project.scoringProgress.status)) {
      return false;
    }

    // Filter by department
    if (filters.department.length > 0 && project.department && 
        !filters.department.includes(project.department.id)) {
      return false;
    }

    // Filter by search term
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    return true;
  }) : [];

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <PageLayout>
      <div className="flex flex-col space-y-6 p-6">
        <h1 className="text-2xl font-bold">Committee Review</h1>
        
        {/* Session selector */}
        {sessions.length > 0 && (
          <div className="flex items-center space-x-4">
            <label htmlFor="session-select" className="font-medium">
              Review Session:
            </label>
            <select
              id="session-select"
              className="border rounded-md p-2"
              value={activeSession?.id || ''}
              onChange={(e) => handleSessionChange(e.target.value)}
              disabled={loading.sessions}
            >
              {sessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* No sessions message */}
        {!loading.sessions && sessions.length === 0 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            No committee review sessions found. Please contact your administrator.
          </div>
        )}

        {/* Dashboard */}
        <div className="bg-white rounded-lg shadow p-6">
          {(loading.sessions || loading.progress) ? (
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            activeSession && progress && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Total Projects</div>
                    <div className="text-2xl font-bold">{progress.totalProjects}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Completed</div>
                    <div className="text-2xl font-bold">{progress.completedProjects}</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">In Progress</div>
                    <div className="text-2xl font-bold">{progress.inProgressProjects}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Not Started</div>
                    <div className="text-2xl font-bold">{progress.notStartedProjects}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Overall Progress</div>
                    <div className="text-2xl font-bold">{Math.round(progress.progress)}%</div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Project list */}
        <div className="bg-white rounded-lg shadow">
          {loading.projects ? (
            <div className="animate-pulse p-6 flex flex-col space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            activeSession && projects && (
              <div>
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold">Projects to Review</h2>
                  <div className="mt-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search projects..."
                        className="w-full p-2 border rounded"
                        value={filters.search}
                        onChange={(e) => handleFilterChange({ search: e.target.value })}
                      />
                    </div>
                    <select
                      className="p-2 border rounded"
                      value={filters.status.length === 1 ? filters.status[0] : ''}
                      onChange={(e) => handleFilterChange({ status: e.target.value ? [e.target.value] : [] })}
                    >
                      <option value="">All Statuses</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="NOT_STARTED">Not Started</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Budget
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            No projects found matching your criteria
                          </td>
                        </tr>
                      ) : (
                        filteredProjects.map((project) => (
                          <tr key={project.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {project.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {project.department?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {project.budget ? formatCurrency(project.budget) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${project.scoringProgress.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                                  project.scoringProgress.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                {project.scoringProgress.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${project.scoringProgress.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs mt-1 inline-block">
                                {Math.round(project.scoringProgress.progress)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <a 
                                href={`/committee/projects/${project.id}`} 
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                {project.scoringProgress.status === 'COMPLETED' 
                                  ? 'View' 
                                  : project.scoringProgress.status === 'IN_PROGRESS' 
                                    ? 'Continue' 
                                    : 'Score'}
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </PageLayout>
  );
}
