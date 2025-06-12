'use client';

import { lazy, Suspense } from 'react';

// Lazy load heavy components for better mobile performance
export const LazyMobileWordCloud = lazy(() => 
  import('../MobileWordCloud').then(module => ({
    default: module.default
  }))
);

export const LazyMobileTopInsights = lazy(() => 
  import('../MobileTopInsights').then(module => ({
    default: module.default
  }))
);

// Wrapper components with proper suspense boundaries optimized for mobile
export const MobileWordCloudWithSuspense = (props: any) => (
  <Suspense fallback={
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-teal-50">
        <h3 className="text-lg font-bold text-gray-900">🔥 Trending Topics</h3>
      </div>
      <div className="p-6 flex items-center justify-center h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading word cloud...</p>
        </div>
      </div>
    </div>
  }>
    <LazyMobileWordCloud {...props} />
  </Suspense>
);

export const MobileTopInsightsWithSuspense = (props: any) => (
  <Suspense fallback={
    <div className="bg-white">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Trending Insights</h2>
        <p className="text-sm text-gray-500">What's happening in Telkom employee</p>
      </div>
      <div className="divide-y divide-gray-100">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="p-4 animate-pulse">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  }>
    <LazyMobileTopInsights {...props} />
  </Suspense>
);
