/**
 * @fileoverview General utility helper functions
 * @description Common utility functions used throughout the application
 */

import { SentimentType, InsightData, FilterOptions } from '@/types';
import { UI_CONFIG } from './constants';

/**
 * Debounce function to limit the rate of function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = UI_CONFIG.DEBOUNCE_DELAY
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function to limit function calls to once per specified time period
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
};

/**
 * Check if two objects are deeply equal
 */
export const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 == null || obj2 == null) {
    return false;
  }

  if (typeof obj1 !== typeof obj2) {
    return false;
  }

  if (typeof obj1 !== 'object') {
    return obj1 === obj2;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false;
    }

    if (!deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
};

/**
 * Generate a unique ID
 */
export const generateId = (prefix: string = 'id'): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomStr}`;
};

/**
 * Sleep function for async operations
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError!;
};

/**
 * Group array items by a key
 */
export const groupBy = <T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * Remove duplicates from array based on a key
 */
export const uniqueBy = <T, K extends keyof T>(array: T[], key: K): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Sort array by multiple criteria
 */
export const sortBy = <T>(
  array: T[],
  ...criteria: Array<(item: T) => any>
): T[] => {
  return [...array].sort((a, b) => {
    for (const criterion of criteria) {
      const aValue = criterion(a);
      const bValue = criterion(b);
      
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
    }
    return 0;
  });
};

/**
 * Calculate sentiment percentages
 */
export const calculateSentimentPercentages = (
  positive: number,
  negative: number,
  neutral: number
): { positive: number; negative: number; neutral: number } => {
  const total = positive + negative + neutral;
  
  if (total === 0) {
    return { positive: 0, negative: 0, neutral: 0 };
  }

  return {
    positive: Math.round((positive / total) * 100),
    negative: Math.round((negative / total) * 100),
    neutral: Math.round((neutral / total) * 100),
  };
};

/**
 * Determine sentiment type based on percentages
 */
export const determineSentiment = (
  positive: number,
  negative: number,
  neutral: number
): SentimentType => {
  if (positive > negative && positive > neutral) {
    return 'positive';
  }
  if (negative > positive && negative > neutral) {
    return 'negative';
  }
  return 'neutral';
};

/**
 * Filter insights based on criteria
 */
export const filterInsights = (
  insights: InsightData[],
  filters: FilterOptions
): InsightData[] => {
  return insights.filter(insight => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const titleMatch = insight.title.toLowerCase().includes(searchTerm);
      if (!titleMatch) return false;
    }

    // Sentiment filter
    if (filters.sentiment && filters.sentiment !== 'all') {
      if (insight.sentiment !== filters.sentiment) return false;
    }

    // Date range filter
    if (filters.dateRange && insight.date) {
      const insightDate = new Date(insight.date);
      const { from, to } = filters.dateRange;
      if (from && insightDate < from) return false;
      if (to && insightDate > to) return false;
    }

    // Location filter
    if (filters.witel && insight.location !== filters.witel) {
      return false;
    }

    // Source filter
    if (filters.source && insight.source !== filters.source) {
      return false;
    }

    // Topics filter
    if (filters.topics && filters.topics.length > 0) {
      if (!filters.topics.includes(insight.title)) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Convert API insight data to UI format
 */
export const convertToInsightData = (apiData: any): InsightData => {
  return {
    id: apiData.id,
    title: apiData.word_insight || apiData.title,
    neutralPercentage: apiData.netral_percentage || 0,
    negativePercentage: apiData.negatif_percentage || 0,
    positivePercentage: apiData.positif_percentage || 0,
    views: apiData.total_count || 0,
    comments: apiData.feedback_count || 0,
    sentiment: determineSentiment(
      apiData.positif_percentage || 0,
      apiData.negatif_percentage || 0,
      apiData.netral_percentage || 0
    ),
    source: apiData.source,
    location: apiData.witel || apiData.location,
    employee: apiData.employee_name,
    date: apiData.created_at,
  };
};

/**
 * Create URL with query parameters
 */
export const createUrlWithParams = (
  baseUrl: string,
  params: Record<string, any>
): string => {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

/**
 * Parse URL query parameters
 */
export const parseUrlParams = (url: string): Record<string, string> => {
  const urlObj = new URL(url);
  const params: Record<string, string> = {};
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
};

/**
 * Clamp a number between min and max values
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Generate a random color
 */
export const generateRandomColor = (): string => {
  const colors = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Download data as file
 */
export const downloadAsFile = (
  data: string,
  filename: string,
  mimeType: string = 'text/plain'
): void => {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error);
    return false;
  }
};

/**
 * Get browser information
 */
export const getBrowserInfo = (): {
  name: string;
  version: string;
  platform: string;
} => {
  const userAgent = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';

  if (userAgent.includes('Chrome')) {
    name = 'Chrome';
    version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Safari')) {
    name = 'Safari';
    version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Edge')) {
    name = 'Edge';
    version = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }

  return {
    name,
    version,
    platform: navigator.platform,
  };
};
