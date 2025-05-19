'use client';

import { createContext, useState, useContext, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/_contexts/AuthContext';
import { useCriteria } from '@/app/_contexts/CriteriaContext';
import { fetchWithAuth } from '@/app/_lib/fetchInterceptor';
import { FilterState, Project, FilterItem, RangeFilter } from '@/app/_types/project';
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
  
  // Data refresh
  refreshData: () => void;
  
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
  const [departments, setDepartmentsState] = useState<{ id: string; name: string }[]>([]); // State variable for departments
  const [resultsCount, setResultsCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Initialize filter state from URL or default
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  
  // Parse URL search params on initial load
  useEffect(() => {
    if (searchParams) {
      const searchQuery = searchParams.get('search') || '';
      const departmentsParam = searchParams.getAll('department');
      const budgetMin = searchParams.get('budgetMin');
      const budgetMax = searchParams.get('budgetMax');
      const resourcesMin = searchParams.get('resourcesMin');
      const resourcesMax = searchParams.get('resourcesMax');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const tags = searchParams.getAll('tag');
      const status = searchParams.getAll('status');
      
      const newFilterState: FilterState = {
        search: searchQuery,
        departments: departmentsParam,
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
      };

      if (JSON.stringify(newFilterState) !== JSON.stringify(filters)) {
        setFilters(newFilterState);
      }
    }
  }, [searchParams, criteria, filters]);
  
  const { 
    data: fetchedDepartmentsData, // Renamed to avoid conflict with state variable
    isLoading: departmentsLoading, 
    error: departmentsError 
  } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['departments', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) {
        return [];
      }
      const response = await fetchWithAuth('/api/departments', {}, user);
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      return response.json();
    },
    enabled: !!user && !!user.organizationId,
    staleTime: 5 * 60 * 1000, 
  });

  useEffect(() => {
    if (fetchedDepartmentsData) {
      setDepartmentsState(fetchedDepartmentsData);
    }
  }, [fetchedDepartmentsData]);

  useEffect(() => {
    if (departmentsError) {
      console.error('Error fetching departments via React Query:', departmentsError);
      setDepartmentsState([]);
    }
  }, [departmentsError]);
  
  const getQueryParams = useCallback((currentFilters: FilterState, currentPage: number, currentPageSize: number): URLSearchParams => {
    const params = new URLSearchParams();
    if (currentFilters.search) params.append('search', currentFilters.search);
    currentFilters.departments.forEach(dept => params.append('department', dept));
    if (currentFilters.budget.min !== null) params.append('budgetMin', currentFilters.budget.min.toString());
    if (currentFilters.budget.max !== null) params.append('budgetMax', currentFilters.budget.max.toString());
    if (currentFilters.resources.min !== null) params.append('resourcesMin', currentFilters.resources.min.toString());
    if (currentFilters.resources.max !== null) params.append('resourcesMax', currentFilters.resources.max.toString());
    if (currentFilters.dateRange.start) params.append('startDate', currentFilters.dateRange.start);
    if (currentFilters.dateRange.end) params.append('endDate', currentFilters.dateRange.end);
    currentFilters.tags.forEach(tag => params.append('tag', tag));
    currentFilters.status.forEach(statusItem => params.append('status', statusItem));
    params.append('page', currentPage.toString());
    params.append('pageSize', currentPageSize.toString());
    return params;
  }, []);
  
  const fetchProjects = useCallback(async (currentFilters: FilterState, currentPage: number, currentPageSize: number, skipCache = false) => {
    setIsLoading(true);
    try {
      if (!user || !user.organizationId) {
        setProjects([]);
        setResultsCount(0);
        setIsLoading(false);
        return;
      }
      const queryParams = getQueryParams(currentFilters, currentPage, currentPageSize);
      const queryKey = ['projects', user.organizationId, queryParams.toString()];
      
      if (!skipCache) {
        const cachedData = queryClient.getQueryData<{ projects: Project[], total: number }>(queryKey);
        if (cachedData) {
          setProjects(cachedData.projects);
          setResultsCount(cachedData.total);
          setIsLoading(false);
          return;
        }
      }
      const url = `/api/projects?${queryParams.toString()}`;
      const response = await fetchWithAuth(url, {}, user);
      if (!response.ok) {
        setProjects([]);
        setResultsCount(0);
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data.projects || []);
      setResultsCount(data.total || 0);
      queryClient.setQueryData(queryKey, data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
      setResultsCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [queryClient, user, getQueryParams]);

  const debouncedFetchProjects = useMemo(
    () => debounce((currentFilters: FilterState, currentPage: number, currentPageSize: number) => {
      fetchProjects(currentFilters, currentPage, currentPageSize);
    }, 300),
    [fetchProjects] 
  );

  useEffect(() => {
    if (user && user.organizationId) {
      debouncedFetchProjects(filters, page, pageSize);
      const params = getQueryParams(filters, page, pageSize);
      const urlPath = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', urlPath);
    }
    return () => {
      debouncedFetchProjects.cancel();
    };
  }, [filters, page, pageSize, user, debouncedFetchProjects, getQueryParams]);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setPage(1);
  }, []);
  
  const handleDepartmentChange = useCallback((deptId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      departments: checked 
        ? [...prev.departments, deptId]
        : prev.departments.filter(id => id !== deptId)
    }));
    setPage(1);
  }, []);
  
  const handleBudgetChange = useCallback((min: number | null, max: number | null) => {
    setFilters(prev => ({ ...prev, budget: { min, max } }));
    setPage(1);
  }, []);
  
  const handleResourcesChange = useCallback((min: number | null, max: number | null) => {
    setFilters(prev => ({ ...prev, resources: { min, max } }));
    setPage(1);
  }, []);
  
  const handleDateRangeChange = useCallback((start: string | null, end: string | null) => {
    setFilters(prev => ({ ...prev, dateRange: { start, end } }));
    setPage(1);
  }, []);
  
  const handleTagChange = useCallback((tag: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      tags: checked ? [...prev.tags, tag] : prev.tags.filter(t => t !== tag)
    }));
    setPage(1);
  }, []);
  
  const handleStatusChange = useCallback((status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      status: checked ? [...prev.status, status] : prev.status.filter(s => s !== status)
    }));
    setPage(1);
  }, []);
  
  const handleClearFilters = useCallback(() => {
    setFilters(defaultFilterState);
    setPage(1);
  }, []);
  
  const activeFilters = useMemo(() => {
    const filterItems: FilterItem[] = [];
    if (filters.search) filterItems.push({ key: 'search', label: `Search: ${filters.search}` });
    filters.departments.forEach(deptId => {
      const dept = departments.find(d => d.id === deptId); // Use 'departments' state variable here
      if (dept) filterItems.push({ key: `dept_${deptId}`, label: `Department: ${dept.name}` });
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
    filters.tags.forEach(tag => filterItems.push({ key: `tag_${tag}`, label: `Tag: ${tag}` }));
    filters.status.forEach(statusItem => filterItems.push({ key: `status_${statusItem}`, label: `Status: ${statusItem}` }));
    return filterItems;
  }, [filters, departments]); // Use 'departments' state variable in dependency array
  
  const removeFilter = useCallback((key: string) => {
    if (key === 'search') setFilters(prev => ({ ...prev, search: '' }));
    else if (key === 'budget') setFilters(prev => ({ ...prev, budget: { min: null, max: null } }));
    else if (key === 'resources') setFilters(prev => ({ ...prev, resources: { min: null, max: null } }));
    else if (key === 'dates') setFilters(prev => ({ ...prev, dateRange: { start: null, end: null } }));
    else if (key.startsWith('dept_')) {
      const deptId = key.replace('dept_', '');
      setFilters(prev => ({ ...prev, departments: prev.departments.filter(id => id !== deptId) }));
    } else if (key.startsWith('tag_')) {
      const tag = key.replace('tag_', '');
      setFilters(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    } else if (key.startsWith('status_')) {
      const statusItem = key.replace('status_', '');
      setFilters(prev => ({ ...prev, status: prev.status.filter(s => s !== statusItem) }));
    }
    setPage(1);
  }, []);
  
  const handleSelectProject = useCallback((projectId: string) => {
    router.push(`/details/${projectId}`);
  }, [router]);
  
  const handleCreateProject = useCallback(() => {
    router.push('/projects/new');
  }, [router]);
  
  const handleImportProjects = useCallback(() => {
    router.push('/projects/import');
  }, [router]);
  
  const formatCurrency = useCallback((amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '-';
    return `$${amount.toLocaleString()}`;
  }, []);
  
  const formatNumber = useCallback((value: number | undefined | null) => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString();
  }, []);
  
  const formatDate = useCallback((dateString: string | undefined | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear().toString().substr(-2);
    return `${month} ${day} '${year}`;
  }, []);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    fetchProjects(filters, page, pageSize, true);
    queryClient.invalidateQueries({ queryKey: ['departments', user?.organizationId] });
  }, [fetchProjects, filters, page, pageSize, queryClient, user]);
  
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['departments', user.organizationId] });
    }
  }, [user, queryClient]);

  const contextValue = useMemo(() => ({
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    isLoading,
    projects,
    departments: departments || [], // Use 'departments' state variable here
    criteria, 
    resultsCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    activeFilters,
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
    refreshData,
    formatCurrency,
    formatDate,
    formatNumber
  }), [
    isFilterPanelOpen, isLoading, projects, departments, criteria, resultsCount, page, pageSize, filters, activeFilters, // Use 'departments' state variable here
    refreshData, handleSearchChange, handleDepartmentChange, handleBudgetChange, handleResourcesChange, 
    handleDateRangeChange, handleTagChange, handleStatusChange, handleClearFilters, removeFilter, 
    handleSelectProject, handleCreateProject, handleImportProjects, formatCurrency, formatDate, formatNumber, 
    setIsFilterPanelOpen, setPage, setPageSize
  ]);

  return (
    <ProjectSearchContext.Provider value={contextValue}>
      {children}
    </ProjectSearchContext.Provider>
  );
}

export function useProjectSearch() {
  const context = useContext(ProjectSearchContext);
  if (context === undefined) {
    throw new Error('useProjectSearch must be used within a ProjectSearchProvider');
  }
  return context;
}
