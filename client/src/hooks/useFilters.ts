/**
 * @fileoverview Filter management hook
 * @description Custom hook for managing filters across different pages
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { FilterOptions, SentimentType, InsightData } from '@/types';
import { filterInsights, debounce } from '@/utils/helpers';
import { STORAGE_KEYS } from '@/utils/constants';

export interface UseFiltersOptions {
  persistFilters?: boolean;
  storageKey?: string;
  debounceMs?: number;
  onFiltersChange?: (filters: FilterOptions) => void;
}

export interface UseFiltersReturn {
  filters: FilterOptions;
  setFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  clearFilter: (key: keyof FilterOptions) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  filterInsights: (insights: InsightData[]) => InsightData[];
  debouncedSetFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
}

const defaultFilters: FilterOptions = {
  search: '',
  sentiment: 'all',
  dateRange: undefined,
  witel: '',
  source: '',
  topics: [],
};

/**
 * Custom hook for managing filters
 */
export function useFilters(options: UseFiltersOptions = {}): UseFiltersReturn {
  const {
    persistFilters = false,
    storageKey = STORAGE_KEYS.FILTERS,
    debounceMs = 300,
    onFiltersChange,
  } = options;

  // Load initial filters from localStorage if persistence is enabled
  const getInitialFilters = useCallback((): FilterOptions => {
    if (persistFilters) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedFilters = JSON.parse(stored);
          // Ensure dateRange is properly converted back to Date objects
          if (parsedFilters.dateRange) {
            parsedFilters.dateRange = {
              from: parsedFilters.dateRange.from ? new Date(parsedFilters.dateRange.from) : undefined,
              to: parsedFilters.dateRange.to ? new Date(parsedFilters.dateRange.to) : undefined,
            };
          }
          return { ...defaultFilters, ...parsedFilters };
        }
      } catch (error) {
        console.error('Error loading filters from localStorage:', error);
      }
    }
    return defaultFilters;
  }, [persistFilters, storageKey]);

  const [filters, setFiltersState] = useState<FilterOptions>(getInitialFilters);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (persistFilters) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(filters));
      } catch (error) {
        console.error('Error saving filters to localStorage:', error);
      }
    }
  }, [filters, persistFilters, storageKey]);

  // Call onFiltersChange callback when filters change
  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  /**
   * Set a single filter value
   */
  const setFilter = useCallback(<K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Set multiple filter values at once
   */
  const setFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  /**
   * Reset all filters to default values
   */
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  /**
   * Clear a specific filter
   */
  const clearFilter = useCallback((key: keyof FilterOptions) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: defaultFilters[key],
    }));
  }, []);

  /**
   * Debounced version of setFilter for search inputs
   */
  const debouncedSetFilter = useMemo(
    () => debounce(setFilter, debounceMs),
    [setFilter, debounceMs]
  );

  /**
   * Check if any filters are active (different from default)
   */
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const filterKey = key as keyof FilterOptions;
      const currentValue = filters[filterKey];
      const defaultValue = defaultFilters[filterKey];

      if (filterKey === 'dateRange') {
        return currentValue !== undefined && currentValue !== null;
      }

      if (Array.isArray(currentValue)) {
        return currentValue.length > 0;
      }

      return currentValue !== defaultValue && currentValue !== '' && currentValue !== 'all';
    });
  }, [filters]);

  /**
   * Count of active filters
   */
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.search && filters.search.trim() !== '') count++;
    if (filters.sentiment && filters.sentiment !== 'all') count++;
    if (filters.dateRange) count++;
    if (filters.witel && filters.witel !== '') count++;
    if (filters.source && filters.source !== '') count++;
    if (filters.topics && filters.topics.length > 0) count++;

    return count;
  }, [filters]);

  /**
   * Filter insights based on current filter values
   */
  const filterInsightsData = useCallback((insights: InsightData[]): InsightData[] => {
    return filterInsights(insights, filters);
  }, [filters]);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount,
    filterInsights: filterInsightsData,
    debouncedSetFilter,
  };
}

/**
 * Hook for managing search filter specifically
 */
