'use client';

import { useState, useEffect, Suspense } from "react";
import { PageLayout } from "@/app/_components/layout/PageLayout";
import ProjectEntryForm from "@/app/projects/new/components/ProjectEntryForm";
import { LoadingWrapper } from "@/app/_components/ui/LoadingWrapper";
import { SkeletonProjectForm } from "@/app/_components/ui/skeleton";
import { CriteriaVersionWarning } from "@/app/_components/ui/CriteriaVersionWarning";

export default function NewProjectPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <CriteriaVersionWarning customMessage="Active criteria version required: Without an active criteria version, you cannot create or update projects." />
        <Suspense fallback={<SkeletonProjectForm />}>
          <LoadingWrapper
            isLoading={isLoading}
            skeleton={<SkeletonProjectForm />}
          >
            <ProjectEntryForm />
          </LoadingWrapper>
        </Suspense>
      </div>
    </PageLayout>
  );
}
