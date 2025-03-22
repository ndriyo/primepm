'use client';

import { CriteriaProvider } from '@/app/contexts/CriteriaContext';
import { ProjectProvider } from '@/app/contexts/ProjectContext';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { DepartmentProvider } from '@/app/contexts/DepartmentContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function Providers({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Create a new QueryClient instance for each session
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DepartmentProvider>
          <CriteriaProvider>
            <ProjectProvider>
              {children}
            </ProjectProvider>
          </CriteriaProvider>
        </DepartmentProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
