/**
 * @fileoverview Services export index
 * @description Central export for all service classes
 */

// API Client
import { apiClient, ApiClient } from './apiClient';
export { apiClient, ApiClient };
export type { RequestConfig, RequestInterceptor, ResponseInterceptor } from './apiClient';

// Authentication Service
import { authService, AuthService } from './authService';
export { authService, AuthService };

// Insights Service
import { insightsService, InsightsService } from './insightsService';
export { insightsService, InsightsService };

// Re-export existing API for backward compatibility
export { employeeInsightsAPI } from '@/lib/api';

// Service configuration
export const services = {
  auth: authService,
  insights: insightsService,
  api: apiClient,
} as const;

export default services;
