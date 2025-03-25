'use client';

import { PageLayout } from '@/app/_components/layout/PageLayout';
import { ProjectInformation } from '@/app/details/[projectId]/components/ProjectInformation';
import { useParams } from 'next/navigation';

export default function ProjectInformationPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  return (
    <PageLayout>
      {/* Directly use projectId from URL params with our optimized component */}
      <ProjectInformation projectId={projectId} />
    </PageLayout>
  );
}
