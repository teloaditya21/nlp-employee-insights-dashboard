'use client';

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown, CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import visualization components
import TopInsightsChart from "@/components/charts/top-insights-chart";
import WordCloudVisualization from "@/components/charts/word-cloud";
import SentimentTrendChart from "@/components/charts/sentiment-trend-chart";
import GeographicDistribution from "@/components/charts/geographic-distribution";

interface TopInsightsVisualizationProps {
  insights: any[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  selectedTopics: string[];
  onTopicToggle: (topic: string) => void;
  selectedSentiment: string;
  onSentimentChange: (sentiment: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onClearFilters: () => void;
  uniqueTopics: string[];
  isDatePickerOpen: boolean;
  setIsDatePickerOpen: (open: boolean) => void;
  setPresetRange: (preset: 'week' | 'month' | 'quarter') => void;
  clearDateRange: () => void;
}

export default function TopInsightsVisualization({
  insights,
  searchTerm,
  onSearchChange,
  onClearSearch,
  selectedTopics,
  onTopicToggle,
  selectedSentiment,
  onSentimentChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  uniqueTopics,
  isDatePickerOpen,
  setIsDatePickerOpen,
  setPresetRange,
  clearDateRange,
}: TopInsightsVisualizationProps) {
  
  // Process insights data for visualizations
  const processedData = useMemo(() => {
    let filteredInsights = insights;

    // Apply topic filtering on frontend since API doesn't handle this yet
    if (selectedTopics.length > 0) {
      filteredInsights = filteredInsights.filter(insight =>
        selectedTopics.includes(insight.word_insight)
      );
    }

    // Prepare data for different visualizations
    const topInsights = filteredInsights
      .slice(0, 10)
      .map(insight => ({
        name: insight.word_insight,
        value: insight.total_count,
        positive: insight.positif_percentage,
        negative: insight.negatif_percentage,
        neutral: insight.netral_percentage,
      }));

    const wordCloudData = filteredInsights
      .slice(0, 50)
      .map(insight => ({
        text: insight.word_insight,
        value: insight.total_count,
        sentiment: (Math.max(insight.positif_percentage, insight.negatif_percentage, insight.netral_percentage) === insight.positif_percentage ? 'positive' :
                  Math.max(insight.positif_percentage, insight.negatif_percentage, insight.netral_percentage) === insight.negatif_percentage ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral'
      }));

    const sentimentData = filteredInsights.map(insight => ({
      name: insight.word_insight,
      positive: insight.positif_percentage,
      negative: insight.negatif_percentage,
      neutral: insight.netral_percentage,
      total: insight.total_count,
    }));

    return {
      topInsights,
      wordCloudData,
      sentimentData,
      totalInsights: filteredInsights.length,
    };
  }, [insights, selectedTopics]);

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-white rounded-[12px] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Cari insights... (contoh: wellness, gaji, fasilitas, program mentoring)"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={onClearSearch}
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
            {/* Topics Filter */}
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
                        onClick={() => selectedTopics.forEach(topic => onTopicToggle(topic))}
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
                            onCheckedChange={() => onTopicToggle(topic)}
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

            {/* Sentiment Filter */}
            <div className="relative">
              <Select value={selectedSentiment} onValueChange={onSentimentChange}>
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
                    onSelect={onDateRangeChange}
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
              onClick={onClearFilters}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Insights Chart */}
        <div className="bg-white rounded-[12px] p-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-semibold mb-4">Top 10 Insights</h3>
          <TopInsightsChart data={processedData.topInsights} />
        </div>

        {/* Word Cloud */}
        <div className="bg-white rounded-[12px] p-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-semibold mb-4">Word Cloud</h3>
          <WordCloudVisualization data={processedData.wordCloudData} />
        </div>

        {/* Sentiment Trend */}
        <div className="bg-white rounded-[12px] p-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
          <SentimentTrendChart data={processedData.sentimentData} />
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-[12px] p-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
          <GeographicDistribution data={processedData.sentimentData} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-[12px] p-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{processedData.totalInsights}</div>
            <div className="text-sm text-gray-600">Total Insights</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {processedData.sentimentData.filter(d => d.positive > d.negative && d.positive > d.neutral).length}
            </div>
            <div className="text-sm text-gray-600">Positive Insights</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {processedData.sentimentData.filter(d => d.negative > d.positive && d.negative > d.neutral).length}
            </div>
            <div className="text-sm text-gray-600">Negative Insights</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {processedData.sentimentData.filter(d => d.neutral >= d.positive && d.neutral >= d.negative).length}
            </div>
            <div className="text-sm text-gray-600">Neutral Insights</div>
          </div>
        </div>
      </div>
    </div>
  );
}
