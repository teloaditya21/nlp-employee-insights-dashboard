/**
 * @fileoverview Error handling hook
 * @description Custom hook for centralized error handling and reporting
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError, AppError } from '@/types';
import { formatErrorMessage } from '@/utils/formatters';
import { ERROR_MESSAGES } from '@/utils/constants';
import { useToast } from './use-toast';

export interface ErrorState {
  error: AppError | null;
  hasError: boolean;
  isRetrying: boolean;
  retryCount: number;
}

export interface UseErrorHandlerOptions {
  maxRetries?: number;
  showToast?: boolean;
  logErrors?: boolean;
  onError?: (error: AppError) => void;
  onRetry?: () => void;
  onMaxRetriesReached?: (error: AppError) => void;
}

export interface UseErrorHandlerReturn extends ErrorState {
  setError: (error: any) => void;
  clearError: () => void;
  retry: () => Promise<void>;
  canRetry: boolean;
  formatError: (error: any) => string;
}

/**
 * Custom hook for error handling
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    maxRetries = 3,
    showToast = true,
    logErrors = true,
    onError,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const { toast } = useToast();

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    hasError: false,
    isRetrying: false,
    retryCount: 0,
  });

  /**
   * Convert any error to AppError format
   */
  const normalizeError = useCallback((error: any): AppError => {
    const timestamp = new Date().toISOString();

    // If it's already an AppError
    if (error && typeof error === 'object' && error.code && error.message) {
      return { ...error, timestamp };
    }

    // If it's an API error
    if (error && typeof error === 'object' && error.status) {
      const apiError = error as ApiError;
      return {
        code: `HTTP_${apiError.status || 'UNKNOWN'}`,
        message: apiError.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        details: apiError.details,
        timestamp,
      };
    }

    // If it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: ERROR_MESSAGES.NETWORK_ERROR,
        timestamp,
      };
    }

    // If it's a standard Error object
    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        details: { stack: error.stack },
        timestamp,
      };
    }

    // If it's a string
    if (typeof error === 'string') {
      return {
        code: 'UNKNOWN_ERROR',
        message: error,
        timestamp,
      };
    }

    // Fallback for any other type
    return {
      code: 'UNKNOWN_ERROR',
      message: ERROR_MESSAGES.UNKNOWN_ERROR,
      details: { originalError: error },
      timestamp,
    };
  }, []);

  /**
   * Set error state
   */
  const setError = useCallback((error: any) => {
    const normalizedError = normalizeError(error);

    setErrorState(prev => ({
      error: normalizedError,
      hasError: true,
      isRetrying: false,
      retryCount: prev.retryCount,
    }));

    // Log error if enabled
    if (logErrors) {
      console.error('Error occurred:', normalizedError);
    }

    // Show toast notification if enabled
    if (showToast) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: formatErrorMessage(normalizedError),
      });
    }

    // Call error callback
    onError?.(normalizedError);
  }, [normalizeError, logErrors, showToast, toast, onError]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      hasError: false,
      isRetrying: false,
      retryCount: 0,
    });
  }, []);

  /**
   * Retry the failed operation
   */
  const retry = useCallback(async () => {
    if (errorState.retryCount >= maxRetries) {
      if (errorState.error) {
        onMaxRetriesReached?.(errorState.error);
      }
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      await onRetry?.();
      clearError();
    } catch (error) {
      setError(error);
    }
  }, [errorState.retryCount, errorState.error, maxRetries, onRetry, onMaxRetriesReached, clearError, setError]);

  /**
   * Check if retry is possible
   */
  const canRetry = errorState.hasError && errorState.retryCount < maxRetries && !errorState.isRetrying;

  /**
   * Format error for display
   */
  const formatError = useCallback((error: any): string => {
    return formatErrorMessage(error);
  }, []);

  // Auto-clear error after a certain time (optional)
  useEffect(() => {
    if (errorState.hasError && !errorState.isRetrying) {
      const timer = setTimeout(() => {
        // Only auto-clear if no retries are available
        if (!canRetry) {
          clearError();
        }
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [errorState.hasError, errorState.isRetrying, canRetry, clearError]);

  return {
    ...errorState,
    setError,
    clearError,
    retry,
    canRetry,
    formatError,
  };
}

/**
 * Hook for handling async operations with error handling
 */
export function useAsyncOperation<T = any>(
  operation: () => Promise<T>,
  options: UseErrorHandlerOptions & {
    onSuccess?: (data: T) => void;
    immediate?: boolean;
  } = {}
) {
  const { onSuccess, immediate = false, ...errorOptions } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const errorHandler = useErrorHandler({
    ...errorOptions,
    onRetry: async () => {
      await execute();
    },
  });

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      setIsLoading(true);
      errorHandler.clearError();
      
      const result = await operation();
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (error) {
      errorHandler.setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [operation, onSuccess, errorHandler]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...errorHandler,
    data,
    isLoading,
    execute,
    reset: () => {
      setData(null);
      setIsLoading(false);
      errorHandler.clearError();
    },
  };
}

/**
 * Hook for handling form submission errors
 */
export function useFormErrorHandler() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const setFieldError = useCallback((field: string, error: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    setGeneralError(null);
  }, []);

  const handleSubmissionError = useCallback((error: any) => {
    // Clear previous errors
    clearAllErrors();

    // Handle validation errors (422 status)
    if (error?.status === 422 && error?.details?.errors) {
      const validationErrors = error.details.errors;
      Object.entries(validationErrors).forEach(([field, message]) => {
        setFieldError(field, String(message));
      });
    } else {
      // Handle general errors
      setGeneralError(formatErrorMessage(error));
    }
  }, [clearAllErrors, setFieldError]);

  return {
    fieldErrors,
    generalError,
    hasErrors: Object.keys(fieldErrors).length > 0 || generalError !== null,
    setFieldError,
    clearFieldError,
    setGeneralError,
    clearAllErrors,
    handleSubmissionError,
  };
}

/**
 * Hook for global error boundary
 */
export function useGlobalErrorHandler() {
  const [globalErrors, setGlobalErrors] = useState<AppError[]>([]);

  const addGlobalError = useCallback((error: any) => {
    const normalizedError: AppError = {
      code: error?.code || 'GLOBAL_ERROR',
      message: error?.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      timestamp: new Date().toISOString(),
      details: error?.details,
    };

    setGlobalErrors(prev => [...prev, normalizedError]);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      setGlobalErrors(prev => prev.filter(e => e.timestamp !== normalizedError.timestamp));
    }, 30000);
  }, []);

  const removeGlobalError = useCallback((timestamp: string) => {
    setGlobalErrors(prev => prev.filter(e => e.timestamp !== timestamp));
  }, []);

  const clearAllGlobalErrors = useCallback(() => {
    setGlobalErrors([]);
  }, []);

  return {
    globalErrors,
    hasGlobalErrors: globalErrors.length > 0,
    addGlobalError,
    removeGlobalError,
    clearAllGlobalErrors,
  };
}
