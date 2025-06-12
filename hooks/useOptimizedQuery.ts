'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { CURRENT_CONFIG } from '@/utils/constants';

// Optimized query configurations for different data types
export const QUERY_CONFIGS = {
  // Fast-changing data (user interactions, search results)
  DYNAMIC: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 1,
  },
  // Medium-changing data (dashboard stats, insights)
  SEMI_STATIC: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  },
  // Slow-changing data (settings, configurations)
  STATIC: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
  },
} as const;

// Optimized fetch function with request deduplication
const optimizedFetch = async (url: string, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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

// Hook for optimized employee insights queries
export const useOptimizedEmployeeInsights = (
  page: number,
  searchTerm: string,
  selectedKota: string,
  selectedSource: string,
  dateRange: any
) => {
  const queryKey = useMemo(() => [
    'employee-insights-paginated',
    page,
    searchTerm,
    selectedKota,
    selectedSource,
    dateRange?.from?.toISOString(),
    dateRange?.to?.toISOString(),
  ], [page, searchTerm, selectedKota, selectedSource, dateRange]);

  const queryFn = useCallback(async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
    });

    if (searchTerm) params.append('search', searchTerm);
    if (selectedKota !== 'all') params.append('kota', selectedKota);
    if (selectedSource !== 'all') params.append('source', selectedSource);
    if (dateRange?.from) params.append('dateFrom', dateRange.from.toISOString().split('T')[0]);
    if (dateRange?.to) params.append('dateTo', dateRange.to.toISOString().split('T')[0]);

    const url = `${CURRENT_CONFIG.API_BASE_URL}/api/employee-insights/paginated?${params.toString()}`;
    return optimizedFetch(url);
  }, [page, searchTerm, selectedKota, selectedSource, dateRange]);

  return useQuery({
    queryKey,
    queryFn,
    ...QUERY_CONFIGS.DYNAMIC,
    enabled: true,
  });
};

// Hook for optimized kota summary queries
export const useOptimizedKotaSummary = () => {
  const queryKey = useMemo(() => ['kota-summary'], []);

  const queryFn = useCallback(async () => {
    const url = `${CURRENT_CONFIG.API_BASE_URL}/api/kota-summary`;
    const data = await optimizedFetch(url);
    return data.data;
  }, []);

  return useQuery({
    queryKey,
    queryFn,
    ...QUERY_CONFIGS.STATIC,
  });
};

// Hook for optimized monthly trends queries
export const useOptimizedMonthlyTrends = () => {
  const queryKey = useMemo(() => ['monthly-trends'], []);

  const queryFn = useCallback(async () => {
    const url = `${CURRENT_CONFIG.API_BASE_URL}/api/employee-insights/monthly-trends`;
    return optimizedFetch(url);
  }, []);

  return useQuery({
    queryKey,
    queryFn,
    ...QUERY_CONFIGS.SEMI_STATIC,
  });
};

// Hook for optimized employee stats queries
export const useOptimizedEmployeeStats = () => {
  const queryKey = useMemo(() => ['employee-insights-stats'], []);

  const queryFn = useCallback(async () => {
    const url = `${CURRENT_CONFIG.API_BASE_URL}/api/employee-insights/stats`;
    return optimizedFetch(url);
  }, []);

  return useQuery({
    queryKey,
    queryFn,
    ...QUERY_CONFIGS.SEMI_STATIC,
  });
};

// Hook for optimized filter options queries
export const useOptimizedFilterOptions = (type: 'witel' | 'source') => {
  const queryKey = useMemo(() => [`${type}-options`], [type]);

  const queryFn = useCallback(async () => {
    const url = `${CURRENT_CONFIG.API_BASE_URL}/api/employee-insights/paginated?limit=1000`;
    const result = await optimizedFetch(url);
    
    if (type === 'witel') {
      return [...new Set(result.data.map((item: any) => item.witel).filter(Boolean))].sort();
    } else {
      return [...new Set(result.data.map((item: any) => item.sourceData).filter(Boolean))].sort();
    }
  }, [type]);

  return useQuery({
    queryKey,
    queryFn,
    ...QUERY_CONFIGS.STATIC,
  });
};
