/**
 * @fileoverview API-related TypeScript type definitions
 * @description Centralized type definitions for all API responses and requests
 */

// Base API Response Types
export interface BaseApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface ApiResponse<T> extends BaseApiResponse {
  data: T;
  total?: number;
  search_term?: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Insight-related API Types
export interface InsightSummary {
  id: number;
  word_insight: string;
  total_count: number;
  positif_count: number;
  negatif_count: number;
  netral_count: number;
  positif_percentage: number;
  negatif_percentage: number;
  netral_percentage: number;
  created_at: string;
}

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

// Employee Insights API Types
export interface EmployeeInsight {
  id: number;
  employee_name: string;
  witel: string;
  source: string;
  sentence_insight: string;
  word_insight: string;
  sentimen: 'positive' | 'negative' | 'neutral';
  created_at: string;
  updated_at: string;
}

export interface EmployeeInsightStats {
  totalCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
}

// Kota Summary API Types
export interface KotaSummary {
  id: number;
  kota: string;
  total_count: number;
  positif_count: number;
  negatif_count: number;
  netral_count: number;
  positif_percentage: number;
  negatif_percentage: number;
  netral_percentage: number;
  created_at: string;
  updated_at: string;
}

// Bookmark API Types
export interface BookmarkedInsight {
  id: number;
  word_insight: string;
  total_count: number;
  positif_count: number;
  negatif_count: number;
  netral_count: number;
  positif_percentage: number;
  negatif_percentage: number;
  netral_percentage: number;
  sentiment_category: 'positive' | 'negative' | 'neutral';
  bookmarked_at: string;
}

// Page Context API Types
export interface PageContextData {
  user_session_id: string;
  current_page: 'survey-dashboard' | 'top-insights' | 'smart-analytics';
  active_filters: Record<string, any>;
  displayed_data: Record<string, any>;
  total_insights: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  top_keywords: string[];
  date_range: string;
  location_filter: string;
  source_filter: string;
  ai_conclusion?: string;
  ai_conclusion_generated_at?: string;
}

export interface AIConclusion {
  ai_conclusion: string;
  ai_conclusion_generated_at: string;
  user_session_id: string;
  current_page: string;
}

// API Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

// Request Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface BookmarkRequest {
  word_insight: string;
  total_count: number;
  positif_count: number;
  negatif_count: number;
  netral_count: number;
  positif_percentage: number;
  negatif_percentage: number;
  netral_percentage: number;
  sentiment_category: 'positive' | 'negative' | 'neutral';
}

// Filter Types
export interface FilterOptions {
  search?: string;
  witel?: string;
  source?: string;
  sentiment?: 'all' | 'positive' | 'negative' | 'neutral';
  dateRange?: {
    from: Date;
    to: Date;
  };
  topics?: string[];
}

// Query Key Types
export type QueryKey = readonly unknown[];

// API Endpoint Types
export type ApiEndpoint = 
  | '/api/insights/summary'
  | '/api/insights/dashboard'
  | '/api/insights/top-positive'
  | '/api/insights/top-negative'
  | '/api/insights/paginated'
  | '/api/insights/search'
  | '/api/kota-summary'
  | '/api/bookmarks'
  | '/api/auth/login'
  | '/api/auth/validate'
  | '/api/page-context'
  | '/api/ai-conclusion';
