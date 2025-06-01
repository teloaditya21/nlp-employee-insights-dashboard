/**
 * @fileoverview Central type definitions export
 * @description Re-exports all type definitions for easy importing
 */

// API Types
export type {
  BaseApiResponse,
  ApiResponse,
  PaginatedApiResponse,
  InsightSummary,
  DashboardStats,
  EmployeeInsight,
  EmployeeInsightStats,
  KotaSummary,
  BookmarkedInsight,
  PageContextData,
  AIConclusion,
  ApiError,
  LoginRequest,
  BookmarkRequest,
  FilterOptions,
  QueryKey,
  ApiEndpoint,
} from './api';

// Authentication Types
export type {
  User,
  SessionData,
  SessionValidationResponse,
  AuthState,
  AuthAction,
  LoginCredentials,
  LoginResponse,
  LogoutResponse,
  Permission,
  UserPermissions,
  RolePermissions,
  UseAuthReturn,
  ProtectedRouteProps,
  AuthContextType,
  TokenPayload,
  RefreshTokenResponse,
  AuthErrorCode,
  AuthError,
} from './auth';

export { AUTH_STORAGE_KEYS, AUTH_CONSTANTS } from './auth';

// Common Types
export type {
  ID,
  Status,
  SentimentType,
  PageType,
  ResponseWrapper,
  LoadingState,
  PaginationState,
  PaginationProps,
  BaseFilter,
  SelectOption,
  FilterState,
  SortDirection,
  SortState,
  SortableColumn,
  BaseComponentProps,
  WithLoading,
  WithError,
  EventHandler,
  AsyncEventHandler,
  FormField,
  FormState,
  ModalProps,
  ToastType,
  ToastMessage,
  ThemeMode,
  ThemeConfig,
  Optional,
  RequiredFields,
  DeepPartial,
  NonEmptyArray,
  DateTimeRange,
  TimeRange,
  MetricValue,
  ChartDataPoint,
  ChartConfig,
  SearchConfig,
  SearchResult,
  FileInfo,
  UploadProgress,
  ValidationRule,
  ValidationSchema,
  Environment,
  AppConfig,
  AppError,
} from './common';

export { SENTIMENT_COLORS, PAGE_SIZES, DEBOUNCE_DELAY, DEFAULT_STALE_TIME, DEFAULT_CACHE_TIME } from './common';

// Component Types
export type {
  HeaderProps,
  InsightData,
  SentimentCategoryCardProps,
  InsightCardProps,
  AIConclusionProps,
  ChatMessage,
  ChatbotProps,
  SidebarItem,
  SidebarProps,
  TableColumn,
  TableProps,
  FilterProps,
  ChartProps,
  WordCloudData,
  WordCloudProps,
  MapRegion,
  MapProps,
  SkeletonProps,
  FormFieldProps,
  SearchProps,
  BadgeProps,
  ButtonProps,
  ErrorBoundaryProps,
  ErrorBoundaryState,
  LayoutProps,
  LoadingProps,
} from './components';

// Insights Types
export type {
  BaseInsight,
  CategoryInsights,
  AnalyticsData,
  MonthlyInsightData,
  PieChartData,
  TrendInsight,
  SentimentTrendData,
  TopInsightData,
  WordCloudDataPoint,
  MapDataPoint,
  InsightFilters,
  InsightSearchResult,
  InsightAggregation,
  InsightMetrics,
  InsightExportOptions,
  InsightExportResult,
  InsightComparison,
  InsightAlert,
  InsightRecommendation,
  InsightConfig,
  InsightValidationRule,
  InsightValidationResult,
} from './insights';

// Kota Summary Types (re-export existing)
export type {
  KotaSummaryApiResponse,
  KotaSummaryRefreshResponse,
} from './kota-summary';

// Type Guards
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error.message === 'string';
};

export const isAuthError = (error: any): error is AuthError => {
  return error && typeof error.code === 'string' && typeof error.message === 'string';
};

export const isSentimentType = (value: any): value is SentimentType => {
  return ['positive', 'negative', 'neutral'].includes(value);
};

export const isValidStatus = (value: any): value is Status => {
  return ['idle', 'loading', 'success', 'error'].includes(value);
};

// Utility Types for React Query
export type QueryKeyFactory = {
  all: readonly string[];
  lists: () => readonly string[];
  list: (filters?: any) => readonly string[];
  details: () => readonly string[];
  detail: (id: string | number) => readonly string[];
};

// Hook Return Types
export interface UseQueryReturn<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isRefetching: boolean;
}

export interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isSuccess: boolean;
  data: TData | undefined;
  reset: () => void;
}

// Form Hook Types
export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => void;
  reset: (values?: Partial<T>) => void;
  validate: () => boolean;
}

// Context Types
export interface AppContextType {
  user: User | null;
  theme: ThemeMode;
  config: AppConfig;
  setTheme: (theme: ThemeMode) => void;
  updateConfig: (config: Partial<AppConfig>) => void;
}

// Store Types (for state management)
export interface AppStore {
  auth: AuthState;
  insights: {
    data: InsightData[];
    filters: InsightFilters;
    loading: boolean;
    error: string | null;
  };
  ui: {
    sidebarCollapsed: boolean;
    theme: ThemeMode;
    notifications: ToastMessage[];
  };
}

// Action Types for Reducers
export type AppAction = 
  | AuthAction
  | { type: 'SET_INSIGHTS'; payload: InsightData[] }
  | { type: 'SET_FILTERS'; payload: InsightFilters }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: ThemeMode }
  | { type: 'ADD_NOTIFICATION'; payload: ToastMessage }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

// Constants for Type Safety
export const SENTIMENT_TYPES = ['positive', 'negative', 'neutral'] as const;
export const PAGE_TYPES = ['survey-dashboard', 'my-insights', 'top-insights', 'smart-analytics', 'settings'] as const;
export const THEME_MODES = ['light', 'dark', 'system'] as const;
export const TOAST_TYPES = ['success', 'error', 'warning', 'info'] as const;
