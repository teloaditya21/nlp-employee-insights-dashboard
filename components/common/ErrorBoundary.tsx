/**
 * @fileoverview Enhanced Error Boundary component
 * @description Improved error boundary with better error handling and recovery options
 */

import React, { Component, ReactNode } from 'react';
import { ErrorBoundaryProps, ErrorBoundaryState, AppError } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { formatErrorMessage } from '@/utils/formatters';
import { getBrowserInfo } from '@/utils/helpers';

/**
 * Enhanced Error Boundary component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state when resetKeys change
    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => prevProps.resetKeys?.[index] !== key
      );

      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Report error to monitoring service
   */
  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        browserInfo: getBrowserInfo(),
      };

      // Send to monitoring service (implement based on your monitoring solution)
      // Example: Sentry, LogRocket, etc.
      console.log('Error Report:', errorReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  /**
   * Reset error state
   */
  private resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  /**
   * Retry with delay
   */
  private retryWithDelay = (delay: number = 1000) => {
    this.retryTimeoutId = setTimeout(() => {
      this.resetError();
    }, delay);
  };

  /**
   * Reload the page
   */
  private reloadPage = () => {
    window.location.reload();
  };

  /**
   * Navigate to home
   */
  private goHome = () => {
    window.location.href = '/';
  };

  /**
   * Copy error details to clipboard
   */
  private copyErrorDetails = async () => {
    const { error, errorInfo } = this.state;
    
    const errorDetails = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      // Could show a toast notification here
      console.log('Error details copied to clipboard');
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  /**
   * Render error fallback UI
   */
  private renderErrorFallback = () => {
    const { error, errorInfo } = this.state;
    const isDevelopment = process.env.NODE_ENV === 'development';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Something went wrong
            </CardTitle>
            <p className="text-gray-600 mt-2">
              We're sorry, but something unexpected happened. Please try again.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
              <p className="text-red-700 text-sm font-mono">
                {formatErrorMessage(error)}
              </p>
            </div>

            {/* Development Details */}
            {isDevelopment && error && (
              <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-800 cursor-pointer">
                  Technical Details (Development)
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-700">Stack Trace:</h4>
                    <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </div>
                  {errorInfo && (
                    <div>
                      <h4 className="font-medium text-gray-700">Component Stack:</h4>
                      <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-auto max-h-40">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={this.resetError}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={this.reloadPage}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
              
              <Button 
                onClick={this.goHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>

            {/* Additional Actions */}
            <div className="flex justify-center">
              <Button 
                onClick={this.copyErrorDetails}
                variant="ghost"
                size="sm"
                className="text-gray-500"
              >
                <Bug className="w-4 h-4 mr-2" />
                Copy Error Details
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-500">
              <p>
                If this problem persists, please contact support with the error details above.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render default error UI
      return this.renderErrorFallback();
    }

    return children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ErrorBoundary;
