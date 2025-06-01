/**
 * @fileoverview Services export index
 * @description Central export for all service classes
 */

// API Client
export { apiClient, ApiClient } from './apiClient';
export type { RequestConfig, RequestInterceptor, ResponseInterceptor } from './apiClient';

// Authentication Service
export { authService, AuthService } from './authService';

// Insights Service
export { insightsService, InsightsService } from './insightsService';

// Re-export existing API for backward compatibility
export { employeeInsightsAPI } from '@/lib/api';

// Service configuration
export const services = {
  auth: authService,
  insights: insightsService,
  api: apiClient,
} as const;

export default services;
