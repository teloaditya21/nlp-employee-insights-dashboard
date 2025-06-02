/**
 * @fileoverview Application constants
 * @description Centralized constants used throughout the application
 */

import { SentimentType } from '@/types';

// API Configuration (will be updated after ENV_CONFIG is defined)
export const API_CONFIG = {
  BASE_URL: '', // Will be set after ENV_CONFIG is defined
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  BACKGROUND_REFETCH_INTERVAL: 5 * 60 * 1000, // 5 minutes
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_VISIBLE_PAGES: 5,
} as const;

// UI Configuration
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
  TOAST_DURATION: 5000, // 5 seconds
  SKELETON_ANIMATION_DURATION: 1500, // 1.5 seconds
} as const;

// Debounce delay (for backward compatibility)
export const DEBOUNCE_DELAY = UI_CONFIG.DEBOUNCE_DELAY;

// Sentiment Colors
export const SENTIMENT_COLORS: Record<SentimentType, string> = {
  positive: '#10B981', // green-500
  negative: '#EF4444', // red-500
  neutral: '#F59E0B',  // amber-500
} as const;

// Sentiment Background Colors (lighter variants)
export const SENTIMENT_BG_COLORS: Record<SentimentType, string> = {
  positive: '#D1FAE5', // green-100
  negative: '#FEE2E2', // red-100
  neutral: '#FEF3C7',  // amber-100
} as const;

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#3B82F6', // blue-500
  SECONDARY: '#8B5CF6', // violet-500
  SUCCESS: '#10B981', // green-500
  WARNING: '#F59E0B', // amber-500
  ERROR: '#EF4444', // red-500
  INFO: '#06B6D4', // cyan-500
  GRAY: '#6B7280', // gray-500
} as const;

// Status Colors
export const STATUS_COLORS = {
  idle: '#6B7280', // gray-500
  loading: '#3B82F6', // blue-500
  success: '#10B981', // green-500
  error: '#EF4444', // red-500
} as const;

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
} as const;

// Animation Variants
export const ANIMATION_VARIANTS = {
  FADE_IN: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  SLIDE_UP: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  SLIDE_DOWN: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  SCALE: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
} as const;

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  TIME_ONLY: 'HH:mm',
  RELATIVE: 'relative', // for relative time formatting
} as const;

// File Size Limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/csv'],
  MAX_FILES: 5,
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_.-]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  SEARCH: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  FILTERS: 'filters',
  PREFERENCES: 'preferences',
  LAST_ACTIVITY: 'last_activity',
} as const;

// Auth Storage Keys (specific for authentication)
export const AUTH_STORAGE_KEYS = {
  SESSION_TOKEN: 'session_token',
  USER: 'user_data',
  LAST_ACTIVITY: 'last_activity',
} as const;

// Auth Constants
export const AUTH_CONSTANTS = {
  INACTIVITY_TIMEOUT: 60 * 1000, // 1 minute in milliseconds
  SESSION_CHECK_INTERVAL: 30 * 1000, // 30 seconds
  LOGIN_REDIRECT_DELAY: 1000, // 1 second
} as const;

