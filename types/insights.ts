/**
 * @fileoverview Insights-specific TypeScript type definitions
 * @description Type definitions for insights, analytics, and related data structures
 */

import { SentimentType } from './common';

// Core Insight Types
export interface BaseInsight {
  id: number;
  created_at: string;
  updated_at?: string;
}

export interface InsightSummary extends BaseInsight {
  word_insight: string;
  total_count: number;
  positif_count: number;
  negatif_count: number;
  netral_count: number;
  positif_percentage: number;
  negatif_percentage: number;
  netral_percentage: number;
}

export interface EmployeeInsight extends BaseInsight {
  employee_name: string;
  witel: string;
  source: string;
  sentence_insight: string;
  word_insight: string;
  sentimen: SentimentType;
}

export interface TopInsight extends BaseInsight {
  word_insight: string;
  total_count: number;
  rank?: number;
}

// Insight Data for UI Components
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
  source?: string;
  location?: string;
  employee?: string;
  date?: string;
}

// Categorized Insights
export interface CategoryInsights {
  neutral: InsightData[];
  negative: InsightData[];
  positive: InsightData[];
  additional?: InsightData[];
}

// Dashboard Statistics
export interface DashboardStats {
  total_insights: number;
  total_feedback: number;
  positive_ratio: number;
  negative_ratio: number;
  neutral_ratio: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  top_positive_insights: InsightSummary[];
  top_negative_insights: InsightSummary[];
  all_insights: InsightSummary[];
}

// Analytics Data
export interface AnalyticsData {
  totalEmployees: number;
  totalInsights: number;
  totalNegative: number;
  totalPositive: number;
  totalNeutral: number;
  monthlyData: MonthlyInsightData[];
  pieData: PieChartData[];
  trendInsights: TrendInsight[];
  topKeywords: string[];
  sentimentTrend: SentimentTrendData[];
}

export interface MonthlyInsightData {
  name: string;
  month: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface PieChartData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface TrendInsight {
  id: number;
  city: string;
  source: string;
  employee: string;
  sentiment: SentimentType;
  date: string;
  insight: string;
  score?: number;
}

export interface SentimentTrendData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

// Top Insights Data
export interface TopInsightData {
  insights: TopInsight[];
  totalCount: number;
  wordCloudSvg?: string;
  wordCloudData?: WordCloudDataPoint[];
  mapData?: MapDataPoint[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
}

export interface WordCloudDataPoint {
  tag: string;
  weight: number;
  color?: string;
  sentiment?: SentimentType;
}

export interface MapDataPoint {
  region: string;
  value: number;
  sentiment: SentimentType;
  coordinates?: [number, number];
  details?: {
    positive: number;
    negative: number;
    neutral: number;
    total: number;
  };
}

// Insight Filters
export interface InsightFilters {
  search?: string;
  sentiment?: SentimentType | 'all';
  dateRange?: {
    from: Date;
    to: Date;
  };
  location?: string;
  source?: string;
  topics?: string[];
  employee?: string;
  witel?: string;
  minCount?: number;
  maxCount?: number;
}

// Insight Search
export interface InsightSearchResult {
  insights: InsightSummary[];
  totalCount: number;
  searchTerm: string;
  suggestions?: string[];
  filters?: InsightFilters;
}

// Insight Aggregations
export interface InsightAggregation {
  field: string;
  buckets: Array<{
    key: string;
    count: number;
    percentage: number;
  }>;
}

export interface InsightMetrics {
  totalInsights: number;
  sentimentBreakdown: {
    positive: { count: number; percentage: number };
    negative: { count: number; percentage: number };
    neutral: { count: number; percentage: number };
  };
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
  topKeywords: Array<{
    keyword: string;
    count: number;
    sentiment: SentimentType;
  }>;
  timeDistribution: Array<{
    period: string;
    count: number;
    sentiment_breakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }>;
}

// Insight Export
export interface InsightExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  filters?: InsightFilters;
  fields?: string[];
  includeCharts?: boolean;
  includeSummary?: boolean;
}

export interface InsightExportResult {
  url: string;
  filename: string;
  size: number;
  expiresAt: string;
}

// Insight Comparison
export interface InsightComparison {
  baseline: InsightMetrics;
  comparison: InsightMetrics;
  changes: {
    totalInsights: {
      value: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    };
    sentiment: {
      positive: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
      negative: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
      neutral: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    };
  };
  period: {
    baseline: { from: Date; to: Date };
    comparison: { from: Date; to: Date };
  };
}

// Insight Alerts
export interface InsightAlert {
  id: string;
  type: 'sentiment_spike' | 'volume_change' | 'keyword_trend' | 'location_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data: any;
  triggeredAt: string;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// Insight Recommendations
export interface InsightRecommendation {
  id: string;
  type: 'action_item' | 'investigation' | 'follow_up' | 'escalation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  suggestedActions: string[];
  relatedInsights: string[];
  estimatedImpact: 'low' | 'medium' | 'high';
  createdAt: string;
  dueDate?: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
}

// Insight Configuration
export interface InsightConfig {
  refreshInterval: number; // in milliseconds
  defaultPageSize: number;
  maxSearchResults: number;
  enableRealTimeUpdates: boolean;
  enableNotifications: boolean;
  defaultFilters: InsightFilters;
  chartColors: {
    positive: string;
    negative: string;
    neutral: string;
  };
  exportLimits: {
    maxRows: number;
    maxFileSize: number; // in bytes
  };
}

// Insight Validation
export interface InsightValidationRule {
  field: string;
  rule: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface InsightValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}
