import Header from "@/components/layout/header";
import { SentimentCategoryCard, InsightData } from "@/components/cards/insight-card";
import Chatbot from "@/components/dashboard/chatbot";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronDown, Filter, CalendarIcon } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useBookmarkedInsights, useBookmarkOperations } from "@/hooks/useBookmarks";
import { BookmarkedInsight } from "@/lib/bookmarkApi";
import { MyInsightsSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to convert BookmarkedInsight to InsightData
function convertBookmarkedToInsightData(bookmark: BookmarkedInsight): InsightData {
  return {
    id: bookmark.insight_id,
    title: bookmark.insight_title,
    neutralPercentage: bookmark.netral_percentage || 0,
    negativePercentage: bookmark.negatif_percentage || 0,
    positivePercentage: bookmark.positif_percentage || 0,
    views: bookmark.total_count || 0,
    comments: 0, // Not available in bookmark data
  };
}

export default function MyInsights() {
  // Get bookmarked insights from API
  const { data: bookmarkedInsights = [], isLoading, error } = useBookmarkedInsights();

  // Bookmark operations
  const { removeBookmark, isRemovingBookmark } = useBookmarkOperations();

  // State untuk search dan filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Debounce search term to prevent excessive filtering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Get unique topics dari bookmarked insights untuk filter
  const uniqueTopics = useMemo(() => {
    const topics = bookmarkedInsights.map(bookmark => bookmark.insight_title);
    return Array.from(new Set(topics)).sort();
  }, [bookmarkedInsights]);

  // Convert bookmarked insights to categorized insights dengan filtering
  const pinnedInsights = useMemo(() => {
    const categorized = {
      neutral: [] as InsightData[],
      negative: [] as InsightData[],
      positive: [] as InsightData[]
    };

    // Filter bookmarked insights berdasarkan search dan filter
    let filteredBookmarks = bookmarkedInsights;

    // Note: For My Insights, we filter by bookmarked_at date (when user bookmarked it)
    // This is different from Survey Dashboard which filters by insight creation date
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0); // Set to start of day

      const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
      toDate.setHours(23, 59, 59, 999); // Set to end of day

      filteredBookmarks = filteredBookmarks.filter(bookmark => {
        if (!bookmark.bookmarked_at) return false;
        const bookmarkDate = new Date(bookmark.bookmarked_at);
        return bookmarkDate >= fromDate && bookmarkDate <= toDate;
      });
    }

    // Filter berdasarkan search term (using debounced search)
    if (debouncedSearchTerm.length > 0) {
      filteredBookmarks = filteredBookmarks.filter(bookmark =>
        bookmark.insight_title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter berdasarkan selected topics
    if (selectedTopics.length > 0) {
      filteredBookmarks = filteredBookmarks.filter(bookmark =>
        selectedTopics.includes(bookmark.insight_title)
      );
    }

    filteredBookmarks.forEach(bookmark => {
      const insight = convertBookmarkedToInsightData(bookmark);
      const { neutralPercentage, negativePercentage, positivePercentage } = insight;

      // Tentukan sentimen dominan
      let dominantSentiment = "neutral";
      const maxPercent = Math.max(neutralPercentage, negativePercentage, positivePercentage);

      if (maxPercent === positivePercentage && maxPercent > 0) {
        dominantSentiment = "positive";
      } else if (maxPercent === negativePercentage && maxPercent > 0) {
        dominantSentiment = "negative";
      }

      // Filter berdasarkan selected sentiment
      if (selectedSentiment !== "all" && dominantSentiment !== selectedSentiment) {
        return; // Skip jika tidak sesuai filter sentimen
      }

      // Add to appropriate category
      if (dominantSentiment === "positive") {
        categorized.positive.push(insight);
      } else if (dominantSentiment === "negative") {
        categorized.negative.push(insight);
      } else {
        categorized.neutral.push(insight);
      }
    });

    // Sort by views descending
    categorized.positive.sort((a, b) => b.views - a.views);
    categorized.negative.sort((a, b) => b.views - a.views);
    categorized.neutral.sort((a, b) => b.views - a.views);

    return categorized;
  }, [bookmarkedInsights, debouncedSearchTerm, selectedTopics, selectedSentiment, dateRange]);

  // Search handler with proper debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

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

  // Calculate total insights untuk display
  const totalInsights = pinnedInsights.positive.length + pinnedInsights.negative.length + pinnedInsights.neutral.length;

  const handleRemoveInsight = (id: number) => {
    // Find the bookmark to remove
    const bookmarkToRemove = bookmarkedInsights.find(bookmark => bookmark.insight_id === id);

    if (bookmarkToRemove) {
      // Remove bookmark from database and update UI
      removeBookmark({
        insightId: bookmarkToRemove.insight_id,
        insightTitle: bookmarkToRemove.insight_title
      });
    }
  };

  if (isLoading) {
    return <MyInsightsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex-1 overflow-x-hidden">
        <Header title="My Insights" />
        <div className="p-6">
          <div className="bg-white rounded-[12px] p-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <h2 className="text-lg font-semibold text-red-600 mb-3">Error Loading Bookmarks</h2>
            <p className="text-gray-600">
              Unable to load your bookmarked insights. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-hidden">
      <Header
        title="My Insights"
        totalInsights={bookmarkedInsights.length}
        showFilters={false}
      />

      <div className="p-6">
        <div className="bg-white rounded-[12px] p-6 mb-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">My Bookmarked Insights</h2>
            <span className="text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1 rounded-full">
              {bookmarkedInsights.length} Saved
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            Berikut adalah insight yang telah Anda bookmark dari berbagai survei dan feedback. Insight ini telah ditandai sebagai penting untuk ditindaklanjuti dan dipantau. Insight dikategorikan berdasarkan sentimen untuk membantu melacak kemajuan dan mengidentifikasi area yang memerlukan perhatian.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-[12px] p-4 mb-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Cari bookmarked insights..."
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
              {totalInsights > 0 ? (
                <span className="text-green-600">
                  ✓ Ditemukan {totalInsights} bookmarked insights untuk "{searchTerm}"
                </span>
              ) : (
                <span className="text-orange-600">
                  ⚠ Tidak ada bookmarked insights yang ditemukan untuk "{searchTerm}"
                </span>
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

          {/* Show all bookmarks hint when not searching or filtering */}
          {!searchTerm && selectedTopics.length === 0 && selectedSentiment === "all" && !dateRange?.from && (
            <div className="mt-3 text-sm text-gray-500">
              💡 Menampilkan semua {bookmarkedInsights.length} bookmarked insights. Gunakan pencarian atau filter untuk results spesifik.
            </div>
          )}
        </div>

        {/* Informasi jumlah data */}
        <div className="text-center text-gray-500 text-sm mb-6">
          {searchTerm ? (
            <>
              Menampilkan {totalInsights} bookmarked insights dari hasil pencarian "{searchTerm}"
              {totalInsights === 0 && (
                <div className="mt-2 text-orange-600">
                  Coba kata kunci lain atau hapus filter yang aktif
                </div>
              )}
            </>
          ) : selectedTopics.length > 0 || selectedSentiment !== "all" || dateRange?.from ? (
            <>
              Menampilkan {totalInsights} bookmarked insights dari filter yang aktif
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
              {dateRange?.from && (
                <div className="mt-1 text-blue-600">
                  📅 Periode: {dateRange.to
                    ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                    : format(dateRange.from, "dd/MM/yyyy")}
                </div>
              )}
              {totalInsights === 0 && (
                <div className="mt-2 text-orange-600">
                  Tidak ada bookmarked insights yang sesuai dengan filter. Coba ubah kriteria filter.
                </div>
              )}
            </>
          ) : (
            `Menampilkan semua ${bookmarkedInsights.length} bookmarked insights`
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SentimentCategoryCard
            title="Netral"
            badge={pinnedInsights.neutral.length}
            type="neutral"
            insights={pinnedInsights.neutral}
            onRemoveInsight={handleRemoveInsight}
            dateRange={dateRange}
            // No onPinInsight prop - we don't want bookmark button in My Insights
          />

          <SentimentCategoryCard
            title="Negatif"
            badge={pinnedInsights.negative.length}
            type="negative"
            insights={pinnedInsights.negative}
            onRemoveInsight={handleRemoveInsight}
            dateRange={dateRange}
            // No onPinInsight prop - we don't want bookmark button in My Insights
          />

          <SentimentCategoryCard
            title="Positif"
            badge={pinnedInsights.positive.length}
            type="positive"
            insights={pinnedInsights.positive}
            onRemoveInsight={handleRemoveInsight}
            dateRange={dateRange}
            // No onPinInsight prop - we don't want bookmark button in My Insights
          />
        </div>
      </div>

      <Chatbot />
    </div>
  );
}
