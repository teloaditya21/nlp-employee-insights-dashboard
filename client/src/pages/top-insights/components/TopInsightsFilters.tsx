/**
 * @fileoverview Top Insights Filter Component
 * @description Advanced filtering interface for top insights with analytics
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X, CalendarIcon, BarChart3 } from 'lucide-react';
import { FilterOptions, SentimentType } from '@/types';
import { useSearchFilter, useSentimentFilter, useDateRangeFilter } from '@/hooks/useFilters';
import { formatNumber, formatDate } from '@/utils/formatters';
import { format } from 'date-fns';

interface TopInsightsFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  totalResults: number;
  isLoading?: boolean;
  sentimentCounts: {
    positive: number;
    negative: number;
    neutral: number;
  };
  className?: string;
}

/**
 * Top insights filter component
 */
const TopInsightsFilters: React.FC<TopInsightsFiltersProps> = ({
  filters,
  onFiltersChange,
  totalResults,
  isLoading = false,
  sentimentCounts,
  className,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Individual filter hooks
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
  } = useSearchFilter(filters.search || '', 300, (value) => {
    onFiltersChange({ ...filters, search: value });
  });

  const {
    sentiment,
    setSentiment,
    clearSentiment,
    hasActiveSentiment,
  } = useSentimentFilter(filters.sentiment || 'all', (value) => {
    onFiltersChange({ ...filters, sentiment: value });
  });

  const {
    dateRange,
    setDateRange,
    clearDateRange,
    setPresetRange,
    hasActiveDateRange,
  } = useDateRangeFilter(filters.dateRange, (range) => {
    onFiltersChange({ ...filters, dateRange: range });
  });

  // Location and source filters
  const [selectedWitel, setSelectedWitel] = useState(filters.witel || 'all');
  const [selectedSource, setSelectedSource] = useState(filters.source || 'all');

  // Handle location change
  const handleWitelChange = (value: string) => {
    setSelectedWitel(value);
    onFiltersChange({ ...filters, witel: value === 'all' ? '' : value });
  };

  // Handle source change
  const handleSourceChange = (value: string) => {
    setSelectedSource(value);
    onFiltersChange({ ...filters, source: value === 'all' ? '' : value });
  };

  // Calculate active filter count
  const activeFilterCount = [
    hasSearch,
    hasActiveSentiment,
    hasActiveDateRange,
    selectedWitel !== 'all',
    selectedSource !== 'all',
  ].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = () => {
    clearSearch();
    clearSentiment();
    clearDateRange();
    setSelectedWitel('all');
    setSelectedSource('all');
    onFiltersChange({
      search: '',
      sentiment: 'all',
      dateRange: undefined,
      witel: '',
      source: '',
    });
  };

  // Sentiment options with counts
  const sentimentOptions = [
    { value: 'all', label: 'All Sentiments', count: totalResults },
    { value: 'positive', label: 'Positive', count: sentimentCounts.positive },
    { value: 'negative', label: 'Negative', count: sentimentCounts.negative },
    { value: 'neutral', label: 'Neutral', count: sentimentCounts.neutral },
  ];

  // Location options (these would typically come from an API)
  const witelOptions = [
    { value: 'all', label: 'All Locations' },
    { value: 'jakarta', label: 'Jakarta' },
    { value: 'bandung', label: 'Bandung' },
    { value: 'surabaya', label: 'Surabaya' },
    { value: 'medan', label: 'Medan' },
    { value: 'makassar', label: 'Makassar' },
  ];

  // Source options (these would typically come from an API)
  const sourceOptions = [
    { value: 'all', label: 'All Sources' },
    { value: 'survey', label: 'Survey' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'review', label: 'Review' },
    { value: 'interview', label: 'Interview' },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear all ({activeFilterCount})
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search and Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
              disabled={isLoading}
            />
            {hasSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Location Filter */}
          <Select value={selectedWitel} onValueChange={handleWitelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {witelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source Filter */}
          <Select value={selectedSource} onValueChange={handleSourceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
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
                    Last Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetRange('month')}
                  >
                    Last Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetRange('quarter')}
                  >
                    Last Quarter
                  </Button>
                </div>
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
              {hasActiveDateRange && (
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

        {/* Sentiment Filter with Counts */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Filter by Sentiment
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sentimentOptions.map((option) => (
              <Button
                key={option.value}
                variant={sentiment === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSentiment(option.value as SentimentType | 'all')}
                className="justify-between"
                disabled={isLoading}
              >
                <span>{option.label}</span>
                <Badge variant="secondary" className="ml-2">
                  {formatNumber(option.count)}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Active Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {hasSearch && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchTerm}"
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {hasActiveSentiment && (
                <Badge variant="secondary" className="text-xs">
                  Sentiment: {sentiment}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSentiment}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {selectedWitel !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Location: {selectedWitel}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleWitelChange('all')}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {selectedSource !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Source: {selectedSource}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSourceChange('all')}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {hasActiveDateRange && (
                <Badge variant="secondary" className="text-xs">
                  Date Range
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateRange}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {isLoading ? (
                'Loading results...'
              ) : (
                <>
                  Showing <span className="font-medium">{formatNumber(totalResults)}</span> insights
                  {activeFilterCount > 0 && (
                    <span className="text-gray-500"> (filtered)</span>
                  )}
                </>
              )}
            </p>
            
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <BarChart3 className="w-3 h-3" />
                <span>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(TopInsightsFilters);
