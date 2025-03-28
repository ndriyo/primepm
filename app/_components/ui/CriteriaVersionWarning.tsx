'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/app/_contexts/AuthContext";

interface CriteriaVersionWarningProps {
  redirectUrl?: string;
  customMessage?: string;
}

export function CriteriaVersionWarning({ 
  redirectUrl = "/criteria", 
  customMessage 
}: CriteriaVersionWarningProps) {
  const [hasActiveVersion, setHasActiveVersion] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { organization, user } = useAuth();

  useEffect(() => {
    async function checkActiveVersion() {
      if (!organization?.id || !user?.id) return;
      
      try {
        const response = await fetch(`/api/criteria/versions/active`, {
          headers: {
            "x-organization-id": organization.id,
            "x-user-id": user.id,
            "x-user-role": user.role
          }
        });
        setHasActiveVersion(response.ok);
      } catch (error) {
        console.error("Error checking active criteria version:", error);
        setHasActiveVersion(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkActiveVersion();
  }, [organization, user]);

  if (isLoading || hasActiveVersion) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">
            {customMessage || "No active criteria version found. Projects require criteria for evaluation."}
          </p>
          <div className="mt-2">
            <a 
              href={redirectUrl} 
              className="text-sm font-medium text-amber-800 underline hover:text-amber-700"
            >
              Go to criteria management
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
