/**
 * @fileoverview Refactored Survey Dashboard page
 * @description Enhanced survey dashboard with improved architecture and error handling
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ErrorBoundary } from "@/components/common";
import { useDashboardStats, useAllInsights, useFilters, useErrorHandler, usePageContext, useSearchInsights } from "@/hooks";
import { FilterOptions, InsightData, SentimentType } from "@/types";
import { convertToInsightData, determineSentiment } from "@/utils/helpers";
import { formatNumber, formatPercentage } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown } from "lucide-react";

// Direct imports instead of lazy loading to avoid Suspense issues
import Header from "@/components/layout/header";
import AIConclusion from "@/components/AIConclusion";
import { SentimentCategoryCard } from "@/components/cards/insight-card";
import { SurveyDashboardSkeleton } from "@/components/skeletons";
import Chatbot from "@/components/dashboard/chatbot";

// UI components
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Fungsi untuk menghasilkan teks AI conclusion berdasarkan statistik
function generateAIConclusionText(stats: any): string {
  if (!stats) {
    return "Belum ada data yang tersedia untuk dianalisis.";
  }

  const positivePercent = Math.round(stats.positive_ratio);
  const negativePercent = Math.round(stats.negative_ratio);
  const neutralPercent = Math.round(stats.neutral_ratio);

  // Identifikasi sentiment dominan
  let dominantSentiment = "netral";
  let dominantPercent = neutralPercent;

  if (positivePercent > negativePercent && positivePercent > neutralPercent) {
    dominantSentiment = "positif";
    dominantPercent = positivePercent;
  } else if (negativePercent > positivePercent && negativePercent > neutralPercent) {
    dominantSentiment = "negatif";
    dominantPercent = negativePercent;
  }

  // Top positive insights
  const topPositiveInsights = stats.top_positive_insights?.slice(0, 3) || [];
  const topPositiveText = topPositiveInsights.map((insight: any) =>
    `${insight.word_insight} (${insight.positif_percentage}%)`
  ).join(", ");

  // Top negative insights
  const topNegativeInsights = stats.top_negative_insights?.slice(0, 3) || [];
  const topNegativeText = topNegativeInsights.map((insight: any) =>
    `${insight.word_insight} (${insight.negatif_percentage}%)`
  ).join(", ");

  return `
    Dari total ${stats.total_insights} kategori insight dengan ${stats.total_feedback} feedback karyawan, sentimen yang dominan adalah ${dominantSentiment} (${dominantPercent}%).
    Terdapat ${stats.sentiment_distribution.positive} feedback positif (${positivePercent}%), ${stats.sentiment_distribution.negative} feedback negatif (${negativePercent}%), dan ${stats.sentiment_distribution.neutral} feedback netral (${neutralPercent}%).

    ${topPositiveText ? `Area dengan sentimen paling positif: ${topPositiveText}.` : ''}

    ${topNegativeText ? `Area yang memerlukan perhatian: ${topNegativeText}.` : ''}

    Hasil analisis ini menunjukkan bahwa sentimen karyawan secara umum ${dominantSentiment}, dengan beberapa area yang perlu mendapat fokus perbaikan segera.
  `;
}

export default function SurveyDashboard() {
  // Filter state - search term dan filter baru
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");

  // Fetch data menggunakan custom hooks
  const dashboard = useDashboardStats();
  const allInsights = useAllInsights();
  const isLoading = dashboard.isLoading || allInsights.isLoading;
  const isError = dashboard.isError || allInsights.isError;
  const error = dashboard.error || allInsights.error;

  // Page context tracking hook
  const {
    pageContext,
    aiConclusion,
    isGeneratingAI,
    generateAIConclusion,
    trackPageData,
    error: pageContextError
  } = usePageContext('survey-dashboard');

  // Search insights (hanya jika ada search term)
  const { data: searchResults } = useSearchInsights(searchTerm, searchTerm.length > 2);

  // Track page data changes when filters or data change (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dashboard.data?.data && allInsights.data?.data) {
        try {
          const dashboardData = dashboard.data.data;
          const insightsData = allInsights.data.data;

          // Calculate sentiment counts from current filtered data
          const filteredInsights = searchResults?.data || insightsData;
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
          if (searchTerm.length > 0) {
            activeFilterDescriptions.push(`pencarian "${searchTerm}"`);
          }
          if (selectedTopics.length > 0) {
            activeFilterDescriptions.push(`topik: ${selectedTopics.join(', ')}`);
          }
          if (selectedSentiment !== "all") {
            activeFilterDescriptions.push(`sentimen: ${selectedSentiment}`);
          }

          // Track the current page data with enhanced filter context
          trackPageData({
            filters: {
              search: searchTerm,
              selectedTopics: selectedTopics,
              selectedSentiment: selectedSentiment,
              dateRange: 'All Time',
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
    allInsights.data,
    searchResults,
    searchTerm,
    selectedTopics,
    selectedSentiment,
    trackPageData
  ]);

  // Convert insights data ke format yang digunakan komponen
  const categories = useMemo(() => {
    const result = {
      positive: [] as InsightData[],
      negative: [] as InsightData[],
      neutral: [] as InsightData[],
    };

    // Gunakan search results jika ada, otherwise gunakan all insights
    let insightsToProcess = searchResults?.data || allInsights.data?.data || [];

    // Filter berdasarkan selected topics jika ada yang dipilih
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

      // Filter berdasarkan selected sentiment
      if (selectedSentiment !== "all" && dominantSentiment !== selectedSentiment) {
        return; // Skip jika tidak sesuai filter sentimen
      }

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
  }, [allInsights.data, searchResults, selectedTopics, selectedSentiment]);

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

  // Search handler
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Get unique topics untuk filter checkbox
  const uniqueTopics = useMemo(() => {
    const allTopics = allInsights.data?.data || [];
    const topics = allTopics.map(insight => insight.word_insight);
    return Array.from(new Set(topics)).sort();
  }, [allInsights.data]);

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

        {/* Legacy AI Conclusion (fallback) */}
        {!aiConclusion && (
          <div className="bg-white rounded-[12px] p-6 mb-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">AI Insight Analysis (Legacy)</h3>
            <p className="text-gray-600 leading-relaxed">
              {generateAIConclusionText(dashboardData)}
            </p>
          </div>
        )}

        {/* Page Context Error */}
        {pageContextError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="text-yellow-800 font-medium">Page Context Warning</h4>
            <p className="text-yellow-600 text-sm mt-1">
              {pageContextError}
            </p>
          </div>
        )}

        {/* Search Topics Control dengan Filter */}
        <div className="bg-white rounded-[12px] p-4 mb-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Cari topics... (contoh: wellness, gaji, fasilitas, program mentoring)"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter All Topics dengan Checkbox */}
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto min-w-[180px] justify-between bg-white border-gray-300 rounded-lg shadow-sm px-4 py-2"
                  >
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">
                        All Topics {selectedTopics.length > 0 && `(${selectedTopics.length})`}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
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

            {/* Filter Sentimen */}
            <div className="relative">
              <Select value={selectedSentiment} onValueChange={handleSentimentChange}>
                <SelectTrigger className="w-full sm:w-auto min-w-[140px] bg-white border-gray-300 rounded-lg shadow-sm px-4 py-2">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Sentimen" className="text-sm" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="positive">Positif</SelectItem>
                  <SelectItem value="negative">Negatif</SelectItem>
                  <SelectItem value="neutral">Netral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear All Filters Button */}
            {(selectedTopics.length > 0 || selectedSentiment !== "all" || searchTerm) && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="w-full sm:w-auto px-4 py-2 text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Reset All
              </Button>
            )}
          </div>

          {/* Search Results Info */}
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              {searchResults?.data ? (
                searchResults.data.length > 0 ? (
                  <span className="text-green-600">
                    ✓ Ditemukan {searchResults.data.length} topics untuk "{searchTerm}"
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
          {!searchTerm && (selectedTopics.length > 0 || selectedSentiment !== "all") && (
            <div className="mt-3 text-sm text-blue-600">
              🔽 Filter aktif:
              {selectedTopics.length > 0 && ` ${selectedTopics.length} topics dipilih`}
              {selectedSentiment !== "all" && ` • Sentimen: ${selectedSentiment}`}
            </div>
          )}

          {/* Show all topics hint when not searching or filtering */}
          {!searchTerm && selectedTopics.length === 0 && selectedSentiment === "all" && (
            <div className="mt-3 text-sm text-gray-500">
              💡 Menampilkan semua {dashboardData?.total_insights || 0} topics. Gunakan pencarian atau filter untuk results spesifik.
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-[12px] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <h4 className="text-sm font-medium text-gray-600">Total Topics</h4>
            <p className="text-2xl font-bold text-gray-900">{dashboardData?.total_insights || 0}</p>
          </div>
          <div className="bg-white rounded-[12px] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <h4 className="text-sm font-medium text-gray-600">Total Feedback</h4>
            <p className="text-2xl font-bold text-gray-900">{dashboardData?.total_feedback || 0}</p>
          </div>
          <div className="bg-white rounded-[12px] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <h4 className="text-sm font-medium text-gray-600">Sentiment Positif</h4>
            <p className="text-2xl font-bold text-green-600">{dashboardData?.positive_ratio.toFixed(1) || 0}%</p>
          </div>
          <div className="bg-white rounded-[12px] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <h4 className="text-sm font-medium text-gray-600">Sentiment Negatif</h4>
            <p className="text-2xl font-bold text-red-600">{dashboardData?.negative_ratio.toFixed(1) || 0}%</p>
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
          />

          <SentimentCategoryCard
            title="Negatif"
            badge={categories.negative.length}
            type="negative"
            insights={categories.negative}
            onRemoveInsight={handleRemoveInsight}
            onPinInsight={handlePinInsight}
          />

          <SentimentCategoryCard
            title="Positif"
            badge={categories.positive.length}
            type="positive"
            insights={categories.positive}
            onRemoveInsight={handleRemoveInsight}
            onPinInsight={handlePinInsight}
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