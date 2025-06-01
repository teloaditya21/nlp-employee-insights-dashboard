/**
 * @fileoverview Refactored Smart Analytics page
 * @description Enhanced smart analytics page with improved architecture and data visualization
 */

import React, { useMemo, useCallback, Suspense } from "react";
import { ErrorBoundary, Loading } from "@/components/common";
import { useFilters, useErrorHandler, usePagination } from "@/hooks";
import { FilterOptions, EmployeeInsight } from "@/types";
import { formatNumber, formatEmployeeName, formatDate } from "@/utils/formatters";
import { useQuery } from "@tanstack/react-query";
import { insightsService } from "@/services";

// Lazy load components
const Header = React.lazy(() => import("@/components/layout/header"));
const AIConclusion = React.lazy(() => import("@/components/AIConclusion"));
const Chatbot = React.lazy(() => import("@/components/dashboard/chatbot"));

// Sub-components
import { AnalyticsFilters, AnalyticsCharts, AnalyticsTable, AnalyticsStats } from "./components";

/**
 * Enhanced Smart Analytics Component
 */
const SmartAnalytics: React.FC = () => {
  // Enhanced filter management
  const {
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useFilters({
    persistFilters: true,
    storageKey: 'smart-analytics-filters',
  });

  // Enhanced pagination
  const {
    page,
    pageSize,
    setPage,
    setPageSize,
    totalPages,
    startItem,
    endItem,
  } = usePagination({
    initialPage: 1,
    initialPageSize: 25,
    onPageChange: (newPage) => console.log('Page changed to:', newPage),
  });

  // Enhanced error handling
  const {
    setError: setCustomError,
    clearError,
    retry,
    canRetry,
  } = useErrorHandler({
    maxRetries: 3,
    showToast: true,
  });

  // Fetch employee insights with filters and pagination
  const {
    data: insightsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['smart-analytics-insights', page, pageSize, filters],
    queryFn: async () => {
      const filterParams = {
        page,
        limit: pageSize,
        search: filters.search,
        witel: filters.witel,
        source: filters.source,
        sentiment: filters.sentiment !== 'all' ? filters.sentiment : undefined,
        dateFrom: filters.dateRange?.from?.toISOString(),
        dateTo: filters.dateRange?.to?.toISOString(),
      };

      return insightsService.getEmployeeInsights(filterParams);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true,
  });

  // Fetch analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics-data', filters],
    queryFn: () => insightsService.getInsightsAnalytics('month'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch employee insights statistics
  const { data: statsData } = useQuery({
    queryKey: ['employee-insights-stats', filters],
    queryFn: async () => {
      const filterParams = {
        witel: filters.witel,
        source: filters.source,
        dateFrom: filters.dateRange?.from?.toISOString(),
        dateTo: filters.dateRange?.to?.toISOString(),
      };

      return insightsService.getEmployeeInsightsStats(filterParams);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Process insights data for table
  const processedTableData = useMemo(() => {
    if (!insightsData?.data) {
      return {
        insights: [],
        totalCount: 0,
      };
    }

    const insights = insightsData.data.map((item: any) => ({
      id: item.id,
      witel: item.witel || item.kota || 'Unknown',
      source: item.source || 'Unknown',
      employee: formatEmployeeName(item.employee_name || 'Unknown'),
      sentiment: item.sentimen,
      insight: item.sentence_insight || item.word_insight,
      date: formatDate(item.created_at, 'SHORT'),
      rawDate: item.created_at,
    }));

    return {
      insights,
      totalCount: insightsData.total || 0,
    };
  }, [insightsData]);

  // Process analytics data for charts
  const processedAnalyticsData = useMemo(() => {
    if (!analyticsData?.data) {
      return {
        timeSeriesData: [],
        sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
        topSources: [],
        topLocations: [],
        totalInsights: 0,
      };
    }

    return analyticsData.data;
  }, [analyticsData]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, [setFilters, setPage]);

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, [setPage]);

  // Handle page size changes
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  }, [setPageSize, setPage]);

  // Error state with retry option
  if (error) {
    return (
      <div className="flex-1 overflow-x-hidden">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-red-800 font-medium text-lg mb-2">Error Loading Smart Analytics</h3>
            <p className="text-red-600 mb-4">
              {error?.message || 'Failed to load analytics data. Please try again.'}
            </p>
            <div className="space-x-3">
              {canRetry && (
                <button
                  onClick={retry}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !insightsData) {
    return (
      <div className="flex-1 overflow-x-hidden">
        <Loading
          variant="spinner"
          text="Loading smart analytics..."
          className="min-h-screen"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex-1 overflow-x-hidden">
        <Suspense fallback={<Loading variant="spinner" />}>
          <Header
            title="Smart Analytics"
            totalInsights={processedTableData.totalCount}
            showFilters={false}
          />
        </Suspense>

        <div className="p-6 space-y-6">
          {/* AI Conclusion */}
          <Suspense fallback={<Loading variant="pulse" className="h-32" />}>
            <AIConclusion
              currentPage="smart-analytics"
              autoGenerate={true}
              className="mb-6"
            />
          </Suspense>

          {/* Filter Panel */}
          <AnalyticsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            totalResults={processedTableData.totalCount}
            isLoading={isLoading}
          />

          {/* Statistics Overview */}
          {statsData?.data && (
            <AnalyticsStats
              data={statsData.data}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
            />
          )}

          {/* Charts Section */}
          <Suspense fallback={<Loading variant="skeleton" className="h-96" />}>
            <AnalyticsCharts
              analyticsData={processedAnalyticsData}
              isLoading={isLoading || !analyticsData}
            />
          </Suspense>

          {/* Data Table */}
          <AnalyticsTable
            insights={processedTableData.insights}
            isLoading={isLoading}
            pagination={{
              currentPage: page,
              pageSize,
              totalItems: processedTableData.totalCount,
              totalPages: Math.ceil(processedTableData.totalCount / pageSize),
              onPageChange: handlePageChange,
              onPageSizeChange: handlePageSizeChange,
            }}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Chatbot */}
          <Suspense fallback={null}>
            <Chatbot />
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SmartAnalytics;
