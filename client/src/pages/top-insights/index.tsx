/**
 * @fileoverview Refactored Top Insights page
 * @description Enhanced top insights page with improved architecture and data visualization
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
const AmChartsWordCloud = React.lazy(() => import("@/components/dashboard/amcharts-word-cloud"));
const IndonesiaMap = React.lazy(() => import("@/components/dashboard/indonesia-map"));

// Sub-components
import { TopInsightsFilters, TopInsightsTable, TopInsightsCharts } from "./components";

/**
 * Enhanced Top Insights Component
 */
const TopInsights: React.FC = () => {
  // Enhanced filter management
  const {
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useFilters({
    persistFilters: true,
    storageKey: 'top-insights-filters',
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
    initialPageSize: 10,
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
    queryKey: ['employee-insights', page, pageSize, filters],
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

  // Fetch word cloud data
  const { data: wordCloudData } = useQuery({
    queryKey: ['word-cloud', filters],
    queryFn: () => insightsService.getWordCloudData(50),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process insights data
  const processedData = useMemo(() => {
    if (!insightsData?.data) {
      return {
        insights: [],
        totalCount: 0,
        sentimentCounts: { positive: 0, negative: 0, neutral: 0 },
        topKeywords: [],
      };
    }

    const insights = insightsData.data.map((item: any) => ({
      id: item.id,
      location: item.witel || item.kota || 'Unknown',
      source: item.source || 'Unknown',
      employee: formatEmployeeName(item.employee_name || 'Unknown'),
      sentiment: item.sentimen,
      insight: item.sentence_insight || item.word_insight,
      date: formatDate(item.created_at, 'SHORT'),
      rawDate: item.created_at,
    }));

    // Calculate sentiment counts
    const sentimentCounts = insights.reduce(
      (acc, insight) => {
        acc[insight.sentiment as keyof typeof acc]++;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    // Extract top keywords
    const topKeywords = insights
      .map(insight => insight.insight.split(' '))
      .flat()
      .filter(word => word.length > 3)
      .slice(0, 10);

    return {
      insights,
      totalCount: insightsData.total || 0,
      sentimentCounts,
      topKeywords,
    };
  }, [insightsData]);

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

  // Update pagination total pages when data changes
  React.useEffect(() => {
    if (insightsData?.pagination) {
      // Update pagination state based on API response
      const { total_pages } = insightsData.pagination;
      // Note: This would need to be implemented in the pagination hook
      console.log('Total pages:', total_pages);
    }
  }, [insightsData]);

  // Error state with retry option
  if (error) {
    return (
      <div className="flex-1 overflow-x-hidden">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-red-800 font-medium text-lg mb-2">Error Loading Top Insights</h3>
            <p className="text-red-600 mb-4">
              {error?.message || 'Failed to load insights data. Please try again.'}
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
          text="Loading top insights..."
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
            title="Top Insights"
            totalInsights={processedData.totalCount}
            showFilters={false}
          />
        </Suspense>

        <div className="p-6 space-y-6">
          {/* AI Conclusion */}
          <Suspense fallback={<Loading variant="pulse" className="h-32" />}>
            <AIConclusion
              currentPage="top-insights"
              autoGenerate={true}
              className="mb-6"
            />
          </Suspense>

          {/* Filter Panel */}
          <TopInsightsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            totalResults={processedData.totalCount}
            isLoading={isLoading}
            sentimentCounts={processedData.sentimentCounts}
          />

          {/* Charts Section */}
          <Suspense fallback={<Loading variant="skeleton" className="h-64" />}>
            <TopInsightsCharts
              wordCloudData={wordCloudData?.data}
              mapData={processedData.insights}
              isLoading={isLoading}
            />
          </Suspense>

          {/* Data Table */}
          <TopInsightsTable
            insights={processedData.insights}
            isLoading={isLoading}
            pagination={{
              currentPage: page,
              pageSize,
              totalItems: processedData.totalCount,
              totalPages: Math.ceil(processedData.totalCount / pageSize),
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

export default TopInsights;