export function useSearchFilter(
  initialValue: string = '',
  debounceMs: number = 300,
  onSearchChange?: (value: string) => void
) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

  // Debounced search term update
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => {
      setDebouncedSearchTerm(value);
      onSearchChange?.(value);
    }, debounceMs),
    [debounceMs, onSearchChange]
  );

  // Update debounced search term when search term changes
  useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    onSearchChange?.('');
  }, [onSearchChange]);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch: searchTerm.trim() !== '',
  };
}

/**
 * Hook for managing sentiment filter
 */
export function useSentimentFilter(
  initialValue: SentimentType | 'all' = 'all',
  onSentimentChange?: (sentiment: SentimentType | 'all') => void
) {
  const [sentiment, setSentiment] = useState<SentimentType | 'all'>(initialValue);

  const handleSentimentChange = useCallback((newSentiment: SentimentType | 'all') => {
    setSentiment(newSentiment);
    onSentimentChange?.(newSentiment);
  }, [onSentimentChange]);

  const clearSentiment = useCallback(() => {
    handleSentimentChange('all');
  }, [handleSentimentChange]);

  return {
    sentiment,
    setSentiment: handleSentimentChange,
    clearSentiment,
    hasActiveSentiment: sentiment !== 'all',
  };
}

/**
 * Hook for managing date range filter
 */
export function useDateRangeFilter(
  initialValue?: DateRange,
  onDateRangeChange?: (dateRange?: DateRange) => void
) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialValue);

  const handleDateRangeChange = useCallback((newDateRange?: DateRange) => {
    setDateRange(newDateRange);
    onDateRangeChange?.(newDateRange);
  }, [onDateRangeChange]);

  const clearDateRange = useCallback(() => {
    handleDateRangeChange(undefined);
  }, [handleDateRangeChange]);

  const setPresetRange = useCallback((preset: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let from: Date;
    let to: Date = today;

    switch (preset) {
      case 'today':
        from = today;
        break;
      case 'week':
        from = new Date(today);
        from.setDate(today.getDate() - 7);
        break;
      case 'month':
        from = new Date(today);
        from.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        from = new Date(today);
        from.setMonth(today.getMonth() - 3);
        break;
      case 'year':
        from = new Date(today);
        from.setFullYear(today.getFullYear() - 1);
        break;
      default:
        from = today;
    }

    handleDateRangeChange({ from, to });
  }, [handleDateRangeChange]);

  return {
    dateRange,
    setDateRange: handleDateRangeChange,
    clearDateRange,
    setPresetRange,
    hasActiveDateRange: dateRange !== undefined,
  };
}

/**
 * Hook for managing topic/category filters
 */
export function useTopicFilter(
  initialValue: string[] = [],
  onTopicsChange?: (topics: string[]) => void
) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialValue);

  const addTopic = useCallback((topic: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) return prev;
      const newTopics = [...prev, topic];
      onTopicsChange?.(newTopics);
      return newTopics;
    });
  }, [onTopicsChange]);

  const removeTopic = useCallback((topic: string) => {
    setSelectedTopics(prev => {
      const newTopics = prev.filter(t => t !== topic);
      onTopicsChange?.(newTopics);
      return newTopics;
    });
  }, [onTopicsChange]);

  const toggleTopic = useCallback((topic: string) => {
    setSelectedTopics(prev => {
      const newTopics = prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic];
      onTopicsChange?.(newTopics);
      return newTopics;
    });
  }, [onTopicsChange]);

  const clearTopics = useCallback(() => {
    setSelectedTopics([]);
    onTopicsChange?.([]);
  }, [onTopicsChange]);

  const setTopics = useCallback((topics: string[]) => {
    setSelectedTopics(topics);
    onTopicsChange?.(topics);
  }, [onTopicsChange]);

  return {
    selectedTopics,
    addTopic,
    removeTopic,
    toggleTopic,
    clearTopics,
    setTopics,
    hasActiveTopics: selectedTopics.length > 0,
    topicCount: selectedTopics.length,
  };
}
