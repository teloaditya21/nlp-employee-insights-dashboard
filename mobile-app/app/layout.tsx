import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../src/index.css'
import ClientProviders from './providers'
// import MobilePerformanceMonitor from '../src/components/performance/MobilePerformanceMonitor'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Optimize font loading for mobile
  preload: true,
})

export const metadata: Metadata = {
  title: 'NLP Employee Insights - Mobile',
  description: 'Employee Insights and Sentiment Analysis Platform - Mobile Version',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#3B82F6',
  manifest: '/manifest.json',
  keywords: 'employee insights, sentiment analysis, mobile, dashboard, analytics',
  authors: [{ name: 'NLP Insights Team' }],
  robots: 'index, follow',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Mobile performance optimizations */}
        <link rel="preconnect" href="https://employee-insights-api.adityalasika.workers.dev" />
        <link rel="dns-prefetch" href="https://employee-insights-api.adityalasika.workers.dev" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <ClientProviders>
          <div className="min-h-screen bg-gray-50">
            {children}
            {/* <MobilePerformanceMonitor /> */}
          </div>
        </ClientProviders>
      </body>
    </html>
  )
}
