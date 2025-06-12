/**
 * @fileoverview Data formatting utilities
 * @description Utility functions for formatting data, dates, numbers, and text
 */

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { SentimentType } from '@/types';
import { SENTIMENT_COLORS, DATE_FORMATS } from './constants';

/**
 * Format a number with thousand separators
 */
export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
};

/**
 * Format a number as percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a number as currency (Indonesian Rupiah)
 */
export const formatCurrency = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'Rp 0';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format date with various options
 */
export const formatDate = (
  date: string | Date,
  formatType: keyof typeof DATE_FORMATS = 'SHORT'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }

    switch (formatType) {
      case 'SHORT':
        return format(dateObj, 'dd MMM yyyy', { locale: idLocale });
      case 'LONG':
        return format(dateObj, 'dd MMMM yyyy', { locale: idLocale });
      case 'WITH_TIME':
        return format(dateObj, 'dd MMM yyyy HH:mm', { locale: idLocale });
      case 'ISO':
        return format(dateObj, 'yyyy-MM-dd');
      case 'TIME_ONLY':
        return format(dateObj, 'HH:mm');
      case 'RELATIVE':
        return formatDistanceToNow(dateObj, { 
          addSuffix: true, 
          locale: idLocale 
        });
      default:
        return format(dateObj, 'dd MMM yyyy', { locale: idLocale });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format date range
 */
export const formatDateRange = (
  startDate: string | Date,
  endDate: string | Date,
  formatType: keyof typeof DATE_FORMATS = 'SHORT'
): string => {
  try {
    const start = formatDate(startDate, formatType);
    const end = formatDate(endDate, formatType);
    
    if (start === end) {
      return start;
    }
    
    return `${start} - ${end}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return 'Invalid Date Range';
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Convert camelCase to Title Case
 */
export const camelToTitle = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

/**
 * Format sentiment type to display text
 */
export const formatSentiment = (sentiment: SentimentType): string => {
  const sentimentMap: Record<SentimentType, string> = {
    positive: 'Positif',
    negative: 'Negatif',
    neutral: 'Netral',
  };

  return sentimentMap[sentiment] || sentiment;
};

/**
 * Get sentiment color
 */
export const getSentimentColor = (sentiment: SentimentType): string => {
  return SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS.neutral;
};

/**
 * Format employee name for privacy (mask with asterisks)
 */
export const formatEmployeeName = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }

  if (name.length <= 1) {
    return name;
  }

  const firstChar = name.charAt(0).toUpperCase();
  const asterisks = '*'.repeat(Math.min(name.length - 1, 5));
  
  return `${firstChar}${asterisks}`;
};

/**
 * Format insight count with proper pluralization
 */
export const formatInsightCount = (count: number): string => {
  if (count === 0) {
    return 'Tidak ada insight';
  }

  if (count === 1) {
    return '1 insight';
  }

  return `${formatNumber(count)} insights`;
};

/**
 * Format duration in milliseconds to human readable format
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

/**
 * Format URL to display text (remove protocol and www)
 */
export const formatUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '');
  }
};

/**
 * Format phone number (Indonesian format)
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Indonesian phone number formatting
  if (digits.startsWith('62')) {
    // International format
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)} ${digits.slice(9)}`;
  } else if (digits.startsWith('0')) {
    // Local format
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  }

  return phone;
};

/**
 * Format search query for display (highlight terms)
 */
export const formatSearchQuery = (query: string, maxLength: number = 50): string => {
  if (!query || typeof query !== 'string') {
    return '';
  }

  const trimmed = query.trim();
  return truncateText(trimmed, maxLength);
};

/**
 * Format API error message for user display
 */
export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return error.error;
  }

  return 'Terjadi kesalahan yang tidak diketahui';
};

/**
 * Format loading text with dots animation
 */
export const formatLoadingText = (baseText: string = 'Loading', dotCount: number = 3): string => {
  const dots = '.'.repeat(Math.max(0, Math.min(dotCount, 5)));
  return `${baseText}${dots}`;
};

/**
 * Format array to comma-separated string with "and" for last item
 */
export const formatList = (items: string[], maxItems: number = 3): string => {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }

  const filteredItems = items.filter(Boolean);

  if (filteredItems.length === 0) {
    return '';
  }

  if (filteredItems.length === 1) {
    return filteredItems[0];
  }

  if (filteredItems.length <= maxItems) {
    if (filteredItems.length === 2) {
      return `${filteredItems[0]} dan ${filteredItems[1]}`;
    }

    const lastItem = filteredItems.pop();
    return `${filteredItems.join(', ')}, dan ${lastItem}`;
  }

  const visibleItems = filteredItems.slice(0, maxItems);
  const remainingCount = filteredItems.length - maxItems;
  
  return `${visibleItems.join(', ')}, dan ${remainingCount} lainnya`;
};

/**
 * Format sentiment percentages for display
 */
export const formatSentimentPercentages = (
  positive: number,
  negative: number,
  neutral: number
): { positive: string; negative: string; neutral: string } => {
  const total = positive + negative + neutral;
  
  if (total === 0) {
    return {
      positive: '0%',
      negative: '0%',
      neutral: '0%',
    };
  }

  return {
    positive: formatPercentage((positive / total) * 100),
    negative: formatPercentage((negative / total) * 100),
    neutral: formatPercentage((neutral / total) * 100),
  };
};
