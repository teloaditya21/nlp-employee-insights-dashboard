import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import MobileWordCloud from '../components/MobileWordCloud'
import MobileTopInsights from '../components/MobileTopInsights'
import { LogOut, RefreshCw, Smartphone, Wifi, WifiOff } from 'lucide-react'
import logoNLP from '../assets/logo-nlp.webp'

export default function DashboardPage() {
  const { logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Monitor online status
  useEffect(() => {
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

  const handleRefresh = () => {
    if (!isOnline) return
    setIsRefreshing(true)
    // Force refresh by reloading the page components
    window.location.reload()
  }

  const handleLogout = () => {
    logout()
  }

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never'
    return lastUpdated.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="mobile-container min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={logoNLP}
              alt="NLP Logo"
              className="w-28 h-14"
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
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
            {/* Word Cloud Section */}
            <div className="p-4">
              <MobileWordCloud />
            </div>

            {/* Top Insights Section */}
            <MobileTopInsights />
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
}
