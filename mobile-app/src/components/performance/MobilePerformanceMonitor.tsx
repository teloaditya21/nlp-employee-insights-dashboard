'use client';

import { useEffect } from 'react';

// Mobile-specific performance monitoring component
const MobilePerformanceMonitor = () => {
  useEffect(() => {
    // Only run in production and if performance API is available
    if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') {
      return;
    }

    // Monitor Core Web Vitals optimized for mobile
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Log performance metrics (in production, you'd send these to analytics)
        if (process.env.NODE_ENV === 'development') {
          console.log(`Mobile Performance metric: ${entry.name}`, entry);
        }

        // Mobile-specific performance thresholds
        if (entry.entryType === 'largest-contentful-paint') {
          const lcp = entry.startTime;
          if (lcp > 4000) { // Mobile LCP threshold
            console.warn('Mobile LCP is slow:', lcp);
          }
        }

        if (entry.entryType === 'first-input') {
          const fid = (entry as any).processingStart - entry.startTime;
          if (fid > 100) { // Mobile FID threshold
            console.warn('Mobile FID is slow:', fid);
          }
        }
      });
    });

    // Observe different performance metrics
    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input'] });
    } catch (error) {
      // Fallback for browsers that don't support all entry types
      console.warn('Mobile performance observer not fully supported:', error);
    }

    // Monitor mobile-specific metrics
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        console.log('Mobile connection info:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      }
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      if (process.env.NODE_ENV !== 'production') {
        console.log('Mobile memory usage:', {
          used: Math.round(memoryInfo.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memoryInfo.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memoryInfo.jsHeapSizeLimit / 1048576) + ' MB'
        });
      }
    }

    // Monitor touch performance
    let touchStartTime = 0;
    const handleTouchStart = () => {
      touchStartTime = performance.now();
    };

    const handleTouchEnd = () => {
      const touchDuration = performance.now() - touchStartTime;
      if (touchDuration > 100 && process.env.NODE_ENV !== 'production') {
        console.warn('Slow touch response:', touchDuration + 'ms');
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      observer.disconnect();
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default MobilePerformanceMonitor;
