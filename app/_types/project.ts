// Filter and search interfaces
export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface RangeFilter {
  min: number | null;
  max: number | null;
}

export interface FilterState {
  search: string;
  departments: string[];
  budget: RangeFilter;
  resources: RangeFilter;
  dateRange: DateRange;
  tags: string[];
  status: string[];
  // Removed criteriaScores as requested
}

// Project status options
export type ProjectStatus = 'initiation' | 'planning' | 'in-progress' | 'completed' | 'on-hold';

// Type for combobox items
export interface ComboboxItem {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  resources: number;
  startDate: string;
  endDate: string;
  status: string;
  department?: { id: string; name: string };
  departmentName?: string;
  departmentId?: string;
  tags: string[];
  criteria: Record<string, number>;
  score?: number; // Project score from database
}

export interface FilterItem {
  key: string;
  label: string;
}
