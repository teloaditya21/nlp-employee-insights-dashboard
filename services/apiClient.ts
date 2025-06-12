/**
 * @fileoverview Enhanced API client with better error handling and interceptors
 * @description Centralized API client with request/response interceptors and error handling
 */

import { ApiResponse, ApiError, ApiEndpoint } from '@/types';
import { API_CONFIG, ERROR_MESSAGES } from '@/utils/constants';
import { formatErrorMessage } from '@/utils/formatters';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRequestError?: (error: any) => any;
}

export interface ResponseInterceptor {
  onResponse?: (response: Response) => Response | Promise<Response>;
  onResponseError?: (error: any) => any;
}

/**
 * Enhanced API client class
 */
export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Set default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string): void {
    this.setDefaultHeaders({ Authorization: `Bearer ${token}` });
  }

  /**
   * Remove authorization header
   */
  removeAuthToken(): void {
    const { Authorization, ...headers } = this.defaultHeaders;
    this.defaultHeaders = headers;
  }

  /**
   * Create API error from response
   */
  private createApiError(response: Response, data?: any): ApiError {
    const status = response.status;
    let message: string = ERROR_MESSAGES.UNKNOWN_ERROR;

    switch (status) {
      case 400:
        message = data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
        break;
      case 401:
        message = ERROR_MESSAGES.UNAUTHORIZED;
        break;
      case 403:
        message = ERROR_MESSAGES.FORBIDDEN;
        break;
      case 404:
        message = ERROR_MESSAGES.NOT_FOUND;
        break;
      case 408:
        message = ERROR_MESSAGES.TIMEOUT_ERROR;
        break;
      case 500:
        message = ERROR_MESSAGES.SERVER_ERROR;
        break;
      default:
        message = data?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    return {
      message,
      status,
      details: data,
    };
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;

    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        try {
          processedConfig = await interceptor.onRequest(processedConfig);
        } catch (error) {
          if (interceptor.onRequestError) {
            interceptor.onRequestError(error);
          }
          throw error;
        }
      }
    }

    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let processedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onResponse) {
        try {
          processedResponse = await interceptor.onResponse(processedResponse);
        } catch (error) {
          if (interceptor.onResponseError) {
            interceptor.onResponseError(error);
          }
          throw error;
        }
      }
    }

    return processedResponse;
  }

  /**
   * Make HTTP request with retries
   */
  private async makeRequest(
    endpoint: string,
    config: RequestConfig,
    attempt: number = 1
  ): Promise<Response> {
    const { retries = API_CONFIG.RETRY_ATTEMPTS, retryDelay = API_CONFIG.RETRY_DELAY } = config;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || API_CONFIG.TIMEOUT);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: config.method || 'GET',
        headers: { ...this.defaultHeaders, ...config.headers },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        return this.makeRequest(endpoint, config, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Generic request method
   */
  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    try {
      // Apply request interceptors
      const processedConfig = await this.applyRequestInterceptors(config);

      // Make the request
      const response = await this.makeRequest(endpoint, processedConfig);

      // Apply response interceptors
      const processedResponse = await this.applyResponseInterceptors(response);

      // Parse response
      let data: any;
      const contentType = processedResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await processedResponse.json();
      } else {
        data = await processedResponse.text();
      }

      // Handle non-2xx responses
      if (!processedResponse.ok) {
        throw this.createApiError(processedResponse, data);
      }

      // Return successful response
      return data;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          message: ERROR_MESSAGES.NETWORK_ERROR,
          status: 0,
          details: { originalError: error },
        } as ApiError;
      }

      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw {
          message: ERROR_MESSAGES.TIMEOUT_ERROR,
          status: 408,
          details: { originalError: error },
        } as ApiError;
      }

      // Re-throw API errors
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Add default request interceptor for authentication
apiClient.addRequestInterceptor({
  onRequest: (config) => {
    // Add timestamp to prevent caching
    const url = new URL(config.headers?.['X-Request-URL'] || '');
    url.searchParams.set('_t', Date.now().toString());
    
    return config;
  },
});

// Add default response interceptor for error handling
apiClient.addResponseInterceptor({
  onResponseError: (error) => {
    console.error('API Response Error:', error);
    
    // Handle authentication errors globally
    if (error.status === 401) {
      // Clear auth token and redirect to login
      apiClient.removeAuthToken();
      localStorage.clear();
      window.location.href = '/login';
    }
    
    return error;
  },
});

export default apiClient;
