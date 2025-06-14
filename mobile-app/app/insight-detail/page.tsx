'use client'

import React, { useState, useEffect, Suspense, memo, useCallback } from 'react'
import { ArrowLeft, Circle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMobileInsightDetails } from '../../src/hooks/useOptimizedMobileQuery'
import { useMobileTouchOptimized, useMobileBounceScroll } from '../../src/hooks/useOptimizedMobileDebounce'

export interface InsightDetailData {
  id: number
  wordInsight: string
  sentenceInsight: string
  originalInsight: string
  employeeName: string
  sourceData: string
  witel: string
  kota: string
  sentimen: string
  date: string
  createdAt: string
}

const InsightDetailPageContent = memo(function InsightDetailPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [insightWord, setInsightWord] = useState<string>('')
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  // Mobile optimizations
  const { touchHandlers } = useMobileTouchOptimized()
  const { isScrolling } = useMobileBounceScroll()

  // Get insight word from URL params or localStorage
  useEffect(() => {
    const wordParam = searchParams.get('word')
    const storedWord = localStorage.getItem('selectedInsightWord')

    const word = wordParam || storedWord || ''
    setInsightWord(word)
  }, [searchParams])

  // Use optimized mobile query hook
  const { data: detailData = [], isLoading } = useMobileInsightDetails(insightWord) as {
    data: InsightDetailData[]
    isLoading: boolean
  }

  const formatEmployeeName = useCallback((name: string) => {
    if (!name || name.length === 0) return 'Unknown'
    if (name.length === 1) return name + '***'
    return name.charAt(0) + '***'
  }, [])

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }, [])

  const getSentimentColor = useCallback((sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positif':
      case 'positive':
        return 'bg-green-100 text-green-800'
      case 'negatif':
      case 'negative':
        return 'bg-red-100 text-red-800'
      case 'netral':
      case 'neutral':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getSentimentDotColor = useCallback((sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positif':
      case 'positive':
        return 'text-green-500'
      case 'negatif':
      case 'negative':
        return 'text-red-500'
      case 'netral':
      case 'neutral':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }, [])

  const handleBack = useCallback(() => {
    localStorage.removeItem('selectedInsightWord')
    router.push('/dashboard')
  }, [router])

  const toggleExpanded = useCallback((itemId: number) => {
    setExpandedItems(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId)
      } else {
        newExpanded.add(itemId)
      }
      return newExpanded
    })
  }, [])

  const truncateText = useCallback((text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }, [])

  // Calculate sentiment statistics
  const totalCount = detailData.length
  // const positiveCount = detailData.filter(item =>
  //   item.sentimen.toLowerCase() === 'positif' || item.sentimen.toLowerCase() === 'positive'
  // ).length
  // const negativeCount = detailData.filter(item =>
  //   item.sentimen.toLowerCase() === 'negatif' || item.sentimen.toLowerCase() === 'negative'
  // ).length
  // const neutralCount = detailData.filter(item =>
  //   item.sentimen.toLowerCase() === 'netral' || item.sentimen.toLowerCase() === 'neutral'
  // ).length

  // Calculate percentages (for future use)
  // const positivePercentage = totalCount > 0 ? ((positiveCount / totalCount) * 100).toFixed(1) : '0'
  // const negativePercentage = totalCount > 0 ? ((negativeCount / totalCount) * 100).toFixed(1) : '0'
  // const neutralPercentage = totalCount > 0 ? ((neutralCount / totalCount) * 100).toFixed(1) : '0'

  if (isLoading) {
    return (
      <div className="mobile-container min-h-screen bg-gray-50">
        {/* Header - Sticky/Frozen */}
        <div className={`bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 transition-shadow duration-200 ${
          isScrolling ? 'shadow-md' : ''
        }`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Detail Insight</h1>
              <p className="text-xs text-gray-500">Loading...</p>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="p-4 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading insight details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-container min-h-screen bg-gray-50 overflow-y-auto" style={{
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain'
    }}>
      {/* Header - Sticky/Frozen */}
      <div className={`bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 transition-shadow duration-200 ${
        isScrolling ? 'shadow-md' : ''
      }`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Detail Insight</h1>
            <p className="text-xs text-gray-500">#{insightWord}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-20">
        {/* Statistics */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Statistik</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-blue-600">{totalCount}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <p className="text-xs text-gray-500">Insights</p>
              <p className="text-xl font-bold text-gray-600">{totalCount}</p>
            </div>
          </div>
        </div>

        {/* Insight Details */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Detail Insights</h3>
          <div className="space-y-4">
            {detailData.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-3 touch-manipulation"
                {...touchHandlers}
              >
                {/* Sentiment and Meta Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Circle className={`h-3 w-3 flex-shrink-0 ${getSentimentDotColor(item.sentimen)}`} fill="currentColor" />
                    <span className={`px-2 py-1 text-xs rounded-full ${getSentimentColor(item.sentimen)}`}>
                      {item.sentimen}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                </div>

                {/* Insight Text */}
                <div className="mb-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {expandedItems.has(item.id)
                      ? item.sentenceInsight
                      : truncateText(item.sentenceInsight)
                    }
                  </p>
                  {item.sentenceInsight.length > 80 && (
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="text-blue-500 hover:text-blue-700 active:text-blue-800 text-xs font-medium mt-1 touch-manipulation"
                      {...touchHandlers}
                    >
                      {expandedItems.has(item.id) ? 'Lihat Lebih Sedikit' : 'more details'}
                    </button>
                  )}
                </div>

                {/* Meta Information */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Karyawan:</span> {formatEmployeeName(item.employeeName)}
                  </div>
                  <div>
                    <span className="font-medium">Kota:</span> {item.kota}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Sumber:</span> {item.sourceData}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Bounce Indicator */}
        <div className="flex justify-center py-6">
          <div className="mobile-bounce">
            <div className="w-8 h-1 bg-gray-400 rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>

      {/* Bottom Bounce Area */}
      <div className="h-4 bg-transparent"></div>
    </div>
  )
})

export default function InsightDetailPage() {
  return (
    <Suspense fallback={
      <div className="mobile-container min-h-screen bg-gray-50">
        <div className="p-4 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <InsightDetailPageContent />
    </Suspense>
  )
}
