/**
 * @fileoverview Enhanced Pagination component
 * @description Improved pagination component with better accessibility and features
 */

import React from 'react';
import { PaginationProps } from '@/types/components';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils';
import { PAGINATION_CONFIG } from '@/utils/constants';

/**
 * Enhanced Pagination component
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = false,
  showItemCount = true,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = PAGINATION_CONFIG.MAX_VISIBLE_PAGES,
  pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS,
  className,
  testId,
}) => {
  // Calculate visible page numbers
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    // Always show first page
    pages.push(1);

    let start = Math.max(2, currentPage - halfVisible);
    let end = Math.min(totalPages - 1, currentPage + halfVisible);

    // Adjust range if we're near the beginning or end
    if (currentPage <= halfVisible + 1) {
      end = Math.min(totalPages - 1, maxVisiblePages - 1);
    } else if (currentPage >= totalPages - halfVisible) {
      start = Math.max(2, totalPages - maxVisiblePages + 2);
    }

    // Add ellipsis before start if needed
    if (start > 2) {
      pages.push('ellipsis');
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis after end if needed
    if (end < totalPages - 1) {
      pages.push('ellipsis');
    }

    // Always show last page (if not already included)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize, 10);
    if (onPageSizeChange && size !== pageSize) {
      onPageSizeChange(size);
    }
  };

  if (totalPages <= 1 && !showPageSizeSelector && !showItemCount) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 px-2',
        className
      )}
      data-testid={testId}
    >
      {/* Item count and page size selector */}
      <div className="flex items-center gap-4 text-sm text-gray-700">
        {showItemCount && totalItems > 0 && (
          <span>
            Showing {startItem} to {endItem} of {totalItems.toLocaleString()} results
          </span>
        )}
        
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              aria-label="Go to first page"
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Previous page button */}
          {showPrevNext && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Page number buttons */}
          <div className="flex items-center gap-1">
            {visiblePages.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <div
                    key={`ellipsis-${index}`}
                    className="flex h-8 w-8 items-center justify-center"
                    aria-hidden="true"
                  >
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </div>
                );
              }

              const isCurrentPage = page === currentPage;
              
              return (
                <Button
                  key={page}
                  variant={isCurrentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  aria-label={`Go to page ${page}`}
                  aria-current={isCurrentPage ? "page" : undefined}
                  className={cn(
                    "h-8 w-8 p-0",
                    isCurrentPage && "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {page}
                </Button>
              );
            })}
          </div>

          {/* Next page button */}
          {showPrevNext && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Last page button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Go to last page"
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Simple pagination component (numbers only)
 */
export const SimplePagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
  className?: string;
}> = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  maxVisible = 5,
  className 
}) => {
  const getVisiblePages = (): number[] => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {visiblePages.map((page) => {
        const isCurrentPage = page === currentPage;
        
        return (
          <Button
            key={page}
            variant={isCurrentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={cn(
              "h-8 w-8 p-0",
              isCurrentPage && "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {page}
          </Button>
        );
      })}
    </div>
  );
};

/**
 * Pagination info component
 */
export const PaginationInfo: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  className?: string;
}> = ({ currentPage, totalPages, totalItems, pageSize, className }) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={cn("text-sm text-gray-700", className)}>
      Showing {startItem} to {endItem} of {totalItems.toLocaleString()} results
      {totalPages > 1 && (
        <span className="ml-2">
          (Page {currentPage} of {totalPages})
        </span>
      )}
    </div>
  );
};

export default Pagination;
