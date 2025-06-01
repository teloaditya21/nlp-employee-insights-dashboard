import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { employeeInsightsAPI, DashboardStats, InsightSummary, ApiResponse, PaginatedResponse } from '@/lib/api';

// Query keys
export const QUERY_KEYS = {
  dashboard: ['employee-insights', 'dashboard'],
  allInsights: ['employee-insights', 'all'],
  topPositive: ['employee-insights', 'top-positive'],
  topNegative: ['employee-insights', 'top-negative'],
  search: (term: string) => ['employee-insights', 'search', term],
  paginated: (page: number, limit: number) => ['employee-insights', 'paginated', page, limit],
  health: ['employee-insights', 'health'],
} as const;

// Hook untuk dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => employeeInsightsAPI.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook untuk semua insights
export function useAllInsights() {
  return useQuery({
    queryKey: QUERY_KEYS.allInsights,
    queryFn: () => employeeInsightsAPI.getAllInsights(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
}

// Hook untuk top positive insights
export function useTopPositiveInsights() {
  return useQuery({
    queryKey: QUERY_KEYS.topPositive,
    queryFn: () => employeeInsightsAPI.getTopPositiveInsights(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
}

// Hook untuk top negative insights
export function useTopNegativeInsights() {
  return useQuery({
    queryKey: QUERY_KEYS.topNegative,
    queryFn: () => employeeInsightsAPI.getTopNegativeInsights(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
}

// Hook untuk search insights
export function useSearchInsights(searchTerm: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.search(searchTerm),
    queryFn: () => employeeInsightsAPI.searchInsights(searchTerm),
    enabled: enabled && searchTerm.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}

// Hook untuk paginated insights
export function usePaginatedInsights(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.paginated(page, limit),
    queryFn: () => employeeInsightsAPI.getPaginatedInsights(page, limit),
    staleTime: 3 * 60 * 1000,
    gcTime: 8 * 60 * 1000,
    retry: 3,
    placeholderData: (previousData) => previousData, // Keep previous page data while loading new page
  });
}

// Hook untuk health check
export function useHealthCheck() {
  return useQuery({
    queryKey: QUERY_KEYS.health,
    queryFn: () => employeeInsightsAPI.healthCheck(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
    retry: 1,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}



// Utility function untuk convert InsightSummary ke format yang digunakan komponen
export function convertToInsightData(insight: InsightSummary) {
  return {
    id: insight.id,
    title: insight.word_insight,
    positivePercentage: insight.positif_percentage,
    negativePercentage: insight.negatif_percentage,
    neutralPercentage: insight.netral_percentage,
    views: insight.total_count,
    comments: 0, // Default value since API doesn't provide this
  };
} 