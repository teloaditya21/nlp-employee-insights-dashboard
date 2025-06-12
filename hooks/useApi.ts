/**
 * @fileoverview Enhanced API hooks with better error handling and caching
 * @description Improved React Query hooks for API data fetching
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { ApiResponse, PaginatedApiResponse, ApiError } from '@/types';
import { QUERY_KEYS, CACHE_CONFIG } from '@/utils/constants';
import { employeeInsightsAPI } from '@/lib/api';

/**
 * Enhanced useQuery hook with better defaults and error handling
 */
export function useApiQuery<TData = unknown, TError = ApiError>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: CACHE_CONFIG.STALE_TIME,
    gcTime: CACHE_CONFIG.CACHE_TIME,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

/**
 * Enhanced useMutation hook with better error handling
 */
export function useApiMutation<TData = unknown, TVariables = void, TError = ApiError>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  return useMutation({
    mutationFn,
    ...options,
  });
}

/**
 * Hook for dashboard statistics
 */
export function useDashboardStats() {
  return useApiQuery(
    QUERY_KEYS.DASHBOARD_STATS,
    () => employeeInsightsAPI.getDashboardStats(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for dashboard stats
    }
  );
}

/**
 * Hook for all insights
 */
export function useAllInsights() {
  return useApiQuery(
    QUERY_KEYS.ALL_INSIGHTS,
    () => employeeInsightsAPI.getAllInsights()
  );
}

/**
 * Hook for top positive insights
 */
export function useTopPositiveInsights() {
  return useApiQuery(
    QUERY_KEYS.TOP_POSITIVE,
    () => employeeInsightsAPI.getTopPositiveInsights()
  );
}

/**
 * Hook for top negative insights
 */
export function useTopNegativeInsights() {
  return useApiQuery(
    QUERY_KEYS.TOP_NEGATIVE,
    () => employeeInsightsAPI.getTopNegativeInsights()
  );
}

/**
 * Hook for searching insights
 */
export function useSearchInsights(searchTerm: string, enabled: boolean = true) {
  return useApiQuery(
    QUERY_KEYS.SEARCH_INSIGHTS(searchTerm),
    () => employeeInsightsAPI.searchInsights(searchTerm),
    {
      enabled: enabled && searchTerm.length > 2,
      staleTime: 30 * 1000, // 30 seconds for search results
    }
  );
}

/**
 * Hook for paginated insights
 */
export function usePaginatedInsights(page: number = 1, limit: number = 10) {
  return useApiQuery(
    QUERY_KEYS.PAGINATED_INSIGHTS(page, limit),
    () => employeeInsightsAPI.getPaginatedInsights(page, limit)
  );
}

/**
 * Combined hook for dashboard data
 */
export function useDashboardData() {
  const dashboardStats = useDashboardStats();
  const allInsights = useAllInsights();
  const topPositive = useTopPositiveInsights();
  const topNegative = useTopNegativeInsights();

  const isLoading = dashboardStats.isLoading || allInsights.isLoading || topPositive.isLoading || topNegative.isLoading;
  const isError = dashboardStats.isError || allInsights.isError || topPositive.isError || topNegative.isError;
  const error = dashboardStats.error || allInsights.error || topPositive.error || topNegative.error;

  return {
    dashboard: dashboardStats,
    allInsights,
    topPositive,
    topNegative,
    isLoading,
    isError,
    error,
    refetchAll: () => {
      dashboardStats.refetch();
      allInsights.refetch();
      topPositive.refetch();
      topNegative.refetch();
    },
  };
}

/**
 * Hook for health check
 */
export function useHealthCheck() {
  return useApiQuery(
    QUERY_KEYS.HEALTH,
    () => employeeInsightsAPI.healthCheck(),
    {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchInterval: CACHE_CONFIG.BACKGROUND_REFETCH_INTERVAL,
    }
  );
}

/**
 * Hook for invalidating queries
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateInsights: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INSIGHTS });
    },
    invalidateDashboard: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
    },
    invalidateBookmarks: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKMARKS });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
    clearCache: () => {
      queryClient.clear();
    },
  };
}

/**
 * Hook for prefetching data
 */
export function usePrefetchData() {
  const queryClient = useQueryClient();

  return {
    prefetchDashboard: () => {
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.DASHBOARD_STATS,
        queryFn: () => employeeInsightsAPI.getDashboardStats(),
        staleTime: CACHE_CONFIG.STALE_TIME,
      });
    },
    prefetchInsights: () => {
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.ALL_INSIGHTS,
        queryFn: () => employeeInsightsAPI.getAllInsights(),
        staleTime: CACHE_CONFIG.STALE_TIME,
      });
    },
    prefetchNextPage: (currentPage: number, limit: number) => {
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.PAGINATED_INSIGHTS(currentPage + 1, limit),
        queryFn: () => employeeInsightsAPI.getPaginatedInsights(currentPage + 1, limit),
        staleTime: CACHE_CONFIG.STALE_TIME,
      });
    },
  };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdates() {
  const queryClient = useQueryClient();

  return {
    updateInsightOptimistically: (insightId: number, updates: Partial<any>) => {
      queryClient.setQueryData(QUERY_KEYS.ALL_INSIGHTS, (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((insight: any) =>
            insight.id === insightId ? { ...insight, ...updates } : insight
          ),
        };
      });
    },
    rollbackOptimisticUpdate: (queryKey: readonly unknown[]) => {
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Hook for background sync
 */
export function useBackgroundSync() {
  const { refetchAll } = useDashboardData();
  const { invalidateAll } = useInvalidateQueries();

  const syncData = async () => {
    try {
      await refetchAll();
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  };

  const forceSync = async () => {
    invalidateAll();
    await syncData();
  };

  return {
    syncData,
    forceSync,
  };
}

/**
 * Hook for query status monitoring
 */
export function useQueryStatus() {
  const dashboardStats = useDashboardStats();
  const allInsights = useAllInsights();

  const isAnyLoading = dashboardStats.isLoading || allInsights.isLoading;
  const isAnyError = dashboardStats.isError || allInsights.isError;
  const isAllSuccess = dashboardStats.isSuccess && allInsights.isSuccess;

  return {
    isAnyLoading,
    isAnyError,
    isAllSuccess,
    loadingQueries: [
      dashboardStats.isLoading && 'dashboard',
      allInsights.isLoading && 'insights',
    ].filter(Boolean),
    errorQueries: [
      dashboardStats.isError && 'dashboard',
      allInsights.isError && 'insights',
    ].filter(Boolean),
  };
}
