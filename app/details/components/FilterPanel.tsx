'use client';

import { useState } from 'react';
import { useProjectSearch } from '@/app/_contexts/ProjectSearchContext';
import { ProjectStatus } from '@/app/_types/project';

export function FilterPanel() {
  const { 
    isFilterPanelOpen,
    filters,
    departments,
    handleDepartmentChange,
    handleBudgetChange,
    handleResourcesChange,
    handleDateRangeChange,
    handleStatusChange
  } = useProjectSearch();
  
  // States for combobox dropdowns
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  
  // Project status options
  const statusOptions: ProjectStatus[] = ['initiation', 'planning', 'in-progress', 'completed', 'on-hold'];
  
  // Filter departments based on search
  const filteredDepartments = deptSearchQuery 
    ? departments.filter(dept => 
        dept.name.toLowerCase().includes(deptSearchQuery.toLowerCase()))
    : departments;
  
  if (!isFilterPanelOpen) {
    return null;
  }
  
  // Format a value with thousand separator
  const formatWithCommas = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    // Add thousand separators
    return numericValue ? parseInt(numericValue).toLocaleString() : '';
  };
  
  // Parse formatted number to get numeric value
  const parseFormattedNumber = (formattedValue: string) => {
    const numericValue = formattedValue.replace(/[^0-9]/g, '');
    return numericValue ? parseInt(numericValue) : null;
  };
  
  return (
    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Department Combobox */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Departments</h3>
        <div className="relative">
          <div className="border border-gray-300 rounded-md shadow-sm p-1">
            {/* Selected departments display */}
            <div className="flex flex-wrap gap-1 mb-1">
              {filters.departments.map(deptId => {
                const dept = departments.find(d => d.id === deptId);
                return dept ? (
                  <span key={dept.id} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {dept.name}
                    <button
                      type="button"
                      className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                      onClick={() => handleDepartmentChange(dept.id, false)}
                    >
                      <span className="sr-only">Remove</span>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ) : null;
              })}
            </div>
            
            {/* Search input */}
            <div className="flex items-center">
              <input
                type="text"
                className="block w-full border-0 p-1.5 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                placeholder="Search departments..."
                value={deptSearchQuery}
                onChange={(e) => setDeptSearchQuery(e.target.value)}
                onFocus={() => setDepartmentDropdownOpen(true)}
              />
              <button
                type="button"
                className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
              >
                <svg className={`h-5 w-5 transform ${departmentDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Department dropdown */}
          {departmentDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map(dept => (
                  <div
                    key={dept.id}
                    onClick={() => {
                      handleDepartmentChange(dept.id, !filters.departments.includes(dept.id));
                      // Don't close dropdown when selecting to allow multiple selections
                    }}
                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                      filters.departments.includes(dept.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className={`block truncate ${filters.departments.includes(dept.id) ? 'font-semibold' : 'font-normal'}`}>
                      {dept.name}
                    </span>
                    {filters.departments.includes(dept.id) && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-2 px-4 text-sm text-gray-500">
                  No departments found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Filter - Combobox */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
        <div className="relative">
          <div className="border border-gray-300 rounded-md shadow-sm p-1">
            {/* Selected statuses display */}
            <div className="flex flex-wrap gap-1 mb-1">
              {filters.status.map(status => (
                <span key={status} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {status}
                  <button
                    type="button"
                    className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                    onClick={() => handleStatusChange(status, false)}
                  >
                    <span className="sr-only">Remove</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            
            {/* Status select button */}
            <button
              type="button"
              className="inline-flex justify-between w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            >
              <span>Select status</span>
              <svg className={`h-5 w-5 transform ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Status dropdown */}
          {statusDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
              {statusOptions.map(status => (
                <div
                  key={status}
                  onClick={() => {
                    handleStatusChange(status, !filters.status.includes(status));
                    // Don't close dropdown when selecting to allow multiple selections
                  }}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                    filters.status.includes(status) ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className={`block truncate capitalize ${filters.status.includes(status) ? 'font-semibold' : 'font-normal'}`}>
                    {status}
                  </span>
                  {filters.status.includes(status) && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
            
      {/* Budget Range Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Budget Range</h3>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">$</span>
            <input
              type="text"
              placeholder="Min"
              className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
              value={filters.budget.min ? formatWithCommas(filters.budget.min.toString()) : ''}
              onChange={(e) => {
                const formattedValue = formatWithCommas(e.target.value);
                const numericValue = parseFormattedNumber(e.target.value);
                e.target.value = formattedValue;
                handleBudgetChange(numericValue, filters.budget.max);
              }}
            />
          </div>
          <span>to</span>
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">$</span>
            <input
              type="text"
              placeholder="Max"
              className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
              value={filters.budget.max ? formatWithCommas(filters.budget.max.toString()) : ''}
              onChange={(e) => {
                const formattedValue = formatWithCommas(e.target.value);
                const numericValue = parseFormattedNumber(e.target.value);
                e.target.value = formattedValue;
                handleBudgetChange(filters.budget.min, numericValue);
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Resources Range Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Resources (mandays)</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Min"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            value={filters.resources.min ? formatWithCommas(filters.resources.min.toString()) : ''}
            onChange={(e) => {
              const formattedValue = formatWithCommas(e.target.value);
              const numericValue = parseFormattedNumber(e.target.value);
              e.target.value = formattedValue;
              handleResourcesChange(numericValue, filters.resources.max);
            }}
          />
          <span>to</span>
          <input
            type="text"
            placeholder="Max"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            value={filters.resources.max ? formatWithCommas(filters.resources.max.toString()) : ''}
            onChange={(e) => {
              const formattedValue = formatWithCommas(e.target.value);
              const numericValue = parseFormattedNumber(e.target.value);
              e.target.value = formattedValue;
              handleResourcesChange(filters.resources.min, numericValue);
            }}
          />
        </div>
      </div>
      
      {/* Date Range Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Date Range</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="start-date" className="block text-xs text-gray-500">Start Date</label>
            <input
              id="start-date"
              type="date"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
              value={filters.dateRange.start || ''}
              onChange={(e) => handleDateRangeChange(e.target.value || null, filters.dateRange.end)}
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-xs text-gray-500">End Date</label>
            <input
              id="end-date"
              type="date"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
              value={filters.dateRange.end || ''}
              onChange={(e) => handleDateRangeChange(filters.dateRange.start, e.target.value || null)}
            />
          </div>
        </div>
      </div>
      
      {/* Removed Criteria Filters section */}
    </div>
  );
}
