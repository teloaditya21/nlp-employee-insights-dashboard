'use client';

import { Inter } from 'next/font/google';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/dashboard-layout';
import PerformanceMonitor from '@/components/performance/PerformanceMonitor';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  preload: true,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>NLP Employee Insights Dashboard</title>
        <meta name="description" content="Employee feedback analytics and insights dashboard" />
        <meta name="keywords" content="employee feedback, analytics, insights, dashboard, NLP" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://employee-insights-api.adityalasika.workers.dev" />
        <link rel="dns-prefetch" href="https://employee-insights-api.adityalasika.workers.dev" />
      </head>
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <TooltipProvider>
              <DashboardLayout>
                {children}
              </DashboardLayout>
              <Toaster />
              <PerformanceMonitor />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
