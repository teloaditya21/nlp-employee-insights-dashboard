'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';

// Mobile-optimized query configurations
export const MOBILE_QUERY_CONFIGS = {
  // Fast-changing data optimized for mobile
  DYNAMIC: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 1, // Reduced retries for mobile
    networkMode: 'online' as const,
  },
  // Semi-static data for mobile
  SEMI_STATIC: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    networkMode: 'online' as const,
  },
  // Static data for mobile
  STATIC: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    networkMode: 'online' as const,
  },
} as const;

// Mobile-optimized fetch function with timeout
const mobileOptimizedFetch = async (url: string, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for mobile

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Hook for mobile top insights
export const useMobileTopInsights = () => {
  const queryKey = useMemo(() => ['mobile-top-insights'], []);

  const queryFn = useCallback(async () => {
    const url = 'https://employee-insights-api.adityalasika.workers.dev/api/insights/top-10';
    return mobileOptimizedFetch(url);
  }, []);

  return useQuery({
    queryKey,
    queryFn,
    ...MOBILE_QUERY_CONFIGS.SEMI_STATIC,
    select: (data) => data.data || [],
  });
};

// Hook for mobile insight details
export const useMobileInsightDetails = (word: string) => {
  const queryKey = useMemo(() => ['mobile-insight-details', word], [word]);

  const queryFn = useCallback(async () => {
    if (!word) return { data: [] };
    const url = `https://employee-insights-api.adityalasika.workers.dev/api/insights/details/${encodeURIComponent(word)}?limit=100`;
    return mobileOptimizedFetch(url);
  }, [word]);

  return useQuery({
    queryKey,
    queryFn,
    ...MOBILE_QUERY_CONFIGS.DYNAMIC,
    enabled: !!word,
    select: (data) => data.data || [],
  });
};

// Hook for mobile word cloud data
export const useMobileWordCloudData = () => {
  const queryKey = useMemo(() => ['mobile-word-cloud'], []);

  const queryFn = useCallback(async () => {
    const url = 'https://employee-insights-api.adityalasika.workers.dev/api/insights/top-10';
    const data = await mobileOptimizedFetch(url);
    
    // Transform data to word cloud format
    return data.data.map((insight: any) => ({
      tag: insight.word_insight,
      weight: insight.total_count,
      sentiment: insight.dominant_sentiment
    }));
  }, []);

  return useQuery({
    queryKey,
    queryFn,
    ...MOBILE_QUERY_CONFIGS.SEMI_STATIC,
  });
};
