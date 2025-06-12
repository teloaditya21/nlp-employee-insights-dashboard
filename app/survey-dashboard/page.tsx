'use client';

/**
 * @fileoverview Refactored Survey Dashboard page for Next.js
 * @description Enhanced survey dashboard with improved architecture and error handling
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ErrorBoundary } from "@/components/common";
import { useDashboardStats, useAllInsights, useFilters, useErrorHandler, usePageContext, useSearchInsights, useFilteredInsights } from "@/hooks";
import { FilterOptions, InsightData, SentimentType } from "@/types";
import { convertToInsightData, determineSentiment } from "@/utils/helpers";
import { formatNumber, formatPercentage } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown, CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

// Direct imports instead of lazy loading to avoid Suspense issues
import Header from "@/components/layout/header";
import AIConclusion from "@/components/AIConclusion";
import { SentimentCategoryCard } from "@/components/cards/insight-card";
import { SurveyDashboardSkeleton } from "@/components/skeletons";
import Chatbot from "@/components/dashboard/chatbot";

// UI components
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SurveyDashboard() {
  // Filter state - search term dan filter baru
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Prepare filters for API
  const apiFilters = useMemo(() => {
    const filters: any = {};

    if (dateRange?.from) {
      filters.dateFrom = dateRange.from.toISOString().split('T')[0];
      if (dateRange.to) {
        filters.dateTo = dateRange.to.toISOString().split('T')[0];
      } else {
        filters.dateTo = dateRange.from.toISOString().split('T')[0];
      }
    }

    if (debouncedSearchTerm) {
      filters.search = debouncedSearchTerm;
    }

    if (selectedSentiment !== 'all') {
      filters.sentiment = selectedSentiment;
    }

    return filters;
  }, [dateRange, debouncedSearchTerm, selectedSentiment]);

  // Determine if we should use filtered data
  const hasFilters = Boolean(dateRange?.from || debouncedSearchTerm || selectedSentiment !== 'all');

  // Fetch data menggunakan custom hooks
  const dashboard = useDashboardStats();
  const allInsights = useAllInsights();
  const filteredInsights = useFilteredInsights(apiFilters, hasFilters);

  // Use filtered data if filters are active, otherwise use all insights
  const currentInsights = hasFilters ? filteredInsights : allInsights;

  const isLoading = dashboard.isLoading || currentInsights.isLoading;
  const isError = dashboard.isError || currentInsights.isError;
  const error = dashboard.error || currentInsights.error;

  // Page context tracking hook
  const {
    pageContext,
    aiConclusion,
    isGeneratingAI,
    generateAIConclusion,
    trackPageData,
    error: pageContextError
  } = usePageContext('survey-dashboard');

  // Track page data changes when filters or data change (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dashboard.data?.data && currentInsights.data?.data) {
        try {
          const dashboardData = dashboard.data.data;
          const insightsData = currentInsights.data.data;

          // Calculate sentiment counts from current filtered data
          const filteredInsights = insightsData;
          const sentimentCounts = {
            positive: 0,
            negative: 0,
            neutral: 0
          };

          filteredInsights.forEach(insight => {
            const maxPercent = Math.max(
              insight.positif_percentage,
              insight.negatif_percentage,
              insight.netral_percentage
            );

            if (maxPercent === insight.positif_percentage && maxPercent > 0) {
              sentimentCounts.positive++;
            } else if (maxPercent === insight.negatif_percentage && maxPercent > 0) {
              sentimentCounts.negative++;
            } else {
              sentimentCounts.neutral++;
            }
          });

          // Get top keywords from current data
          const topKeywords = filteredInsights
            .slice(0, 10)
            .map(insight => insight.word_insight)
            .filter(keyword => typeof keyword === 'string');

          // Determine active filter descriptions for AI context
          const activeFilterDescriptions = [];
          if (debouncedSearchTerm.length > 0) {
            activeFilterDescriptions.push(`pencarian "${debouncedSearchTerm}"`);
          }
          if (selectedTopics.length > 0) {
            activeFilterDescriptions.push(`topik: ${selectedTopics.join(', ')}`);
          }
          if (selectedSentiment !== "all") {
            activeFilterDescriptions.push(`sentimen: ${selectedSentiment}`);
          }
          if (dateRange?.from) {
            const dateRangeText = dateRange.to
              ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
              : format(dateRange.from, "dd/MM/yyyy");
            activeFilterDescriptions.push(`periode: ${dateRangeText}`);
          }

          // Track the current page data with enhanced filter context
          trackPageData({
            filters: {
              search: debouncedSearchTerm,
              selectedTopics: selectedTopics,
              selectedSentiment: selectedSentiment,
              dateRange: dateRange?.from ? (dateRange.to
                ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                : format(dateRange.from, "dd/MM/yyyy")) : 'All Time',
              activeFilterDescriptions: activeFilterDescriptions
            },
            insights: filteredInsights,
            totalCount: filteredInsights.length,
            sentimentCounts,
            topKeywords
          });
        } catch (error) {
          console.error('Error tracking page data:', error);
        }
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [
    dashboard.data,
    currentInsights.data,
    debouncedSearchTerm,
    selectedTopics,
    selectedSentiment,
    dateRange,
    trackPageData
  ]);

  // Convert insights data ke format yang digunakan komponen
  const categories = useMemo(() => {
    const result = {
      positive: [] as InsightData[],
      negative: [] as InsightData[],
      neutral: [] as InsightData[],
    };

    // Use current insights (filtered or all) - API already handles date/search/sentiment filtering
    let insightsToProcess = currentInsights.data?.data || [];

    // Only apply topic filtering on frontend since API doesn't handle this yet
    if (selectedTopics.length > 0) {
      insightsToProcess = insightsToProcess.filter(insight =>
        selectedTopics.includes(insight.word_insight)
      );
    }

    insightsToProcess.forEach((insight) => {
      const convertedInsight = convertToInsightData(insight);

      // Tentukan dominant sentiment
      const maxPercent = Math.max(
        insight.positif_percentage,
        insight.negatif_percentage,
        insight.netral_percentage
      );

      let dominantSentiment = "neutral";
      if (maxPercent === insight.positif_percentage && maxPercent > 0) {
        dominantSentiment = "positive";
      } else if (maxPercent === insight.negatif_percentage && maxPercent > 0) {
        dominantSentiment = "negative";
      }

      // Note: Sentiment filtering is now handled by the API

      // Add to appropriate category berdasarkan dominant sentiment
      if (dominantSentiment === "positive") {
        result.positive.push(convertedInsight);
      } else if (dominantSentiment === "negative") {
        result.negative.push(convertedInsight);
      } else {
        result.neutral.push(convertedInsight);
      }
    });

    // Sort by views (total_count) descending
    result.positive.sort((a, b) => b.views - a.views);
    result.negative.sort((a, b) => b.views - a.views);
    result.neutral.sort((a, b) => b.views - a.views);

    return result;
  }, [currentInsights.data, selectedTopics]);

  // Handler for removing insights
  const handleRemoveInsight = (id: number) => {
    console.log(`Removing insight with ID: ${id}`);
    // In a real app, we would call an API and then invalidate the query
  };

  // Handler for pinning insights to My Insights
  const handlePinInsight = (insight: InsightData) => {
    // Get existing pinned insights from localStorage
    const existingPinnedString = localStorage.getItem('pinnedInsights');
    let pinnedInsights: InsightData[] = [];

    if (existingPinnedString) {
      try {
        pinnedInsights = JSON.parse(existingPinnedString);
      } catch (e) {
        console.error('Error parsing pinned insights from localStorage', e);
      }
    }

    // Check if insight is already pinned
    const isPinned = pinnedInsights.some(item => item.id === insight.id);

    if (isPinned) {
      // If already pinned, remove it
      pinnedInsights = pinnedInsights.filter(item => item.id !== insight.id);
    } else {
      // Otherwise, add it to pinned insights
      pinnedInsights.push(insight);
    }

    // Save back to localStorage
    localStorage.setItem('pinnedInsights', JSON.stringify(pinnedInsights));
  };

  // Search handler with proper debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  // Get unique topics untuk filter checkbox
  const uniqueTopics = useMemo(() => {
    const allTopics = currentInsights.data?.data || [];
    const topics = allTopics.map(insight => insight.word_insight);
    return Array.from(new Set(topics)).sort();
  }, [currentInsights.data]);

  // Handler untuk topic filter
  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  // Handler untuk sentiment filter
  const handleSentimentChange = (sentiment: string) => {
    setSelectedSentiment(sentiment);
  };

  // Handler untuk clear all filters
  const handleClearFilters = () => {
    setSelectedTopics([]);
    setSelectedSentiment("all");
    setSearchTerm("");
    setDateRange(undefined);
  };

  // Date range handlers
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setIsDatePickerOpen(false);
  };

  const setPresetRange = (preset: 'week' | 'month' | 'quarter') => {
    const now = new Date();
    const from = new Date();

    switch (preset) {
      case 'week':
        from.setDate(now.getDate() - 7);
        break;
      case 'month':
        from.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        from.setMonth(now.getMonth() - 3);
        break;
    }

    setDateRange({ from, to: now });
    setIsDatePickerOpen(false);
  };

  const clearDateRange = () => {
    setDateRange(undefined);
  };

  // Loading state
  if (isLoading) {
    return <SurveyDashboardSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex-1 overflow-x-hidden">
        <Header title="Survey Dashboard" showFilters={false} />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error Loading Data</h3>
            <p className="text-red-600 text-sm mt-1">
              {error?.message || 'Gagal memuat data. Silakan coba lagi.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dashboardData = dashboard.data?.data;
  const totalInsights = categories.positive.length + categories.negative.length + categories.neutral.length;

  return (
    <div className="flex-1 overflow-x-hidden">
      <Header
        title="Survey Dashboard"
        totalInsights={dashboardData?.total_insights || 0}
        showFilters={false}
      />

      <div className="p-6">
        {/* AI Instant Conclusion */}
        <AIConclusion
          conclusion={aiConclusion}
          isGenerating={isGeneratingAI}
          onGenerate={() => {
            try {
              generateAIConclusion();
            } catch (error) {
              console.error('Error generating AI conclusion:', error);
            }
          }}
          currentPage="survey-dashboard"
          className="mb-6"
        />

        {/* Page Context Error */}
        {pageContextError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="text-yellow-800 font-medium">Page Context Warning</h4>
            <p className="text-yellow-600 text-sm mt-1">
              {pageContextError}
            </p>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-[12px] p-4 mb-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Cari insights... (contoh: wellness, gaji, fasilitas, program mentoring)"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* All Witel Filter */}
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 px-3 text-sm border-gray-300 bg-white hover:bg-gray-50 min-w-[120px] justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Filter className="h-3 w-3 text-gray-400" />
                        <span>All Witel</span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">Pilih Topics</h4>
                        <button
                          onClick={() => setSelectedTopics([])}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {uniqueTopics.map((topic) => (
                          <div key={topic} className="flex items-center space-x-2">
                            <Checkbox
                              id={topic}
                              checked={selectedTopics.includes(topic)}
                              onCheckedChange={() => handleTopicToggle(topic)}
                            />
                            <label
                              htmlFor={topic}
                              className="text-sm text-gray-700 cursor-pointer flex-1"
                            >
                              {topic}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* All Sources Filter */}
              <div className="relative">
                <Select value={selectedSentiment} onValueChange={handleSentimentChange}>
                  <SelectTrigger className="h-9 px-3 text-sm border-gray-300 bg-white hover:bg-gray-50 min-w-[130px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3 text-gray-400" />
                      <SelectValue placeholder="All Sources" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="positive">Positif</SelectItem>
                    <SelectItem value="negative">Negatif</SelectItem>
                    <SelectItem value="neutral">Netral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="relative">
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 px-3 text-sm border-gray-300 bg-white hover:bg-gray-50 min-w-[160px] justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3 text-gray-400" />
                        <span>
                          {dateRange?.from ? (
                            dateRange.to ? (
                              `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}`
                            ) : (
                              format(dateRange.from, "dd/MM/yy")
                            )
                          ) : (
                            "Select date range"
                          )}
                        </span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 border-b">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPresetRange('week')}
                        >
                          7 Hari
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPresetRange('month')}
                        >
                          30 Hari
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPresetRange('quarter')}
                        >
                          90 Hari
                        </Button>
                      </div>
                    </div>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                    />
                    {dateRange?.from && (
                      <div className="p-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearDateRange}
                          className="w-full"
                        >
                          Clear Date Range
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Clear All Filters Button */}
          {(selectedTopics.length > 0 || selectedSentiment !== "all" || searchTerm || dateRange?.from) && (
            <div className="mt-3 flex justify-end">
              <Button
                onClick={handleClearFilters}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 text-xs"
              >
                Clear all filters
              </Button>
            </div>
          )}

          {/* Search Results Info */}
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              {currentInsights?.data ? (
                Array.isArray(currentInsights.data.data) && currentInsights.data.data.length > 0 ? (
                  <span className="text-green-600">
                    ✓ Ditemukan {currentInsights.data.data.length} topics untuk "{searchTerm}"
                  </span>
                ) : (
                  <span className="text-orange-600">
                    ⚠ Tidak ada topics yang ditemukan untuk "{searchTerm}"
                  </span>
                )
              ) : (
                <span className="text-blue-600">🔍 Mencari topics...</span>
              )}
            </div>
          )}

          {/* Filter Status Info */}
          {!searchTerm && (selectedTopics.length > 0 || selectedSentiment !== "all" || dateRange?.from) && (
            <div className="mt-3 text-sm text-blue-600">
              🔽 Filter aktif:
              {selectedTopics.length > 0 && ` ${selectedTopics.length} topics dipilih`}
              {selectedSentiment !== "all" && ` • Sentimen: ${selectedSentiment}`}
              {dateRange?.from && ` • Periode: ${dateRange.to
                ? `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}`
                : format(dateRange.from, "dd/MM/yyyy")}`}
            </div>
          )}

          {/* Show all topics hint when not searching or filtering */}
          {!searchTerm && selectedTopics.length === 0 && selectedSentiment === "all" && !dateRange?.from && (
            <div className="mt-3 text-sm text-gray-500">
              💡 Menampilkan semua {dashboardData?.total_insights || 0} topics. Gunakan pencarian atau filter untuk results spesifik.
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-[12px] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <h4 className="text-sm font-medium text-gray-600">
              {(selectedTopics.length > 0 || selectedSentiment !== "all" || searchTerm || dateRange?.from)
                ? "Filtered Topics" : "Total Topics"}
            </h4>
            <p className="text-2xl font-bold text-gray-900">
              {(selectedTopics.length > 0 || selectedSentiment !== "all" || searchTerm || dateRange?.from)
                ? totalInsights : (dashboardData?.total_insights || 0)}
            </p>
          </div>
          <div className="bg-white rounded-[12px] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <h4 className="text-sm font-medium text-gray-600">
              {(selectedTopics.length > 0 || selectedSentiment !== "all" || searchTerm || dateRange?.from)
                ? "Filtered Feedback" : "Total Feedback"}
            </h4>
            <p className="text-2xl font-bold text-gray-900">
              {(selectedTopics.length > 0 || selectedSentiment !== "all" || searchTerm || dateRange?.from)
                ? (categories.positive.reduce((sum, item) => sum + item.views, 0) +
                   categories.negative.reduce((sum, item) => sum + item.views, 0) +
                   categories.neutral.reduce((sum, item) => sum + item.views, 0))
                : (dashboardData?.total_feedback || 0)}
            </p>
          </div>
          <div className="bg-white rounded-[12px] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <h4 className="text-sm font-medium text-gray-600">Sentiment Positif</h4>
            <p className="text-2xl font-bold text-green-600">
              {totalInsights > 0
                ? ((categories.positive.length / totalInsights) * 100).toFixed(1)
                : (dashboardData?.positive_ratio.toFixed(1) || 0)}%
            </p>
          </div>
          <div className="bg-white rounded-[12px] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <h4 className="text-sm font-medium text-gray-600">Sentiment Negatif</h4>
            <p className="text-2xl font-bold text-red-600">
              {totalInsights > 0
                ? ((categories.negative.length / totalInsights) * 100).toFixed(1)
                : (dashboardData?.negative_ratio.toFixed(1) || 0)}%
            </p>
          </div>
        </div>

        {/* Sentiment Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <SentimentCategoryCard
            title="Netral"
            badge={categories.neutral.length}
            type="neutral"
            insights={categories.neutral}
            onRemoveInsight={handleRemoveInsight}
            onPinInsight={handlePinInsight}
            dateRange={dateRange}
          />

          <SentimentCategoryCard
            title="Negatif"
            badge={categories.negative.length}
            type="negative"
            insights={categories.negative}
            onRemoveInsight={handleRemoveInsight}
            onPinInsight={handlePinInsight}
            dateRange={dateRange}
          />

          <SentimentCategoryCard
            title="Positif"
            badge={categories.positive.length}
            type="positive"
            insights={categories.positive}
            onRemoveInsight={handleRemoveInsight}
            onPinInsight={handlePinInsight}
            dateRange={dateRange}
          />
        </div>

        {/* Informasi jumlah data */}
        <div className="text-center text-gray-500 text-sm mt-4 mb-6">
          {searchTerm ? (
            <>
              Menampilkan {totalInsights} topics dari hasil pencarian "{searchTerm}"
              {totalInsights === 0 && (
                <div className="mt-2 text-orange-600">
                  Coba kata kunci lain seperti: wellness, gaji, fasilitas, training, promosi
                </div>
              )}
            </>
          ) : selectedTopics.length > 0 || selectedSentiment !== "all" ? (
            <>
              Menampilkan {totalInsights} topics dari filter yang aktif
              {selectedTopics.length > 0 && (
                <div className="mt-1 text-blue-600">
                  📋 {selectedTopics.length} topics dipilih: {selectedTopics.slice(0, 3).join(", ")}
                  {selectedTopics.length > 3 && ` dan ${selectedTopics.length - 3} lainnya`}
                </div>
              )}
              {selectedSentiment !== "all" && (
                <div className="mt-1 text-blue-600">
                  😊 Sentiment filter: {selectedSentiment}
                </div>
              )}
              {totalInsights === 0 && (
                <div className="mt-2 text-orange-600">
                  Tidak ada topics yang sesuai dengan filter. Coba ubah kriteria filter.
                </div>
              )}
            </>
          ) : (
            `Menampilkan semua ${dashboardData?.total_insights || 0} topics dari database`
          )}
        </div>

        {/* Show chat bot */}
        <div className="mt-8">
          <Chatbot />
        </div>
      </div>
    </div>
  );
}
