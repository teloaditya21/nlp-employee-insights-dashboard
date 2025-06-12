/**
 * @fileoverview Pagination management hook
 * @description Custom hook for managing pagination state and logic
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { PaginationState } from '@/types';
import { PAGINATION_CONFIG } from '@/utils/constants';
import { clamp } from '@/utils/helpers';

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  maxPageSize?: number;
  minPageSize?: number;
}

export interface UsePaginationReturn extends PaginationState {
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  goToPage: (page: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  pageNumbers: number[];
  startItem: number;
  endItem: number;
  isEmpty: boolean;
  reset: () => void;
}

/**
 * Custom hook for managing pagination
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    totalItems = 0,
    onPageChange,
    onPageSizeChange,
    maxPageSize = 100,
    minPageSize = 1,
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Calculate derived values
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const hasNext = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPrev = useMemo(() => page > 1, [page]);

  const startItem = useMemo(() => {
    return totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  }, [page, pageSize, totalItems]);

  const endItem = useMemo(() => {
    return Math.min(page * pageSize, totalItems);
  }, [page, pageSize, totalItems]);

  const isEmpty = totalItems === 0;

  // Ensure page is within valid bounds when totalPages changes
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPageState(totalPages);
    }
  }, [page, totalPages]);

  /**
   * Set current page with validation
   */
  const setPage = useCallback((newPage: number) => {
    const validPage = clamp(newPage, 1, totalPages);
    if (validPage !== page) {
      setPageState(validPage);
      onPageChange?.(validPage);
    }
  }, [page, totalPages, onPageChange]);

  /**
   * Set page size with validation
   */
  const setPageSize = useCallback((newPageSize: number) => {
    const validPageSize = clamp(newPageSize, minPageSize, maxPageSize);
    if (validPageSize !== pageSize) {
      setPageSizeState(validPageSize);
      onPageSizeChange?.(validPageSize);
      
      // Adjust current page to maintain position
      const currentItem = (page - 1) * pageSize + 1;
      const newPage = Math.max(1, Math.ceil(currentItem / validPageSize));
      setPage(newPage);
    }
  }, [pageSize, minPageSize, maxPageSize, onPageSizeChange, page, setPage]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (hasNext) {
      setPage(page + 1);
    }
  }, [hasNext, page, setPage]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (hasPrev) {
      setPage(page - 1);
    }
  }, [hasPrev, page, setPage]);

  /**
   * Go to first page
   */
  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  /**
   * Go to last page
   */
  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [setPage, totalPages]);

  /**
   * Go to specific page (alias for setPage)
   */
  const goToPage = useCallback((targetPage: number) => {
    setPage(targetPage);
  }, [setPage]);

  /**
   * Generate array of page numbers for pagination UI
   */
  const pageNumbers = useMemo(() => {
    const maxVisible = PAGINATION_CONFIG.MAX_VISIBLE_PAGES;
    const pages: number[] = [];

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate range around current page
      const halfVisible = Math.floor(maxVisible / 2);
      let start = Math.max(1, page - halfVisible);
      let end = Math.min(totalPages, start + maxVisible - 1);

      // Adjust start if we're near the end
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [page, totalPages]);

  /**
   * Reset pagination to initial state
   */
  const reset = useCallback(() => {
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    page,
    pageSize,
    total: totalItems,
    totalPages,
    hasNext,
    hasPrev,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    goToPage,
    canGoNext: hasNext,
    canGoPrev: hasPrev,
    pageNumbers,
    startItem,
    endItem,
    isEmpty,
    reset,
  };
}

/**
 * Hook for infinite scroll pagination
 */
export function useInfinitePagination(options: {
  pageSize?: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  threshold?: number;
}) {
  const {
    pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    hasNextPage = false,
    isFetchingNextPage = false,
    fetchNextPage,
    threshold = 100, // pixels from bottom
  } = options;

  const [isNearBottom, setIsNearBottom] = useState(false);

  // Scroll event handler
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom <= threshold;
    
    setIsNearBottom(nearBottom);

    // Auto-fetch next page when near bottom
    if (nearBottom && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);

  // Attach scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return {
    isNearBottom,
    loadMore: fetchNextPage,
    canLoadMore: hasNextPage && !isFetchingNextPage,
    isLoading: isFetchingNextPage,
  };
}

/**
 * Hook for cursor-based pagination
 */
export function useCursorPagination<T = string>(options: {
  pageSize?: number;
  initialCursor?: T;
  onCursorChange?: (cursor?: T) => void;
}) {
  const {
    pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    initialCursor,
    onCursorChange,
  } = options;

  const [cursor, setCursorState] = useState<T | undefined>(initialCursor);
  const [cursors, setCursors] = useState<Array<T | undefined>>([initialCursor]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setCursor = useCallback((newCursor?: T) => {
    setCursorState(newCursor);
    onCursorChange?.(newCursor);
  }, [onCursorChange]);

  const nextPage = useCallback((nextCursor: T) => {
    const newIndex = currentIndex + 1;
    setCursors(prev => {
      const newCursors = [...prev];
      newCursors[newIndex] = nextCursor;
      return newCursors;
    });
    setCurrentIndex(newIndex);
    setCursor(nextCursor);
  }, [currentIndex, setCursor]);

  const prevPage = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCursor(cursors[newIndex]);
    }
  }, [currentIndex, cursors, setCursor]);

  const reset = useCallback(() => {
    setCursors([initialCursor]);
    setCurrentIndex(0);
    setCursor(initialCursor);
  }, [initialCursor, setCursor]);

  return {
    cursor,
    pageSize,
    nextPage,
    prevPage,
    canGoPrev: currentIndex > 0,
    reset,
    currentPage: currentIndex + 1,
  };
}
