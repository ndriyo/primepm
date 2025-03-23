'use client';

import { createContext, useState, useContext, useEffect, ReactNode, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/contexts/AuthContext';
import { useCriteria } from '@/app/contexts/CriteriaContext';
import { fetchWithAuth } from '@/src/lib/fetchInterceptor';
import { FilterState, Project, FilterItem, RangeFilter } from '@/src/types/project';
import { debounce } from 'lodash';

interface ProjectSearchContextType {
  // State
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  projects: Project[];
  departments: { id: string; name: string }[];
  criteria: any[]; // Expose criteria from CriteriaContext
  resultsCount: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  filters: FilterState;
  activeFilters: FilterItem[];
  
  // Handlers
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDepartmentChange: (deptId: string, checked: boolean) => void;
  handleBudgetChange: (min: number | null, max: number | null) => void;
  handleResourcesChange: (min: number | null, max: number | null) => void;
  handleDateRangeChange: (start: string | null, end: string | null) => void;
  handleTagChange: (tag: string, checked: boolean) => void;
  handleStatusChange: (status: string, checked: boolean) => void;
  handleClearFilters: () => void;
  removeFilter: (key: string) => void;
  handleSelectProject: (projectId: string) => void;
  handleCreateProject: () => void;
  handleImportProjects: () => void;
  
  // Formatting utilities
  formatCurrency: (amount: number | undefined | null) => string;
  formatDate: (dateString: string | undefined | null) => string;
  
  // New function for formatting number with thousand separator
  formatNumber: (value: number | undefined | null) => string;
}

// Default filter state
const defaultFilterState: FilterState = {
  search: '',
  departments: [],
  budget: { min: null, max: null },
  resources: { min: null, max: null },
  dateRange: { start: null, end: null },
  tags: [],
  status: []
};

// Create the context
const ProjectSearchContext = createContext<ProjectSearchContextType | undefined>(undefined);

// Provider component
export function ProjectSearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { criteria } = useCriteria();
  
  // Filter and search state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [resultsCount, setResultsCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Initialize filter state from URL or default
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  
  // Parse URL search params on initial load
  useEffect(() => {
    if (searchParams) {
      const searchQuery = searchParams.get('search') || '';
      const departments = searchParams.getAll('department');
      const budgetMin = searchParams.get('budgetMin');
      const budgetMax = searchParams.get('budgetMax');
      const resourcesMin = searchParams.get('resourcesMin');
      const resourcesMax = searchParams.get('resourcesMax');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const tags = searchParams.getAll('tag');
      const status = searchParams.getAll('status');
      
      // Criteria scores require special handling
      // Removed criteriaScores handling
      
      // Set the parsed filter state
      setFilters({
        search: searchQuery,
        departments,
        budget: {
          min: budgetMin ? parseInt(budgetMin) : null,
          max: budgetMax ? parseInt(budgetMax) : null
        },
        resources: {
          min: resourcesMin ? parseInt(resourcesMin) : null,
          max: resourcesMax ? parseInt(resourcesMax) : null
        },
        dateRange: {
          start: startDate,
          end: endDate
        },
        tags,
        status
      });
    }
  }, [searchParams, criteria]);
  
  // Fetch departments for filter options
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetchWithAuth('/api/departments', {}, user);
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    
    fetchDepartments();
  }, [user]);
  
  // Function to convert filters to API query params
  const getQueryParams = (filters: FilterState, page: number, pageSize: number): URLSearchParams => {
    const params = new URLSearchParams();
    
    // Add search term
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    // Add department filters
    filters.departments.forEach(dept => {
      params.append('department', dept);
    });
    
    // Add budget range
    if (filters.budget.min !== null) {
      params.append('budgetMin', filters.budget.min.toString());
    }
    if (filters.budget.max !== null) {
      params.append('budgetMax', filters.budget.max.toString());
    }
    
    // Add resources range
    if (filters.resources.min !== null) {
      params.append('resourcesMin', filters.resources.min.toString());
    }
    if (filters.resources.max !== null) {
      params.append('resourcesMax', filters.resources.max.toString());
    }
    
    // Add date range
    if (filters.dateRange.start) {
      params.append('startDate', filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      params.append('endDate', filters.dateRange.end);
    }
    
    // Add tags
    filters.tags.forEach(tag => {
      params.append('tag', tag);
    });
    
    // Add status
    filters.status.forEach(status => {
      params.append('status', status);
    });
    
    // Removed criteria scores params
    
    // Add pagination
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    return params;
  };
  
  // Fetch projects with the current filters
  const fetchProjects = async (filters: FilterState, page: number, pageSize: number) => {
    setIsLoading(true);
    
    try {
      const params = getQueryParams(filters, page, pageSize);
      const url = `/api/projects?${params.toString()}`;
      
      // Check cache first if available
      const cachedData = queryClient.getQueryData(['projects', params.toString()]);
      if (cachedData) {
        setProjects(cachedData as Project[]);
        setResultsCount((cachedData as Project[]).length);
        setIsLoading(false);
        return;
      }
      
      const response = await fetchWithAuth(url, {}, user);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data.projects || data);
      setResultsCount(data.total || data.length);
      
      // Cache the results
      queryClient.setQueryData(['projects', params.toString()], data.projects || data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Debounced version of fetchProjects to avoid too many API calls
  const debouncedFetchProjects = useMemo(
    () => debounce((filters: FilterState, page: number, pageSize: number) => {
      fetchProjects(filters, page, pageSize);
    }, 300),
    [user, queryClient]
  );
  
  // Fetch projects when filters or pagination changes
  useEffect(() => {
    debouncedFetchProjects(filters, page, pageSize);
    
    // Update URL with current filters
    const params = getQueryParams(filters, page, pageSize);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', url);
    
    return () => {
      debouncedFetchProjects.cancel();
    };
  }, [filters, page, pageSize, debouncedFetchProjects]);
  
  // Handler functions
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    // Reset to first page when search changes
    setPage(1);
  };
  
  // Handle department filter change
  const handleDepartmentChange = (deptId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      departments: checked 
        ? [...prev.departments, deptId]
        : prev.departments.filter(id => id !== deptId)
    }));
    setPage(1);
  };
  
  // Handle budget range change
  const handleBudgetChange = (min: number | null, max: number | null) => {
    setFilters(prev => ({
      ...prev,
      budget: { min, max }
    }));
    setPage(1);
  };
  
  // Handle resources range change
  const handleResourcesChange = (min: number | null, max: number | null) => {
    setFilters(prev => ({
      ...prev,
      resources: { min, max }
    }));
    setPage(1);
  };
  
  // Handle date range change
  const handleDateRangeChange = (start: string | null, end: string | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
    setPage(1);
  };
  
  // Handle tag selection
  const handleTagChange = (tag: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      tags: checked
        ? [...prev.tags, tag]
        : prev.tags.filter(t => t !== tag)
    }));
    setPage(1);
  };
  
  // Handle status filter change
  const handleStatusChange = (status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      status: checked
        ? [...prev.status, status]
        : prev.status.filter(s => s !== status)
    }));
    setPage(1);
  };
  
  // Removed handleCriteriaScoreChange function
  
  // Clear all filters
  const handleClearFilters = () => {
    setFilters(defaultFilterState);
    setPage(1);
  };
  
  // Get a list of all active filters for display
  const activeFilters = useMemo(() => {
    const filterItems: FilterItem[] = [];
    
    if (filters.search) {
      filterItems.push({ key: 'search', label: `Search: ${filters.search}` });
    }
    
    filters.departments.forEach(deptId => {
      const dept = departments.find(d => d.id === deptId);
      if (dept) {
        filterItems.push({ key: `dept_${deptId}`, label: `Department: ${dept.name}` });
      }
    });
    
    if (filters.budget.min !== null || filters.budget.max !== null) {
      let label = 'Budget: ';
      if (filters.budget.min !== null) label += `$${filters.budget.min.toLocaleString()}`;
      label += ' - ';
      if (filters.budget.max !== null) label += `$${filters.budget.max.toLocaleString()}`;
      filterItems.push({ key: 'budget', label });
    }
    
    if (filters.resources.min !== null || filters.resources.max !== null) {
      let label = 'Resources: ';
      if (filters.resources.min !== null) label += `${filters.resources.min.toLocaleString()}`;
      label += ' - ';
      if (filters.resources.max !== null) label += `${filters.resources.max.toLocaleString()}`;
      filterItems.push({ key: 'resources', label });
    }
    
    if (filters.dateRange.start || filters.dateRange.end) {
      let label = 'Dates: ';
      if (filters.dateRange.start) label += new Date(filters.dateRange.start).toLocaleDateString();
      label += ' - ';
      if (filters.dateRange.end) label += new Date(filters.dateRange.end).toLocaleDateString();
      filterItems.push({ key: 'dates', label });
    }
    
    filters.tags.forEach(tag => {
      filterItems.push({ key: `tag_${tag}`, label: `Tag: ${tag}` });
    });
    
    filters.status.forEach(status => {
      filterItems.push({ key: `status_${status}`, label: `Status: ${status}` });
    });
    
    // Removed criteriaScores from active filters
    
    return filterItems;
  }, [filters, departments, criteria]);
  
  // Remove a single filter
  const removeFilter = (key: string) => {
    if (key === 'search') {
      setFilters(prev => ({ ...prev, search: '' }));
    } else if (key === 'budget') {
      setFilters(prev => ({ ...prev, budget: { min: null, max: null } }));
    } else if (key === 'resources') {
      setFilters(prev => ({ ...prev, resources: { min: null, max: null } }));
    } else if (key === 'dates') {
      setFilters(prev => ({ ...prev, dateRange: { start: null, end: null } }));
    } else if (key.startsWith('dept_')) {
      const deptId = key.replace('dept_', '');
      setFilters(prev => ({
        ...prev,
        departments: prev.departments.filter(id => id !== deptId)
      }));
    } else if (key.startsWith('tag_')) {
      const tag = key.replace('tag_', '');
      setFilters(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t !== tag)
      }));
    } else if (key.startsWith('status_')) {
      const status = key.replace('status_', '');
      setFilters(prev => ({
        ...prev,
        status: prev.status.filter(s => s !== status)
      }));
    // Removed criterion_ case from removeFilter
    }
    
    setPage(1);
  };
  
  // Navigate to project details
  const handleSelectProject = (projectId: string) => {
    router.push(`/details/${projectId}`);
  };
  
  // Create new project
  const handleCreateProject = () => {
    router.push('/projects/new');
  };
  
  // Navigate to import projects page
  const handleImportProjects = () => {
    router.push('/projects/import');
  };
  
  // Format dollar amount
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '-';
    return `$${amount.toLocaleString()}`;
  };
  
  // Format number with thousand separator
  const formatNumber = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString();
  };
  
  // Format date
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    
    // Format date as "Mar 21 '25"
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear().toString().substr(-2);
    
    return `${month} ${day} '${year}`;
  };

  const contextValue = {
    // State
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    isLoading,
    projects,
    departments,
    criteria, // Add criteria to the context value
    resultsCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    activeFilters,
    
    // Handlers
    handleSearchChange,
    handleDepartmentChange,
    handleBudgetChange,
    handleResourcesChange,
    handleDateRangeChange,
    handleTagChange,
    handleStatusChange,
    handleClearFilters,
    removeFilter,
    handleSelectProject,
    handleCreateProject,
    handleImportProjects,
    
    // Formatting utilities
    formatCurrency,
    formatDate,
    formatNumber
  };

  return (
    <ProjectSearchContext.Provider value={contextValue}>
      {children}
    </ProjectSearchContext.Provider>
  );
}

// Hook to use the project search context
export function useProjectSearch() {
  const context = useContext(ProjectSearchContext);
  if (context === undefined) {
    throw new Error('useProjectSearch must be used within a ProjectSearchProvider');
  }
  return context;
}
