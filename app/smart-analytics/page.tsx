'use client';

import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { usePageContext } from "@/hooks/usePageContext";
import AIConclusion from "@/components/AIConclusion";
import { SmartAnalyticsSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { ChevronDown, Filter, Calendar, X } from "lucide-react";
import {
  useOptimizedEmployeeInsights,
  useOptimizedMonthlyTrends,
  useOptimizedEmployeeStats,
  useOptimizedFilterOptions
} from "@/hooks/useOptimizedQuery";
import { useOptimizedSearch } from "@/hooks/useOptimizedDebounce";
import { ChatbotWithSuspense } from "@/components/performance/LazyComponents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AnalyticsData {
  totalEmployees: number;
  totalInsights: number;
  totalNegative: number;
  totalPositive: number;
  monthlyData: Array<{
    name: string;
    positive: number;
    negative: number;
    neutral: number;
  }>;
  pieData: Array<{
    name: string;
    value: number;
  }>;
  trendInsights: Array<{
    id: number;
    city: string;
    source: string;
    employee: string;
    sentiment: string;
    date: string;
  }>;
}

export default function SmartAnalytics() {
  // Optimized state management
  const [selectedWitel, setSelectedWitel] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Optimized search with debouncing
  const {
    searchTerm,
    debouncedSearchTerm,
    handleSearchChange,
    handleClearSearch
  } = useOptimizedSearch('', 500);

  // Page context tracking hook
  const {
    pageContext,
    aiConclusion,
    isGeneratingAI,
    generateAIConclusion,
    trackPageData,
    error: pageContextError
  } = usePageContext('smart-analytics');

  // Default date range (last 30 days)
  const today = new Date();
  const defaultDateRange = {
    from: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
    to: today
  };

  // Optimized data fetching with custom hooks
  const { data: monthlyTrendsData, isLoading: isLoadingTrends } = useOptimizedMonthlyTrends();
  const { data: employeeInsightsResponse, isLoading: isLoadingInsights } = useOptimizedEmployeeInsights(
    page,
    debouncedSearchTerm,
    selectedWitel,
    selectedSource,
    dateRange
  );
  const { data: employeeStats, isLoading: isLoadingStats } = useOptimizedEmployeeStats();
  const { data: witelOptions } = useOptimizedFilterOptions('witel');
  const { data: sourceOptions } = useOptimizedFilterOptions('source');

  // Extract data dan total count untuk paginasi
  const employeeInsightsData = employeeInsightsResponse?.data || [];
  const totalInsights = employeeInsightsResponse?.total || 0;
  const totalPages = Math.ceil(totalInsights / pageSize);

  const COLORS = ["#00B894", "#FF7675", "#FDCB6E"];

  // Optimized filter handlers with useCallback
  const handleWitelChange = useCallback((value: string) => {
    setSelectedWitel(value);
    setPage(1);
  }, []);

  const handleSourceChange = useCallback((value: string) => {
    setSelectedSource(value);
    setPage(1);
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    handleClearSearch();
    setSelectedWitel("all");
    setSelectedSource("all");
    setDateRange(undefined);
    setPage(1);
  }, [handleClearSearch]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() =>
    debouncedSearchTerm || selectedWitel !== "all" || selectedSource !== "all" || dateRange,
    [debouncedSearchTerm, selectedWitel, selectedSource, dateRange]
  );

  // Track page data untuk AI conclusion ketika data atau filter berubah
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (employeeInsightsData && employeeStats?.data) {
        try {
          // Calculate sentiment counts dari current filtered data
          const sentimentCounts = {
            positive: employeeStats.data.positiveCount || 0,
            negative: employeeStats.data.negativeCount || 0,
            neutral: employeeStats.data.neutralCount || 0
          };

          // Extract top keywords dari insights
          const topKeywords = employeeInsightsData
            .map((insight: any) => insight.sentenceInsight || insight.wordInsight || insight.sentimen || '')
            .filter((text: string) => text.length > 0)
            .slice(0, 10);

          // Determine active filter descriptions for AI context
          const activeFilterDescriptions = [];
          if (searchTerm.length > 0) {
            activeFilterDescriptions.push(`pencarian "${searchTerm}"`);
          }
          if (selectedWitel !== "all") {
            activeFilterDescriptions.push(`witel: ${selectedWitel}`);
          }
          if (selectedSource !== "all") {
            activeFilterDescriptions.push(`sumber: ${selectedSource}`);
          }
          if (dateRange) {
            const fromDate = dateRange.from ? dateRange.from.toLocaleDateString('id-ID') : '';
            const toDate = dateRange.to ? dateRange.to.toLocaleDateString('id-ID') : '';
            if (fromDate && toDate) {
              activeFilterDescriptions.push(`periode: ${fromDate} - ${toDate}`);
            }
          }

          // Format date range for display
          let dateRangeDisplay = 'All Time';
          if (dateRange?.from && dateRange?.to) {
            dateRangeDisplay = `${dateRange.from.toLocaleDateString('id-ID')} - ${dateRange.to.toLocaleDateString('id-ID')}`;
          }

          // Track the current page data with enhanced filter context
          trackPageData({
            filters: {
              search: searchTerm,
              witel: selectedWitel,
              source: selectedSource,
              dateRange: dateRangeDisplay,
              activeFilterDescriptions: activeFilterDescriptions
            },
            insights: employeeInsightsData,
            totalCount: totalInsights,
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
    employeeInsightsData,
    employeeStats,
    searchTerm,
    selectedWitel,
    selectedSource,
    dateRange,
    totalInsights,
    trackPageData
  ]);

  // Mengolah data employee insights untuk Top TREG Insights
  const processedTrendInsights = useMemo(() => {
    if (!employeeInsightsData) return [];

    return employeeInsightsData.map((insight: any) => {
      // Untuk Smart Analytics, prioritaskan witel daripada kota
      let witelLocation = insight.witel;
      if (!witelLocation || witelLocation.trim() === '' || witelLocation === 'Unknown') {
        // Jika tidak ada witel, coba pakai kota sebagai fallback
        witelLocation = insight.kota || "TREG";
      }

      // Filter nama karyawan untuk privasi - hanya tampilkan huruf awal + *****
      let filteredEmployeeName = "Anonymous";
      if (insight.employeeName && insight.employeeName.trim() !== '' && insight.employeeName !== 'Anonymous') {
        const name = insight.employeeName.trim();
        filteredEmployeeName = name.charAt(0).toUpperCase() + "*****";
      }

      return {
        id: insight.id,
        witel: witelLocation,
        source: insight.sourceData || "N/A",
        employee: filteredEmployeeName,
        sentiment: insight.sentenceInsight || insight.wordInsight || "N/A",
        date: new Date(insight.date).toLocaleString('id-ID')
      };
    });
  }, [employeeInsightsData]);

  // Hitung jumlah karyawan unik dari data employee insights
  const uniqueEmployeesCount = useMemo(() => {
    if (!employeeInsightsData || employeeInsightsData.length === 0) return 0;

    // Set untuk menyimpan nama karyawan yang unik
    const uniqueEmployees = new Set<string>();

    // Iterasi data untuk mengekstrak nama karyawan
    employeeInsightsData.forEach((insight: any) => {
      if (insight.employeeName && insight.employeeName.trim() !== '' && insight.employeeName !== 'Anonymous') {
        uniqueEmployees.add(insight.employeeName);
      }
    });

    return uniqueEmployees.size;
  }, [employeeInsightsData]);

  // Proses data monthly trends untuk chart
  const monthlyData = useMemo(() => {
    if (!monthlyTrendsData?.data) return [];
    return monthlyTrendsData.data;
  }, [monthlyTrendsData]);

  // Proses data untuk pie chart
  const pieChartData = useMemo(() => {
    if (!employeeStats?.data) return [];

    return [
      { name: "Positive", value: employeeStats.data.positiveCount || 0 },
      { name: "Negative", value: employeeStats.data.negativeCount || 0 },
      { name: "Neutral", value: employeeStats.data.neutralCount || 0 },
    ];
  }, [employeeStats]);

  if (isLoadingTrends || isLoadingInsights || isLoadingStats) {
    return <SmartAnalyticsSkeleton />;
  }

  return (
    <div className="flex-1 overflow-x-hidden">
      <Header title="Smart Analytics" showFilters={false} />

      <div className="p-6">
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
          currentPage="smart-analytics"
          className="mb-6"
        />

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Cari insights... (contoh: wellness, gaji, fasilitas)"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter key
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Witel Filter */}
              <div className="relative">
                <Select value={selectedWitel} onValueChange={handleWitelChange}>
                  <SelectTrigger className="w-full sm:w-auto min-w-[160px] bg-white border-gray-300 rounded-lg shadow-sm px-4 py-2">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Witel" className="text-sm" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Witel</SelectItem>
                    {witelOptions?.map((witel: string) => (
                      <SelectItem key={witel} value={witel}>
                        {witel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source Filter */}
              <div className="relative">
                <Select value={selectedSource} onValueChange={handleSourceChange}>
                  <SelectTrigger className="w-full sm:w-auto min-w-[160px] bg-white border-gray-300 rounded-lg shadow-sm px-4 py-2">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Source" className="text-sm" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {sourceOptions?.map((source: string) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto min-w-[200px] justify-between bg-white border-gray-300 rounded-lg shadow-sm px-4 py-2"
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yy")
                          )
                        ) : (
                          "Select date range"
                        )}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="overflow-hidden">
                    <CalendarComponent
                      mode="range"
                      selected={dateRange}
                      onSelect={handleDateRangeChange}
                      initialFocus
                      numberOfMonths={2}
                      defaultMonth={dateRange?.from || new Date()}
                      className="p-2"
                    />
                    <div className="p-3 border-t border-border flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Select a date range
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs rounded-full px-3"
                        onClick={() => handleDateRangeChange(defaultDateRange as DateRange)}
                      >
                        Last 30 Days
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <Button
                  onClick={handleResetFilters}
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
                {employeeInsightsResponse ? (
                  totalInsights > 0 ? (
                    <span className="text-green-600">
                      ✓ Ditemukan {totalInsights} insights untuk "{searchTerm}"
                    </span>
                  ) : (
                    <span className="text-orange-600">
                      ⚠ Tidak ada insights yang ditemukan untuk "{searchTerm}"
                    </span>
                  )
                ) : (
                  <span className="text-blue-600">🔍 Mencari insights...</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="flex items-center bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <CardContent className="p-6 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Karyawan Terlibat</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {isLoadingStats ? (
                      <div className="w-12 h-8 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      employeeStats?.data?.totalEmployees || 0
                    )}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex items-center bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <CardContent className="p-6 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Insights</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {isLoadingStats ? (
                      <div className="w-12 h-8 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      employeeStats?.data?.totalInsights || 0
                    )}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                    <path d="M9 18h6"/>
                    <path d="M10 22h4"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex items-center bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <CardContent className="p-6 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Negatif</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {isLoadingStats ? (
                      <div className="w-12 h-8 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      employeeStats?.data?.negativeCount || 0
                    )}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-thumbs-down">
                    <path d="M17 14V2"/>
                    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex items-center bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <CardContent className="p-6 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Positif</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {isLoadingStats ? (
                      <div className="w-12 h-8 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      employeeStats?.data?.positiveCount || 0
                    )}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-thumbs-up">
                    <path d="M7 10v12"/>
                    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="col-span-2 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <CardContent className="p-6">
              <div className="bg-white rounded-xl overflow-hidden">
                <div className="py-1 px-2">
                  <h3 className="text-base font-semibold mx-4 my-3 text-gray-800">Sentiment Trends Over Time</h3>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={monthlyData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 5,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00B894" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00B894" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF7675" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FF7675" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FDCB6E" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FDCB6E" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dx={-5}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        border: 'none',
                        padding: '10px 14px',
                      }}
                      itemStyle={{
                        fontSize: '12px',
                        padding: '2px 0',
                      }}
                      labelStyle={{
                        fontWeight: 'bold',
                        marginBottom: '5px',
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        paddingBottom: '10px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="positive"
                      name="Positive"
                      stackId="1"
                      stroke="#00B894"
                      strokeWidth={2}
                      fill="url(#colorPositive)"
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="negative"
                      name="Negative"
                      stackId="1"
                      stroke="#FF7675"
                      strokeWidth={2}
                      fill="url(#colorNegative)"
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="neutral"
                      name="Neutral"
                      stackId="1"
                      stroke="#FDCB6E"
                      strokeWidth={2}
                      fill="url(#colorNeutral)"
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
            <CardContent className="p-6">
              <div className="bg-white rounded-xl overflow-hidden">
                <div className="py-1 px-2">
                  <h3 className="text-base font-semibold mx-4 my-3 text-gray-800">Sentiment Distribution</h3>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <defs>
                      <filter id="shadow" height="200%" width="200%" x="-50%" y="-50%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
                      </filter>
                      <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#27ae60" />
                        <stop offset="100%" stopColor="#00B894" />
                      </linearGradient>
                      <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e74c3c" />
                        <stop offset="100%" stopColor="#FF7675" />
                      </linearGradient>
                      <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f39c12" />
                        <stop offset="100%" stopColor="#FDCB6E" />
                      </linearGradient>
                    </defs>
                    {isLoadingStats ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse text-gray-400">Loading sentiment data...</div>
                      </div>
                    ) : (
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={5}
                        cornerRadius={5}
                        label={({ name, percent }) => {
                          return `${name}: ${(percent * 100).toFixed(0)}%`;
                        }}
                      >
                        {pieChartData.map((entry, index) => {
                          const gradientId =
                            entry.name === "Positive" ? "positiveGradient" :
                            entry.name === "Negative" ? "negativeGradient" : "neutralGradient";
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#${gradientId})`}
                              stroke="#fff"
                              strokeWidth={2}
                              style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.1))' }}
                            />
                          );
                        })}
                      </Pie>
                    )}
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        border: 'none',
                        padding: '10px 14px',
                      }}
                      formatter={(value, name) => {
                        const total = employeeStats?.data?.totalInsights || 0;
                        const percentage = total > 0 ? ((value as number) / total * 100).toFixed(1) : "0.0";
                        return [`${value} (${percentage}%)`, name];
                      }}
                      itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={10}
                      formatter={(value) => {
                        return <span style={{ fontSize: '13px', color: '#4b5563', padding: '0 8px' }}>{value}</span>;
                      }}
                      wrapperStyle={{ paddingTop: 20 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Top TREG Insight</h3>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Witel</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Name Karyawan</TableHead>
                    <TableHead>Insight Sentiment</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingInsights ? (
                    // Loading state - menampilkan 5 baris skeleton loading
                    Array(5).fill(0).map((_, index: number) => (
                      <TableRow key={`loading-${index}`}>
                        <TableCell>
                          <div className="w-6 h-4 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="w-20 h-4 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="w-24 h-4 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="w-28 h-4 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="w-40 h-4 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="w-28 h-4 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : processedTrendInsights.length > 0 ? (
                    // Data dari employee insights
                    processedTrendInsights.map((insight: any, index: number) => (
                      <TableRow key={insight.id} className="hover:bg-gray-50 transition-all duration-200">
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{insight.witel}</TableCell>
                        <TableCell>{insight.source}</TableCell>
                        <TableCell>{insight.employee}</TableCell>
                        <TableCell className="max-w-md truncate">{insight.sentiment}</TableCell>
                        <TableCell>{insight.date}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // No data state
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        Tidak ada data insight tersedia
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {!isLoadingInsights && totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Menampilkan {employeeInsightsData.length} dari {totalInsights} data
                  </div>

                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1 rounded border ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-800'}`}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>

                    <div className="flex items-center space-x-1">
                      {/* Create page buttons with logic to show limited range */}
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                        // Calculate which page numbers to show
                        let pageNum = 1;

                        if (totalPages <= 5) {
                          // If 5 or less pages, show all
                          pageNum = idx + 1;
                        } else if (page <= 3) {
                          // Near start
                          pageNum = idx + 1;
                        } else if (page >= totalPages - 2) {
                          // Near end
                          pageNum = totalPages - 4 + idx;
                        } else {
                          // In middle
                          pageNum = page - 2 + idx;
                        }

                        return (
                          <button
                            key={`page-${pageNum}`}
                            className={`w-8 h-8 rounded flex items-center justify-center ${
                              page === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white hover:bg-gray-50 text-gray-800 border'
                            }`}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      className={`px-3 py-1 rounded border ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-800'}`}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ChatbotWithSuspense />
    </div>
  );
}
