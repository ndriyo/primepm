'use client';

import { PageLayout } from '@/app/_components/layout/PageLayout';
import { Dashboard } from '@/app/_components/dashboard/Dashboard';

export default function HomePage() {
  return (
    <PageLayout>
      <Dashboard />
    </PageLayout>
  );
}
