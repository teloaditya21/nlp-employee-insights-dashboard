'use client'

import React, { useState, useEffect, memo, useCallback } from 'react'
import { useAuth } from '../../src/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  MobileWordCloudWithSuspense,
  MobileTopInsightsWithSuspense
} from '../../src/components/performance/LazyComponents'
import { useMobileBounceScroll } from '../../src/hooks/useOptimizedMobileDebounce'
import { LogOut, RefreshCw } from 'lucide-react'
import Image from 'next/image'
// import logoNLP from '/logo-nlp.webp'

const DashboardPage = memo(function DashboardPage() {
  const { logout, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Mobile bounce scroll optimization
  const { isScrolling } = useMobileBounceScroll()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

  // Monitor online status
  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    setLastUpdated(new Date())
  }, [])

  const handleRefresh = useCallback(() => {
    if (!isOnline) return
    setIsRefreshing(true)
    // Force refresh by reloading the page components
    window.location.reload()
  }, [isOnline])

  const handleLogout = useCallback(() => {
    logout()
    router.push('/')
  }, [logout, router])

  const formatLastUpdated = useCallback(() => {
    if (!lastUpdated) return 'Never'
    return lastUpdated.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [lastUpdated])

  return (
    <div className="mobile-container min-h-screen flex flex-col">
      {/* Header - Sticky/Frozen */}
      <div className={`bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 transition-shadow duration-200 ${
        isScrolling ? 'shadow-md' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo-nlp.webp"
              alt="NLP Logo"
              width={128}
              height={64}
              className="w-32 h-16"
              priority
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">NLP Insights</h1>
              <p className="text-xs text-gray-500">Powered Employee Insight</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || !isOnline}
              className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-500">Updated {formatLastUpdated()}</span>
        </div>
      </div>

      {/* Main Content with Bounce Scroll */}
      <div className="flex-1 overflow-y-auto bg-gray-50" style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading insights...</p>
              <p className="text-sm text-gray-500">Fetching real-time data</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header Section - Missing from original layout */}
            <div className="bg-white px-4 py-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <Image
                  src="/logo-nlp.webp"
                  alt="NLP Logo"
                  width={80}
                  height={40}
                  className="w-20 h-10"
                  priority
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">NLP Insights</h2>
                  <p className="text-sm text-gray-500">Powered Employee Insight</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-400">Updated 06.23</p>
              </div>
            </div>

            {/* Word Cloud Section */}
            <div className="p-4">
              <MobileWordCloudWithSuspense />
            </div>

            {/* Top Insights Section */}
            <MobileTopInsightsWithSuspense />
          </div>
        )}
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-600 text-white p-3 text-center">
          <p className="text-sm font-medium">You're offline. Some features may not work.</p>
        </div>
      )}
    </div>
  )
})

export default DashboardPage
