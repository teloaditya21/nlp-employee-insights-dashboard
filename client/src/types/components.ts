/**
 * @fileoverview Component-specific TypeScript type definitions
 * @description Type definitions for React components and their props
 */

import { ReactNode } from 'react';
import { DateRange } from 'react-day-picker';
import { BaseComponentProps, SelectOption, SentimentType, LoadingState, WithError } from './common';

// Header Component Types
export interface HeaderProps extends BaseComponentProps {
  title: string;
  totalInsights?: number;
  showFilters?: boolean;
  showSourceFilter?: boolean;
  showSurveyFilter?: boolean;
  showDateFilter?: boolean;
  sourceValue?: string;
  surveyValue?: string;
  dateRangeValue?: DateRange;
  wordInsightValue?: string;
  sentimentValue?: string;
  sourceOptions?: SelectOption[];
  surveyOptions?: SelectOption[];
  wordInsightOptions?: SelectOption[];
  sentimentOptions?: SelectOption[];
  onSourceChange?: (value: string) => void;
  onSurveyChange?: (value: string) => void;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onWordInsightChange?: (value: string) => void;
  onSentimentChange?: (value: string) => void;
}

// Insight Card Types
export interface InsightData {
  id: number;
  title: string;
  neutralPercentage: number;
  negativePercentage: number;
  positivePercentage: number;
  views: number;
  comments: number;
  sentiment?: SentimentType;
  isBookmarked?: boolean;
  bookmarkedAt?: string;
}

export interface SentimentCategoryCardProps extends BaseComponentProps {
  title: string;
  badge: number;
  type: SentimentType;
  insights: InsightData[];
  onPinInsight?: (insight: InsightData) => void;
  onRemoveInsight?: (insightId: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  maxDisplayed?: number;
}

export interface InsightCardProps extends BaseComponentProps {
  insight: InsightData;
  onPin?: (insight: InsightData) => void;
  onRemove?: (insightId: number) => void;
  showBookmarkButton?: boolean;
  showRemoveButton?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

// AI Conclusion Component Types
export interface AIConclusionProps extends BaseComponentProps {
  conclusion?: string;
  isGenerating?: boolean;
  onGenerate?: () => void;
  currentPage?: string;
  showRefreshButton?: boolean;
  autoGenerate?: boolean;
  maxLength?: number;
}

// Chatbot Component Types
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'error' | 'loading';
}

export interface ChatbotProps extends BaseComponentProps {
  isOpen?: boolean;
  onToggle?: () => void;
  placeholder?: string;
  maxMessages?: number;
  enableVoice?: boolean;
  enableFileUpload?: boolean;
}

// Sidebar Component Types
export interface SidebarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  path: string;
  badge?: number;
  disabled?: boolean;
  children?: SidebarItem[];
}

export interface SidebarProps extends BaseComponentProps {
  items: SidebarItem[];
  currentPath: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showUserInfo?: boolean;
  userInfo?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

// Table Component Types
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
  className?: string;
}

export interface TableProps<T = any> extends BaseComponentProps, LoadingState, WithError {
  columns: TableColumn<T>[];
  data: T[];
  sortable?: boolean;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onRowSelect?: (rowId: string | number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  emptyMessage?: string;
  rowKey?: keyof T | ((row: T) => string | number);
  stickyHeader?: boolean;
  maxHeight?: string | number;
}

// Pagination Component Types
export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSizeSelector?: boolean;
  showItemCount?: boolean;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  pageSizeOptions?: number[];
}

// Filter Component Types
export interface FilterProps extends BaseComponentProps {
  filters: {
    search?: string;
    sentiment?: SentimentType | 'all';
    dateRange?: DateRange;
    location?: string;
    source?: string;
    topics?: string[];
  };
  onFiltersChange: (filters: any) => void;
  availableOptions?: {
    locations?: SelectOption[];
    sources?: SelectOption[];
    topics?: SelectOption[];
  };
  showAdvancedFilters?: boolean;
  onResetFilters?: () => void;
}

// Chart Component Types
export interface ChartProps extends BaseComponentProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  data: any;
  options?: any;
  width?: string | number;
  height?: string | number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  onDataPointClick?: (dataPoint: any, index: number) => void;
}

// Word Cloud Component Types
export interface WordCloudData {
  tag: string;
  weight: number;
  color?: string;
}

export interface WordCloudProps extends BaseComponentProps {
  data: WordCloudData[];
  width?: string | number;
  height?: string | number;
  title?: string;
  colorScheme?: string[];
  minFontSize?: number;
  maxFontSize?: number;
  onWordClick?: (word: WordCloudData) => void;
}

// Map Component Types
export interface MapRegion {
  id: string;
  name: string;
  value: number;
  sentiment: SentimentType;
  coordinates?: [number, number][];
}

export interface MapProps extends BaseComponentProps {
  regions: MapRegion[];
  onRegionClick?: (region: MapRegion) => void;
  onRegionHover?: (region: MapRegion | null) => void;
  colorScheme?: Record<SentimentType, string>;
  showTooltip?: boolean;
  showLegend?: boolean;
  zoomEnabled?: boolean;
  panEnabled?: boolean;
}

// Skeleton Component Types
export interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
}

// Modal Component Types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
  preventScroll?: boolean;
}

// Form Component Types
export interface FormFieldProps extends BaseComponentProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

// Search Component Types
export interface SearchProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
  showClearButton?: boolean;
  showSearchIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled';
  onSubmit?: (value: string) => void;
  onClear?: () => void;
}

// Badge Component Types
export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  dot?: boolean;
  pulse?: boolean;
}

// Button Component Types
export interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

// Error Boundary Component Types
export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

// Layout Component Types
export interface LayoutProps extends BaseComponentProps {
  sidebar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

// Loading Component Types
export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'bars' | 'pulse';
  text?: string;
  overlay?: boolean;
  fullScreen?: boolean;
}
