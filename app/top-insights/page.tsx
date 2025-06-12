'use client';

import React, { useState, useMemo, useCallback, useEffect, memo } from "react";
import { ErrorBoundary } from "@/components/common";
import { usePageContext } from "@/hooks/usePageContext";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown, CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  useOptimizedEmployeeInsights,
  useOptimizedKotaSummary
} from "@/hooks/useOptimizedQuery";
import { useOptimizedSearch } from "@/hooks/useOptimizedDebounce";
import {
  AmChartsWordCloudWithSuspense,
  IndonesiaMapWithSuspense,
  ChatbotWithSuspense
} from "@/components/performance/LazyComponents";

// Optimized imports with lazy loading
import Header from "@/components/layout/header";
import AIConclusion from "@/components/AIConclusion";
import { TopInsightsSkeleton } from "@/components/skeletons";
import { Card, CardContent } from "@/components/ui/card";

// UI components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Mapping kota ke ID provinsi untuk peta Indonesia
const kotaToProvinceMapping: { [key: string]: string } = {
  // DKI Jakarta
  'Jakarta': 'ID-JK',
  'Jakarta Inner': 'ID-JK',
  'Jakarta Selatan': 'ID-JK',
  'Jakarta Utara': 'ID-JK',
  'Jakarta Barat': 'ID-JK',
  'Jakarta Timur': 'ID-JK',
  'Jakarta Pusat': 'ID-JK',

  // Jawa Barat
  'Bandung': 'ID-JB',
  'Bekasi': 'ID-JB',
  'Bogor': 'ID-JB',
  'Depok': 'ID-JB',
  'Cimahi': 'ID-JB',
  'Sukabumi': 'ID-JB',
  'Tasikmalaya': 'ID-JB',
  'Cirebon': 'ID-JB',

  // Jawa Tengah
  'Semarang': 'ID-JT',
  'Solo': 'ID-JT',
  'Surakarta': 'ID-JT',
  'Yogyakarta': 'ID-YO',
  'Magelang': 'ID-JT',
  'Salatiga': 'ID-JT',
  'Pekalongan': 'ID-JT',
  'Tegal': 'ID-JT',

  // Jawa Timur
  'Surabaya': 'ID-JI',
  'Malang': 'ID-JI',
  'Kediri': 'ID-JI',
  'Blitar': 'ID-JI',
  'Mojokerto': 'ID-JI',
  'Madiun': 'ID-JI',
  'Pasuruan': 'ID-JI',
  'Probolinggo': 'ID-JI',
  'Suramadu': 'ID-JI',

  // Banten
  'Tangerang': 'ID-BT',
  'Serang': 'ID-BT',
  'Cilegon': 'ID-BT',

  // Sumatera Utara
  'Medan': 'ID-SU',
  'Binjai': 'ID-SU',
  'Tebing Tinggi': 'ID-SU',
  'Pematangsiantar': 'ID-SU',

  // Sumatera Barat
  'Padang': 'ID-SB',
  'Bukittinggi': 'ID-SB',
  'Payakumbuh': 'ID-SB',

  // Sumatera Selatan
  'Palembang': 'ID-SS',
  'Prabumulih': 'ID-SS',
  'Lubuklinggau': 'ID-SS',

  // Riau
  'Pekanbaru': 'ID-RI',
  'Dumai': 'ID-RI',

  // Kepulauan Riau
  'Batam': 'ID-KR',
  'Tanjungpinang': 'ID-KR',

  // Lampung
  'Bandar Lampung': 'ID-LA',
  'Metro': 'ID-LA',

  // Bengkulu
  'Bengkulu': 'ID-BE',

  // Jambi
  'Jambi': 'ID-JA',

  // Aceh
  'Banda Aceh': 'ID-AC',
  'Langsa': 'ID-AC',
  'Lhokseumawe': 'ID-AC',
  'Sabang': 'ID-AC',

  // Kalimantan Barat
  'Pontianak': 'ID-KB',
  'Singkawang': 'ID-KB',

  // Kalimantan Tengah
  'Palangkaraya': 'ID-KT',

  // Kalimantan Selatan
  'Banjarmasin': 'ID-KS',
  'Banjarbaru': 'ID-KS',

  // Kalimantan Timur
  'Samarinda': 'ID-KI',
  'Balikpapan': 'ID-KI',
  'Bontang': 'ID-KI',

  // Kalimantan Utara
  'Tarakan': 'ID-KU',

  // Sulawesi Utara
  'Manado': 'ID-SA',
  'Bitung': 'ID-SA',
  'Tomohon': 'ID-SA',
  'Kotamobagu': 'ID-SA',

  // Sulawesi Tengah
  'Palu': 'ID-ST',

  // Sulawesi Selatan
  'Makassar': 'ID-SN',
  'Parepare': 'ID-SN',
  'Palopo': 'ID-SN',
  'Sulbagsel': 'ID-SN',

  // Sulawesi Tenggara
  'Kendari': 'ID-SG',
  'Baubau': 'ID-SG',

  // Gorontalo
  'Gorontalo': 'ID-GO',

  // Sulawesi Barat
  'Mamuju': 'ID-SR',

  // Bali
  'Denpasar': 'ID-BA',

  // Nusa Tenggara Barat
  'Mataram': 'ID-NB',
  'Bima': 'ID-NB',

  // Nusa Tenggara Timur
  'Kupang': 'ID-NT',

  // Maluku
  'Ambon': 'ID-MA',
  'Tual': 'ID-MA',
  'MALUKU': 'ID-MA',

  // Maluku Utara
  'Ternate': 'ID-MU',
  'Tidore Kepulauan': 'ID-MU',
  'MALUT': 'ID-MU',

  // Papua
  'Jayapura': 'ID-PA',

  // Papua Barat
  'Manokwari': 'ID-PB',

  // Papua Selatan
  'Merauke': 'ID-PS',

  // Papua Tengah
  'Nabire': 'ID-PT',

  // Papua Pegunungan
  'Wamena': 'ID-PP',

  // Papua Barat Daya
  'Sorong': 'ID-PD'
};

