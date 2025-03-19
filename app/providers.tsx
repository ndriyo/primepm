'use client';

import { CriteriaProvider } from '@/app/contexts/CriteriaContext';
import { ProjectProvider } from '@/app/contexts/ProjectContext';

export default function Providers({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <CriteriaProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </CriteriaProvider>
  );
}
