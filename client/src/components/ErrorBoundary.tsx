import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 overflow-x-hidden">
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-5 w-5 text-red-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Terjadi Kesalahan Sistem
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Maaf, terjadi kesalahan yang tidak terduga. Silakan refresh halaman atau hubungi administrator.
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">Detail Error (Development Mode)</summary>
                        <pre className="mt-2 whitespace-pre-wrap bg-red-100 p-2 rounded text-xs">
                          {this.state.error.message}
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={() => window.location.reload()}
                      >
                        Refresh Halaman
                      </button>
                      <button
                        type="button"
                        className="bg-white px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 border border-red-300"
                        onClick={() => this.setState({ hasError: false, error: undefined })}
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 