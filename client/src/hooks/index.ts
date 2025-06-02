/**
 * @fileoverview Hooks export index
 * @description Central export for all custom hooks
 */

// Enhanced API hooks
export * from './useApi';

// Filter management hooks
export * from './useFilters';

// Pagination hooks
export * from './usePagination';

// Error handling hooks
export * from './useErrorHandler';

// Authentication hooks (enhanced)
export * from './use-auth';

// Existing hooks (re-export for backward compatibility)
export * from './useBookmarks';
export {
  useDashboardStats,
  useAllInsights,
  useTopPositiveInsights,
  useTopNegativeInsights,
  useSearchInsights,
  useFilteredInsights,
  usePaginatedInsights,
  useHealthCheck,
  convertToInsightData
} from './useEmployeeInsights';
export * from './useKotaSummary';
export * from './usePageContext';

// UI hooks
export * from './use-mobile';
export * from './use-toast';

// Additional utility hooks that could be added
// export * from './useLocalStorage';
// export * from './useDebounce';
// export * from './useTheme';
// export * from './useMediaQuery';
