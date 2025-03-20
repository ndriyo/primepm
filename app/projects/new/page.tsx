'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import ProjectEntryForm from '@/app/components/project-entry/ProjectEntryForm';

export default function NewProjectPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Submit New Project Proposal</h1>
        <ProjectEntryForm />
      </div>
    </PageLayout>
  );
}
