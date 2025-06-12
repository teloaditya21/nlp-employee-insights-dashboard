/**
 * @fileoverview Common components export index
 * @description Central export for all common/shared components
 */

// Error handling components
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

// Loading components
export { 
  Loading, 
  InlineLoading, 
  LoadingOverlay, 
  LoadingButton, 
  Skeleton 
} from './Loading';

// Pagination components
export { 
  Pagination, 
  SimplePagination, 
  PaginationInfo 
} from './Pagination';

// Re-export existing components for backward compatibility
// These would be moved here as they get refactored
// export { Header } from './Header';
// export { Sidebar } from './Sidebar';
// export { SearchInput } from './SearchInput';
// export { FilterPanel } from './FilterPanel';