interface TopInsight {
  id: number;
  location: string;
  source: string;
  employee: string;
  sentiment: string;
  date: string;
}

// Memoized filter components for better performance
const FilterControls = memo(({
  searchTerm,
  onSearchChange,
  onClearSearch,
  selectedKota,
  onKotaChange,
  selectedSource,
  onSourceChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters,
  totalInsights
}: any) => {
  const defaultDateRange = useMemo(() => {
    const today = new Date();
    return {
      from: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
      to: today
    };
  }, []);

  return (
    <Card className="mb-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Cari insights... (contoh: wellness, asuransi, program)"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Kota Filter */}
          <div className="relative">
            <Select value={selectedKota} onValueChange={onKotaChange}>
              <SelectTrigger className="w-full sm:w-auto min-w-[140px] bg-white border-gray-300 rounded-lg shadow-sm px-4 py-2">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Kota" className="text-sm" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Kota</SelectItem>
                <SelectItem value="Jakarta Inner">Jakarta Inner</SelectItem>
                <SelectItem value="Bandung">Bandung</SelectItem>
                <SelectItem value="Suramadu">Suramadu</SelectItem>
                <SelectItem value="SAMARINDA">Samarinda</SelectItem>
                <SelectItem value="MALUT">Malut</SelectItem>
                <SelectItem value="PONTIANAK">Pontianak</SelectItem>
                <SelectItem value="BATAM">Batam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="relative">
            <Select value={selectedSource} onValueChange={onSourceChange}>
              <SelectTrigger className="w-full sm:w-auto min-w-[140px] bg-white border-gray-300 rounded-lg shadow-sm px-4 py-2">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Source" className="text-sm" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Diarium">Diarium</SelectItem>
                <SelectItem value="Instagram HC">Instagram HC</SelectItem>
                <SelectItem value="Komplain Helpdesk HC">Komplain Helpdesk HC</SelectItem>
                <SelectItem value="Email HC">Email HC</SelectItem>
                <SelectItem value="Town Hall Meeting">Town Hall Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto min-w-[200px] justify-start bg-white border-gray-300 rounded-lg shadow-sm px-4 py-2"
              >
                <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm font-normal truncate">
                  {dateRange && dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    "Select date range"
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="overflow-hidden">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={onDateRangeChange}
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
                    onClick={() => onDateRangeChange(defaultDateRange as DateRange)}
                  >
                    Last 30 Days
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <Button
              onClick={onClearFilters}
              variant="outline"
              className="w-full sm:w-auto px-4 py-2 text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Reset All
            </Button>
          )}
        </div>

        {/* Filter Status Info */}
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            {totalInsights > 0 ? (
              <span className="text-green-600">
                ✓ Ditemukan {totalInsights} insights untuk "{searchTerm}"
              </span>
            ) : (
              <span className="text-orange-600">
                ⚠ Tidak ada insights yang ditemukan untuk "{searchTerm}"
              </span>
            )}
          </div>
        )}

        {!searchTerm && hasActiveFilters && (
          <div className="mt-3 text-sm text-blue-600">
            🔽 Filter aktif:
            {selectedKota !== "all" && ` Kota: ${selectedKota}`}
            {selectedSource !== "all" && ` • Source: ${selectedSource}`}
            {dateRange && ` • Date range selected`}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

FilterControls.displayName = 'FilterControls';

export default function TopInsights() {
  // Optimized state management
  const [selectedKota, setSelectedKota] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);

  // Optimized search with debouncing
  const {
    searchTerm,
    debouncedSearchTerm,
    handleSearchChange,
    handleClearSearch
  } = useOptimizedSearch('', 500);

  // Optimized data fetching with custom hooks
  const { data: kotaSummaryData } = useOptimizedKotaSummary();
  const { data: insightsData, isLoading } = useOptimizedEmployeeInsights(
    page,
    debouncedSearchTerm,
    selectedKota,
    selectedSource,
    dateRange
  );

  // Page context tracking hook
  const {
    pageContext,
    aiConclusion,
    isGeneratingAI,
    generateAIConclusion,
    trackPageData,
    error: pageContextError
  } = usePageContext('top-insights');

  // Process kota summary data for map
  const mapData = useMemo(() => {
    if (!kotaSummaryData) return [];

    // Group data by province
    const provinceData: { [key: string]: {
      total_count: number;
      positif_percentage: number;
      negatif_percentage: number;
      netral_percentage: number;
      name: string;
      cities: string[];
      kotaCount: number;
    } } = {};

    kotaSummaryData.forEach((kota: any) => {
      const provinceId = kotaToProvinceMapping[kota.kota];
      if (provinceId) {
        if (!provinceData[provinceId]) {
          provinceData[provinceId] = {
            total_count: 0,
            positif_percentage: 0,
            negatif_percentage: 0,
            netral_percentage: 0,
            name: provinceId.replace('ID-', ''),
            cities: [],
            kotaCount: 0
          };
        }
        provinceData[provinceId].total_count += kota.total_count;
        provinceData[provinceId].cities.push(kota.kota);
        provinceData[provinceId].kotaCount += 1;
        // Calculate weighted average for all sentiment percentages
        provinceData[provinceId].positif_percentage =
          (provinceData[provinceId].positif_percentage + kota.positif_percentage) / 2;
        provinceData[provinceId].negatif_percentage =
          (provinceData[provinceId].negatif_percentage + kota.negatif_percentage) / 2;
        provinceData[provinceId].netral_percentage =
          (provinceData[provinceId].netral_percentage + kota.netral_percentage) / 2;
      }
    });

    // Convert to array format for map
    const result = Object.entries(provinceData).map(([id, data]) => {
      // Get the main city (first or largest) for display
      let displayName = data.name;
      if (data.cities.length > 0) {
        // Show main city + count if multiple cities
        if (data.cities.length === 1) {
          displayName = data.cities[0];
        } else {
          displayName = `${data.cities[0]} +${data.cities.length - 1} kota`;
        }
      }

      // Determine dominant sentiment and color
      const positif = data.positif_percentage;
      const negatif = data.negatif_percentage;
      const netral = data.netral_percentage;

      let dominantSentiment = 'neutral';
      let sentimentColor = '#FFC107'; // Yellow for neutral

      if (positif >= negatif && positif >= netral) {
        dominantSentiment = 'positive';
        sentimentColor = '#28A745'; // Green for positive
      } else if (negatif >= positif && negatif >= netral) {
        dominantSentiment = 'negative';
        sentimentColor = '#DC3545'; // Red for negative
      }

      return {
        id,
        name: displayName,
        value: data.total_count,
        positif_percentage: Math.round(data.positif_percentage * 100) / 100,
        negatif_percentage: Math.round(data.negatif_percentage * 100) / 100,
        netral_percentage: Math.round(data.netral_percentage * 100) / 100,
        kotaCount: data.kotaCount,
        allCities: data.cities.join(', '),
        dominantSentiment,
        sentimentColor
      };
    });

    return result;
  }, [kotaSummaryData]);

  // Prepare data for the component
  const topInsights = insightsData ? {
    insights: insightsData.data.map((item: any) => ({
      id: item.id,
      location: item.kota || 'Unknown',
      source: item.sourceData || 'Unknown',
      employee: item.employeeName ? `${item.employeeName.substring(0, 1)}***` : 'Unknown',
      sentiment: item.sentenceInsight ? `${item.sentenceInsight.substring(0, 50)}...` : item.sentimen,
      date: item.date ? new Date(item.date).toISOString().split('T')[0].replace(/-/g, '/') : 'Unknown'
    })),
    totalCount: Number(insightsData.total) || 0
    // Note: Word cloud data is now fetched directly by AmChartsWordCloud component from D1 database
  } : null;

  useEffect(() => {
    if (insightsData?.total_pages) {
      setTotalPages(insightsData.total_pages);
    }
  }, [insightsData?.total_pages]);

  // Track page data untuk AI conclusion ketika data atau filter berubah
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (insightsData?.data) {
        try {
          // Calculate sentiment counts dari current filtered data
          const sentimentCounts = {
            positive: 0,
            negative: 0,
            neutral: 0
          };

          // Analyze sentiment dari insights data
          insightsData.data.forEach((insight: any) => {
            const sentiment = insight.sentimen?.toLowerCase() || 'neutral';
            if (sentiment.includes('positif') || sentiment.includes('positive')) {
              sentimentCounts.positive++;
            } else if (sentiment.includes('negatif') || sentiment.includes('negative')) {
              sentimentCounts.negative++;
            } else {
              sentimentCounts.neutral++;
            }
          });

          // Extract top keywords dari insights
          const topKeywords = insightsData.data
            .map((insight: any) => insight.sentenceInsight || insight.sentimen || '')
            .filter((text: string) => text.length > 0)
            .slice(0, 10);

          // Determine active filter descriptions for AI context
          const activeFilterDescriptions = [];
          if (debouncedSearchTerm.length > 0) {
            activeFilterDescriptions.push(`pencarian "${debouncedSearchTerm}"`);
          }
          if (selectedKota !== "all") {
            activeFilterDescriptions.push(`kota: ${selectedKota}`);
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
              search: debouncedSearchTerm,
              kota: selectedKota,
              source: selectedSource,
              dateRange: dateRangeDisplay,
              activeFilterDescriptions: activeFilterDescriptions
            },
            insights: insightsData.data,
            totalCount: insightsData.total || 0,
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
    insightsData,
    debouncedSearchTerm,
    selectedKota,
    selectedSource,
    dateRange,
    trackPageData
  ]);

  // Optimized filter handlers with useCallback
  const handleKotaChange = useCallback((value: string) => {
    setSelectedKota(value);
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

  const handleClearFilters = useCallback(() => {
    handleClearSearch();
    setSelectedKota("all");
    setSelectedSource("all");
    setDateRange(undefined);
    setPage(1);
  }, [handleClearSearch]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() =>
    searchTerm || selectedKota !== "all" || selectedSource !== "all" || dateRange,
    [searchTerm, selectedKota, selectedSource, dateRange]
  );

  if (isLoading) {
    return <TopInsightsSkeleton />;
  }

  return (
    <div className="flex-1 overflow-x-hidden">
      <Header title="Top Insights" showFilters={false} />

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
          currentPage="top-insights"
          className="mb-6"
        />

        {/* Optimized Filter Controls */}
        <FilterControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          selectedKota={selectedKota}
          onKotaChange={handleKotaChange}
          selectedSource={selectedSource}
          onSourceChange={handleSourceChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          totalInsights={insightsData?.total || 0}
        />

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <AmChartsWordCloudWithSuspense
                  height="320px"
                  title="Top Insights Word Cloud"
                />
              </div>
              <div>
                <IndonesiaMapWithSuspense
                  title="Regional Distribution"
                  height="320px"
                  data={mapData}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>KOTA</TableHead>
                    <TableHead>SOURCE</TableHead>
                    <TableHead>NAMA KARYAWAN</TableHead>
                    <TableHead>INSIGHT SENTIMENT</TableHead>
                    <TableHead>DATE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topInsights?.insights.map((insight: TopInsight, index: number) => (
                    <TableRow key={insight.id} className="hover:bg-gray-50 transition-all duration-200">
                      <TableCell className="font-medium">{index + 1 + (page - 1) * 10}</TableCell>
                      <TableCell>{insight.location}</TableCell>
                      <TableCell>{insight.source}</TableCell>
                      <TableCell>{insight.employee}</TableCell>
                      <TableCell>{insight.sentiment}</TableCell>
                      <TableCell>{insight.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                    className={page === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNum);
                        }}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {totalPages > 5 && (
                  <>
                    <PaginationItem>
                      <PaginationLink href="#" onClick={(e) => e.preventDefault()}>
                        ...
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(totalPages);
                        }}
                        isActive={page === totalPages}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                    className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <div className="mt-4 text-sm text-gray-500 text-right">
              Showing {insightsData && insightsData.data.length > 0 ? (page - 1) * 10 + 1 : 0} to {insightsData ? (page - 1) * 10 + insightsData.data.length : 0} of {insightsData?.total || 0} entries
            </div>
          </CardContent>
        </Card>
      </div>

      <ChatbotWithSuspense />
    </div>
  );
}
