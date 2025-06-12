'use client';

import { memo, Suspense } from 'react';
import { ErrorBoundary } from '@/components/common';

// Optimized layout wrapper with error boundaries and suspense
const OptimizedLayout = memo(({ 
  children, 
  fallback = <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
});

OptimizedLayout.displayName = 'OptimizedLayout';

export default OptimizedLayout;
