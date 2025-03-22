'use client';

import { useState, useEffect, ReactNode } from 'react';
import { LoadingWrapper } from './LoadingWrapper';

interface DelayedSkeletonWrapperProps {
  isLoading: boolean;
  delay?: number; // milliseconds
  skeleton: ReactNode;
  children: ReactNode;
}

export const DelayedSkeletonWrapper = ({
  isLoading,
  delay = 300,
  skeleton,
  children
}: DelayedSkeletonWrapperProps) => {
  const [showSkeleton, setShowSkeleton] = useState(false);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isLoading) {
      timeout = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      setShowSkeleton(false);
    }
    
    return () => {
      clearTimeout(timeout);
    };
  }, [isLoading, delay]);
  
  return (
    <LoadingWrapper
      isLoading={isLoading && showSkeleton}
      skeleton={skeleton}
    >
      {children}
    </LoadingWrapper>
  );
};
