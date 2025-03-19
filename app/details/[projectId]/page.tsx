'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { ProjectDetails } from '@/app/components/project-details/ProjectDetails';
import { useParams } from 'next/navigation';

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  return (
    <PageLayout>
      <ProjectDetails projectId={projectId} />
    </PageLayout>
  );
}
