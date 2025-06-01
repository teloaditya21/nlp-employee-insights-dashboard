/**
 * @fileoverview Insights service
 * @description Service class for insights-related API operations
 */

import { 
  ApiResponse, 
  PaginatedApiResponse, 
  InsightSummary, 
  DashboardStats, 
  EmployeeInsight,
  FilterOptions 
} from '@/types';
import { apiClient } from './apiClient';
import { createUrlWithParams } from '@/utils/helpers';

/**
 * Insights service class
 */
export class InsightsService {
  private readonly basePath = '/api/insights';

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>(`${this.basePath}/dashboard`);
  }

  /**
   * Get all insights summary
   */
  async getAllInsights(): Promise<ApiResponse<InsightSummary[]>> {
    return apiClient.get<InsightSummary[]>(`${this.basePath}/summary`);
  }

  /**
   * Get top positive insights
   */
  async getTopPositiveInsights(limit?: number): Promise<ApiResponse<InsightSummary[]>> {
    const params = limit ? { limit: limit.toString() } : {};
    const url = createUrlWithParams(`${this.basePath}/top-positive`, params);
    return apiClient.get<InsightSummary[]>(url);
  }

  /**
   * Get top negative insights
   */
  async getTopNegativeInsights(limit?: number): Promise<ApiResponse<InsightSummary[]>> {
    const params = limit ? { limit: limit.toString() } : {};
    const url = createUrlWithParams(`${this.basePath}/top-negative`, params);
    return apiClient.get<InsightSummary[]>(url);
  }

  /**
   * Search insights by word
   */
  async searchInsights(searchTerm: string): Promise<ApiResponse<InsightSummary[]>> {
    const encodedTerm = encodeURIComponent(searchTerm);
    return apiClient.get<InsightSummary[]>(`${this.basePath}/search/${encodedTerm}`);
  }

  /**
   * Get paginated insights
   */
  async getPaginatedInsights(
    page: number = 1, 
    limit: number = 10,
    filters?: FilterOptions
  ): Promise<PaginatedApiResponse<InsightSummary[]>> {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    // Add filters to params
    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.sentiment && filters.sentiment !== 'all') params.sentiment = filters.sentiment;
      if (filters.witel) params.witel = filters.witel;
      if (filters.source) params.source = filters.source;
      if (filters.dateRange?.from) params.date_from = filters.dateRange.from.toISOString();
      if (filters.dateRange?.to) params.date_to = filters.dateRange.to.toISOString();
      if (filters.topics && filters.topics.length > 0) params.topics = filters.topics.join(',');
    }

    const url = createUrlWithParams(`${this.basePath}/paginated`, params);
    return apiClient.get<InsightSummary[]>(url);
  }

  /**
   * Get insight details by ID
   */
  async getInsightById(id: number): Promise<ApiResponse<InsightSummary>> {
    return apiClient.get<InsightSummary>(`${this.basePath}/${id}`);
  }

  /**
   * Get insights by word
   */
  async getInsightsByWord(word: string): Promise<ApiResponse<InsightSummary[]>> {
    const encodedWord = encodeURIComponent(word);
    return apiClient.get<InsightSummary[]>(`${this.basePath}/word/${encodedWord}`);
  }

  /**
   * Get employee insights with filters
   */
  async getEmployeeInsights(filters?: {
    page?: number;
    limit?: number;
    witel?: string;
    source?: string;
    sentiment?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaginatedApiResponse<EmployeeInsight[]>> {
    const params: Record<string, string> = {};

    if (filters) {
      if (filters.page) params.page = filters.page.toString();
      if (filters.limit) params.limit = filters.limit.toString();
      if (filters.witel) params.witel = filters.witel;
      if (filters.source) params.source = filters.source;
      if (filters.sentiment) params.sentiment = filters.sentiment;
      if (filters.search) params.search = filters.search;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
    }

    const url = createUrlWithParams(`${this.basePath}/employee`, params);
    return apiClient.get<EmployeeInsight[]>(url);
  }

  /**
   * Get employee insights statistics
   */
  async getEmployeeInsightsStats(filters?: {
    witel?: string;
    source?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{
    totalCount: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
  }>> {
    const params: Record<string, string> = {};

    if (filters) {
      if (filters.witel) params.witel = filters.witel;
      if (filters.source) params.source = filters.source;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
    }

    const url = createUrlWithParams(`${this.basePath}/employee/stats`, params);
    return apiClient.get(url);
  }

  /**
   * Get top insights for sidebar
   */
  async getTopInsightsForSidebar(limit: number = 10): Promise<ApiResponse<InsightSummary[]>> {
    const params = { limit: limit.toString() };
    const url = createUrlWithParams(`${this.basePath}/top-10`, params);
    return apiClient.get<InsightSummary[]>(url);
  }

  /**
   * Get insights for word cloud
   */
  async getWordCloudData(limit?: number): Promise<ApiResponse<Array<{
    tag: string;
    weight: number;
  }>>> {
    const params = limit ? { limit: limit.toString() } : {};
    const url = createUrlWithParams(`${this.basePath}/wordcloud`, params);
    return apiClient.get(url);
  }

  /**
   * Export insights data
   */
  async exportInsights(
    format: 'csv' | 'xlsx' | 'json',
    filters?: FilterOptions
  ): Promise<ApiResponse<{ downloadUrl: string; filename: string }>> {
    const params: Record<string, string> = { format };

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.sentiment && filters.sentiment !== 'all') params.sentiment = filters.sentiment;
      if (filters.witel) params.witel = filters.witel;
      if (filters.source) params.source = filters.source;
      if (filters.dateRange?.from) params.date_from = filters.dateRange.from.toISOString();
      if (filters.dateRange?.to) params.date_to = filters.dateRange.to.toISOString();
      if (filters.topics && filters.topics.length > 0) params.topics = filters.topics.join(',');
    }

    return apiClient.post(`${this.basePath}/export`, params);
  }

  /**
   * Get insights analytics
   */
  async getInsightsAnalytics(
    timeframe: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<ApiResponse<{
    totalInsights: number;
    sentimentBreakdown: {
      positive: { count: number; percentage: number };
      negative: { count: number; percentage: number };
      neutral: { count: number; percentage: number };
    };
    timeSeriesData: Array<{
      date: string;
      positive: number;
      negative: number;
      neutral: number;
      total: number;
    }>;
    topSources: Array<{
      source: string;
      count: number;
      percentage: number;
    }>;
    topLocations: Array<{
      location: string;
      count: number;
      percentage: number;
    }>;
  }>> {
    const params = { timeframe };
    const url = createUrlWithParams(`${this.basePath}/analytics`, params);
    return apiClient.get(url);
  }

  /**
   * Health check for insights service
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return apiClient.get(`${this.basePath}/health`);
  }
}

// Export singleton instance
export const insightsService = new InsightsService();
export default insightsService;