// Query Keys
export const QUERY_KEYS = {
  // Auth
  AUTH: ['auth'],
  SESSION: ['auth', 'session'],
  
  // Insights
  INSIGHTS: ['insights'],
  DASHBOARD_STATS: ['insights', 'dashboard'],
  ALL_INSIGHTS: ['insights', 'all'],
  TOP_POSITIVE: ['insights', 'top-positive'],
  TOP_NEGATIVE: ['insights', 'top-negative'],
  SEARCH_INSIGHTS: (term: string) => ['insights', 'search', term],
  PAGINATED_INSIGHTS: (page: number, limit: number) => ['insights', 'paginated', page, limit],
  
  // Bookmarks
  BOOKMARKS: ['bookmarks'],
  BOOKMARKED_INSIGHTS: ['bookmarks', 'insights'],
  
  // Kota Summary
  KOTA_SUMMARY: ['kota-summary'],
  KOTA_BY_NAME: (name: string) => ['kota-summary', 'by-name', name],
  TOP_KOTA: (limit: number) => ['kota-summary', 'top', limit],
  
  // Page Context
  PAGE_CONTEXT: ['page-context'],
  AI_CONCLUSION: ['ai-conclusion'],
  
  // Health Check
  HEALTH: ['health'],
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  
  // Auth specific
  INVALID_CREDENTIALS: 'Invalid username or password.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
  
  // Form specific
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in.',
  LOGOUT_SUCCESS: 'Successfully logged out.',
  SAVE_SUCCESS: 'Changes saved successfully.',
  DELETE_SUCCESS: 'Item deleted successfully.',
  UPDATE_SUCCESS: 'Item updated successfully.',
  BOOKMARK_ADDED: 'Insight bookmarked successfully.',
  BOOKMARK_REMOVED: 'Bookmark removed successfully.',
  EXPORT_SUCCESS: 'Data exported successfully.',
  IMPORT_SUCCESS: 'Data imported successfully.',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_DARK_MODE: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_EXPORT: true,
  ENABLE_REAL_TIME_UPDATES: false,
  ENABLE_VOICE_SEARCH: false,
  ENABLE_ADVANCED_FILTERS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_AI_INSIGHTS: true,
} as const;

// Environment Configuration
const getEnvironment = (): 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' => {
  if (typeof window !== 'undefined') {
    // Client-side environment detection
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'DEVELOPMENT';
    }
    if (window.location.hostname.includes('staging')) {
      return 'STAGING';
    }
    return 'PRODUCTION';
  }
  // Server-side environment detection
  return (import.meta.env?.MODE === 'development') ? 'DEVELOPMENT' : 'PRODUCTION';
};

export const ENV_CONFIG = {
  DEVELOPMENT: {
    API_BASE_URL: import.meta.env?.VITE_API_BASE_URL || 'https://employee-insights-api.adityalasika.workers.dev',
    ENABLE_LOGGING: true,
    ENABLE_DEBUG: true,
  },
  STAGING: {
    API_BASE_URL: import.meta.env?.VITE_API_BASE_URL || 'https://staging-api.example.com',
    ENABLE_LOGGING: true,
    ENABLE_DEBUG: false,
  },
  PRODUCTION: {
    API_BASE_URL: import.meta.env?.VITE_API_BASE_URL || 'https://employee-insights-api.adityalasika.workers.dev',
    ENABLE_LOGGING: false,
    ENABLE_DEBUG: false,
  },
} as const;

// Current environment
export const CURRENT_ENV = getEnvironment();
export const CURRENT_CONFIG = ENV_CONFIG[CURRENT_ENV];

// Update API_CONFIG with environment-specific URL
Object.assign(API_CONFIG, {
  BASE_URL: CURRENT_CONFIG.API_BASE_URL,
});

// Debug logging
console.log('=== API CONFIGURATION DEBUG ===');
console.log('Environment Mode:', import.meta.env?.MODE);
console.log('VITE_API_BASE_URL:', import.meta.env?.VITE_API_BASE_URL);
console.log('Detected Environment:', CURRENT_ENV);
console.log('API Base URL:', API_CONFIG.BASE_URL);
console.log('Environment Config:', CURRENT_CONFIG);
console.log('=== END DEBUG ===');

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/.+/,
  USERNAME: /^[a-zA-Z0-9_.-]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d+)?$/,
} as const;

// Application Metadata
export const APP_METADATA = {
  NAME: 'SentimentSphere',
  VERSION: '1.0.0',
  DESCRIPTION: 'Employee Insights and Sentiment Analysis Platform',
  AUTHOR: 'SentimentSphere Team',
  COPYRIGHT: '© 2024 SentimentSphere. All rights reserved.',
} as const;
