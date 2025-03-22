'use client';

import { ReactNode } from 'react';

interface LoadingWrapperProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}

export const LoadingWrapper = ({ 
  isLoading, 
  skeleton, 
  children 
}: LoadingWrapperProps) => {
  return isLoading ? skeleton : children;
};
