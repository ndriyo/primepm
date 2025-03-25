'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Department } from '@/app/_repositories';

interface DepartmentContextType {
  departments: Department[];
  loading: boolean;
  error: string | null;
  refreshDepartments: () => Promise<void>;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, organization } = useAuth();

  const fetchDepartments = useCallback(async () => {
    if (!organization || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const headers: HeadersInit = {
        'x-organization-id': organization.id,
        'x-user-id': user.id,
        'x-user-role': user.role,
      };
      
      const response = await fetch('/api/departments', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [organization, user]);

  // Load departments when the context is initialized
  useEffect(() => {
    if (organization && user) {
      fetchDepartments();
    }
  }, [organization, user, fetchDepartments]);

  // Function to manually refresh departments
  const refreshDepartments = async () => {
    await fetchDepartments();
  };

  return (
    <DepartmentContext.Provider
      value={{
        departments,
        loading,
        error,
        refreshDepartments
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

export const useDepartments = () => {
  const context = useContext(DepartmentContext);
  
  if (context === undefined) {
    throw new Error('useDepartments must be used within a DepartmentProvider');
  }
  
  return context;
};
