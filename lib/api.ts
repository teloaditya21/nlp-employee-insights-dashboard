// API configuration
import { CURRENT_CONFIG } from '@/utils/constants';

const API_BASE_URL = CURRENT_CONFIG.API_BASE_URL;

// Types for API responses
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  total?: number;
  search_term?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// API service class
class EmployeeInsightsAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get API info
  async getApiInfo(): Promise<ApiResponse<any>> {
    return this.request('/');
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/api/insights/dashboard');
  }

  // Get all insights summary
  async getAllInsights(): Promise<ApiResponse<InsightSummary[]>> {
    return this.request('/api/insights/summary');
  }

  // Get top positive insights
  async getTopPositiveInsights(): Promise<ApiResponse<InsightSummary[]>> {
    return this.request('/api/insights/top-positive');
  }

  // Get top negative insights
  async getTopNegativeInsights(): Promise<ApiResponse<InsightSummary[]>> {
    return this.request('/api/insights/top-negative');
  }

  // Search insights by word
  async searchInsights(word: string): Promise<ApiResponse<InsightSummary[]>> {
    return this.request(`/api/insights/search/${encodeURIComponent(word)}`);
  }

  // Get filtered insights summary with date range
  async getFilteredInsights(filters: {
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sentiment?: string;
  }): Promise<ApiResponse<InsightSummary[]>> {
    const params = new URLSearchParams();

    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.search) params.append('search', filters.search);
    if (filters.sentiment && filters.sentiment !== 'all') params.append('sentiment', filters.sentiment);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/insights/filtered?${queryString}` : '/api/insights/summary';

    return this.request(endpoint);
  }

  // Get paginated insights
  async getPaginatedInsights(page: number = 1, limit: number = 10): Promise<PaginatedResponse<InsightSummary[]>> {
    return this.request(`/api/insights/paginated?page=${page}&limit=${limit}`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/health');
  }
}

// Export singleton instance
export const employeeInsightsAPI = new EmployeeInsightsAPI();

// Export the class for testing or custom instances
export { EmployeeInsightsAPI }; 