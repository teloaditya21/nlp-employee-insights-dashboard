/**
 * @fileoverview Common TypeScript type definitions
 * @description Shared types used across the application
 */

import { ReactNode } from 'react';
import { DateRange } from 'react-day-picker';

// Base Types
export type ID = string | number;

export type Status = 'idle' | 'loading' | 'success' | 'error';

export type SentimentType = 'positive' | 'negative' | 'neutral';

export type PageType = 'survey-dashboard' | 'my-insights' | 'top-insights' | 'smart-analytics' | 'settings';

// Generic Response Wrapper
export interface ResponseWrapper<T> {
  data: T;
  status: Status;
  error?: string;
  timestamp: string;
}

// Loading State
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated?: string;
}

// Pagination
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
}

// Filter Types
export interface BaseFilter {
  id: string;
  label: string;
  value: string;
}

export interface SelectOption extends BaseFilter {
  disabled?: boolean;
  group?: string;
}

export interface FilterState {
  search: string;
  sentiment: SentimentType | 'all';
  dateRange?: DateRange;
  location: string;
  source: string;
  topics: string[];
}

// Sort Types
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface SortableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  defaultSort?: SortDirection;
}

// Component Props Base Types
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  testId?: string;
}

export interface WithLoading {
  isLoading?: boolean;
  loadingText?: string;
}

export interface WithError {
  error?: string | null;
  onRetry?: () => void;
}

// Event Handler Types
export type EventHandler<T = void> = (event?: T) => void;
export type AsyncEventHandler<T = void> = (event?: T) => Promise<void>;

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Modal/Dialog Types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

// Toast/Notification Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

// Date/Time Types
export interface DateTimeRange {
  start: Date;
  end: Date;
}

export interface TimeRange {
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
}

// Metrics/Analytics Types
export interface MetricValue {
  value: number;
  label: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'percentage' | 'currency' | 'duration';
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  data: ChartDataPoint[];
  options?: Record<string, any>;
}

// Search Types
export interface SearchConfig {
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
  maxResults?: number;
  caseSensitive?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: Array<{
    field: string;
    value: string;
    indices: [number, number][];
  }>;
}

// File/Upload Types
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Validation Types
export type ValidationRule<T> = (value: T) => string | null;

export interface ValidationSchema<T> {
  [K in keyof T]?: ValidationRule<T[K]>[];
}

// Environment Types
export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  environment: Environment;
  apiBaseUrl: string;
  version: string;
  features: Record<string, boolean>;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  stack?: string;
}

// Constants
export const SENTIMENT_COLORS = {
  positive: '#10B981', // green-500
  negative: '#EF4444', // red-500
  neutral: '#F59E0B',  // amber-500
} as const;

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export const DEBOUNCE_DELAY = 300; // milliseconds

export const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const DEFAULT_CACHE_TIME = 10 * 60 * 1000; // 10 minutes
