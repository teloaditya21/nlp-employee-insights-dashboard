/**
 * @fileoverview Top Insights Table Component
 * @description Enhanced data table for displaying employee insights with pagination
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/common';
import { Loading } from '@/components/common';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Users, Calendar, MapPin, MessageSquare } from 'lucide-react';
import { formatNumber, formatDate, getSentimentColor } from '@/utils/formatters';
import { SentimentType } from '@/types';

interface TopInsight {
  id: number;
  location: string;
  source: string;
  employee: string;
  sentiment: SentimentType;
  insight: string;
  date: string;
  rawDate: string;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

interface TopInsightsTableProps {
  insights: TopInsight[];
  isLoading?: boolean;
  pagination: PaginationInfo;
  hasActiveFilters?: boolean;
  className?: string;
}

/**
 * Top insights table component
 */
const TopInsightsTable: React.FC<TopInsightsTableProps> = ({
  insights,
  isLoading = false,
  pagination,
  hasActiveFilters = false,
  className,
}) => {
  // Get sentiment badge variant
  const getSentimentBadgeVariant = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'positive':
        return 'default';
      case 'negative':
        return 'destructive';
      case 'neutral':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  // Get sentiment display text
  const getSentimentText = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'positive':
        return 'Positive';
      case 'negative':
        return 'Negative';
      case 'neutral':
        return 'Neutral';
      default:
        return sentiment;
    }
  };

  // Truncate insight text
  const truncateInsight = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  if (isLoading && insights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Loading
            variant="spinner"
            text="Loading insights data..."
            className="py-12"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Employee Insights Data
          </CardTitle>
          <div className="text-sm text-gray-600">
            {hasActiveFilters ? (
              <>
                Showing {formatNumber(insights.length)} of {formatNumber(pagination.totalItems)} insights (filtered)
              </>
            ) : (
              <>
                {formatNumber(pagination.totalItems)} total insights
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Empty State */}
        {insights.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No insights found
            </h3>
            <p className="text-gray-600">
              {hasActiveFilters
                ? 'No insights match your current filters. Try adjusting your search criteria.'
                : 'No insights are available at the moment.'}
            </p>
          </div>
        )}

        {/* Data Table */}
        {insights.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">No</TableHead>
                    <TableHead className="min-w-[120px]">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Location
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[100px]">Source</TableHead>
                    <TableHead className="min-w-[120px]">Employee</TableHead>
                    <TableHead className="min-w-[200px]">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        Insight
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[100px]">Sentiment</TableHead>
                    <TableHead className="min-w-[100px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Date
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insights.map((insight, index) => {
                    const rowNumber = (pagination.currentPage - 1) * pagination.pageSize + index + 1;
                    
                    return (
                      <TableRow 
                        key={insight.id} 
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <TableCell className="font-medium text-gray-600">
                          {rowNumber}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{insight.location}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {insight.source}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="font-mono text-sm">{insight.employee}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="max-w-[300px]">
                          <div className="group relative">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {truncateInsight(insight.insight, 150)}
                            </p>
                            {insight.insight.length > 150 && (
                              <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded p-2 bottom-full left-0 mb-1 max-w-xs">
                                {insight.insight}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge 
                            variant={getSentimentBadgeVariant(insight.sentiment)}
                            className="text-xs"
                          >
                            {getSentimentText(insight.sentiment)}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{insight.date}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <Loading variant="spinner" text="Loading..." />
              </div>
            )}

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.onPageChange}
                onPageSizeChange={pagination.onPageSizeChange}
                showPageSizeSelector={true}
                showItemCount={true}
                showFirstLast={true}
                showPrevNext={true}
                maxVisiblePages={5}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </>
        )}

        {/* Filter Status */}
        {hasActiveFilters && insights.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-700">
                  <strong>Filtered Results:</strong> You're viewing filtered data. 
                  Showing {formatNumber(insights.length)} insights out of {formatNumber(pagination.totalItems)} total.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatNumber(pagination.totalItems)}</p>
            <p className="text-sm text-gray-600">Total Insights</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{pagination.currentPage}</p>
            <p className="text-sm text-gray-600">Current Page</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{pagination.totalPages}</p>
            <p className="text-sm text-gray-600">Total Pages</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(TopInsightsTable);
