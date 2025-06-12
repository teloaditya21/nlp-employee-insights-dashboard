'use client';

import { lazy, Suspense } from 'react';
import { TopInsightsSkeleton, SmartAnalyticsSkeleton, SettingsSkeleton } from '@/components/skeletons';

// Lazy load heavy components for better performance
export const LazyAmChartsWordCloud = lazy(() => 
  import('@/components/dashboard/amcharts-word-cloud').then(module => ({
    default: module.default
  }))
);

export const LazyIndonesiaMap = lazy(() => 
  import('@/components/dashboard/indonesia-map').then(module => ({
    default: module.default
  }))
);

export const LazyChatbot = lazy(() => 
  import('@/components/dashboard/chatbot').then(module => ({
    default: module.default
  }))
);

export const LazyTopInsightsVisualization = lazy(() => 
  import('@/components/top-insights/top-insights-visualization').then(module => ({
    default: module.default
  }))
);

export const LazySmartAnalyticsVisualization = lazy(() => 
  import('@/components/smart-analytics/smart-analytics-visualization').then(module => ({
    default: module.default
  }))
);

// Wrapper components with proper suspense boundaries
export const AmChartsWordCloudWithSuspense = (props: any) => (
  <Suspense fallback={<div className="w-full h-[320px] bg-gray-100 animate-pulse rounded-lg" />}>
    <LazyAmChartsWordCloud {...props} />
  </Suspense>
);

export const IndonesiaMapWithSuspense = (props: any) => (
  <Suspense fallback={<div className="w-full h-[320px] bg-gray-100 animate-pulse rounded-lg" />}>
    <LazyIndonesiaMap {...props} />
  </Suspense>
);

export const ChatbotWithSuspense = (props: any) => (
  <Suspense fallback={<div className="w-16 h-16 bg-blue-100 rounded-full animate-pulse fixed bottom-6 right-6" />}>
    <LazyChatbot {...props} />
  </Suspense>
);

export const TopInsightsVisualizationWithSuspense = (props: any) => (
  <Suspense fallback={<TopInsightsSkeleton />}>
    <LazyTopInsightsVisualization {...props} />
  </Suspense>
);

export const SmartAnalyticsVisualizationWithSuspense = (props: any) => (
  <Suspense fallback={<SmartAnalyticsSkeleton />}>
    <LazySmartAnalyticsVisualization {...props} />
  </Suspense>
);
