'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { ProjectInformation } from '@/app/components/project-details/ProjectInformation';
import { useParams } from 'next/navigation';

export default function ProjectInformationPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  return (
    <PageLayout>
      <ProjectInformation projectId={projectId} />
    </PageLayout>
  );
}
