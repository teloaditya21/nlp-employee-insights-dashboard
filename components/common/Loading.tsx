/**
 * @fileoverview Loading component with multiple variants
 * @description Reusable loading component with different styles and sizes
 */

import React from 'react';
import { LoadingProps } from '@/types';
import { cn } from '@/utils';

/**
 * Spinner loading component
 */
const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
};

/**
 * Dots loading component
 */
const Dots: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={cn('flex space-x-1', className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-blue-600 rounded-full animate-pulse',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Bars loading component
 */
const Bars: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-1 h-4',
    md: 'w-1 h-6',
    lg: 'w-2 h-8',
  };

  return (
    <div className={cn('flex space-x-1 items-end', className)} role="status" aria-label="Loading">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-blue-600 animate-pulse',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1.2s',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Pulse loading component
 */
const Pulse: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={cn(
        'bg-blue-600 rounded-full animate-pulse',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
};

/**
 * Main Loading component
 */
export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  overlay = false,
  fullScreen = false,
  className,
  children,
  testId,
}) => {
  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'dots':
        return <Dots size={size} />;
      case 'bars':
        return <Bars size={size} />;
      case 'pulse':
        return <Pulse size={size} />;
      case 'spinner':
      default:
        return <Spinner size={size} />;
    }
  };

  const loadingContent = (
    <div className="flex flex-col items-center justify-center space-y-3">
      {renderLoadingIndicator()}
      {text && (
        <p className="text-sm text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          overlay ? 'bg-black bg-opacity-50' : 'bg-white',
          className
        )}
        data-testid={testId}
      >
        {loadingContent}
      </div>
    );
  }

  if (overlay) {
    return (
      <div
        className={cn(
          'absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75',
          className
        )}
        data-testid={testId}
      >
        {loadingContent}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center p-4',
        className
      )}
      data-testid={testId}
    >
      {loadingContent}
      {children}
    </div>
  );
};

/**
 * Inline loading component for buttons and small spaces
 */
export const InlineLoading: React.FC<{
  size?: 'sm' | 'md';
  className?: string;
}> = ({ size = 'sm', className }) => (
  <Spinner size={size} className={className} />
);

/**
 * Loading overlay for wrapping content
 */
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  variant?: LoadingProps['variant'];
  className?: string;
}> = ({ isLoading, children, text, variant = 'spinner', className }) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <Loading
          variant={variant}
          text={text}
          overlay
          className="rounded-lg"
        />
      )}
    </div>
  );
};

/**
 * Loading button component
 */
export const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
}> = ({ 
  isLoading, 
  children, 
  loadingText, 
  disabled, 
  onClick, 
  className,
  variant = 'default'
}) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isLoading && <InlineLoading className="mr-2" />}
      {isLoading ? loadingText || 'Loading...' : children}
    </button>
  );
};

/**
 * Skeleton loading component for content placeholders
 */
export const Skeleton: React.FC<{
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}> = ({ 
  className, 
  variant = 'text', 
  width, 
  height, 
  lines = 1 
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              'h-4',
              index === lines - 1 && 'w-3/4', // Last line is shorter
              className
            )}
            style={index === 0 ? style : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        variant === 'text' && 'h-4',
        variant === 'rectangular' && !height && 'h-20',
        variant === 'circular' && !width && !height && 'w-10 h-10',
        className
      )}
      style={style}
    />
  );
};

export default Loading;
