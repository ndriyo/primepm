'use client';

import { PageLayout } from '@/components/layout/PageLayout';
import { Dashboard } from '@/app/components/dashboard/Dashboard';

export default function HomePage() {
  return (
    <PageLayout>
      <Dashboard />
    </PageLayout>
  );
}
