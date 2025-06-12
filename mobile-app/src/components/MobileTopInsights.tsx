import React, { memo, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMobileTopInsights } from '../hooks/useOptimizedMobileQuery'
import { useMobileTouchOptimized } from '../hooks/useOptimizedMobileDebounce'

interface TopInsightData {
  id: string
  word_insight: string
  total_count: number
  dominant_sentiment: 'positive' | 'negative' | 'neutral'
  employee_name: string
  source_data: string
}

interface MobileTopInsightsProps {
  title?: string
}

const MobileTopInsights = memo(function MobileTopInsights({ title = "Trending Insights" }: MobileTopInsightsProps) {
  const router = useRouter()
  const { touchHandlers } = useMobileTouchOptimized()

  // Use optimized mobile query hook
  const { data: insights = [], isLoading } = useMobileTopInsights() as {
    data: TopInsightData[]
    isLoading: boolean
  }

  const getSentimentIcon = useCallback((sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }, [])

  const getSentimentColor = useCallback((sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }, [])

  // const formatEmployeeName = (name: string) => {
  //   if (!name || name.length === 0) return 'Unknown'
  //   if (name.length === 1) return name + '*****'
  //   return name.charAt(0) + '*****'
  // }

  const handleInsightClick = useCallback((insight: TopInsightData) => {
    console.log('Insight clicked:', insight.word_insight)
    // Store the selected insight word in localStorage for the detail page
    localStorage.setItem('selectedInsightWord', insight.word_insight)
    // Navigate to the detail page
    router.push('/insight-detail?word=' + encodeURIComponent(insight.word_insight))
  }, [router])

  if (isLoading) {
    return (
      <div className="bg-white">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">What's happening in Telkom employee</p>
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="p-4 animate-pulse">
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!insights.length) {
    return (
      <div className="bg-white">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">What's happening in Telkom employee</p>
        </div>
        <div className="p-8 text-center">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No trending insights</p>
          <p className="text-sm text-gray-400">Check back later for updates</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">What's happening in Telkom employee</p>
      </div>

      {/* Insights List */}
      <div className="divide-y divide-gray-100">
        {insights.map((insight, index) => (
          <div
            key={insight.id}
            className="p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 cursor-pointer touch-manipulation"
            onClick={() => handleInsightClick(insight)}
            {...touchHandlers}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`flex items-center justify-center w-6 h-6 text-white text-xs font-bold rounded-full ${
                  insight.dominant_sentiment === 'positive' ? 'bg-green-500' :
                  insight.dominant_sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                }`}>
                  {index + 1}
                </div>
                <span className={`text-sm font-bold ${
                  insight.dominant_sentiment === 'positive' ? 'text-green-600' :
                  insight.dominant_sentiment === 'negative' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  #{insight.word_insight}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="mb-3">
              <div className="flex items-center space-x-2 ml-8">
                <p className="text-sm text-gray-600">
                  {insight.total_count.toLocaleString()} Insights
                </p>
                {getSentimentIcon(insight.dominant_sentiment)}
                <span className={`text-xs font-medium ${getSentimentColor(insight.dominant_sentiment)}`}>
                  {insight.dominant_sentiment}
                </span>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center space-x-4 text-xs text-gray-500 ml-8">
              <span>{insight.source_data}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Showing {insights.length} trending insights • Updated in real-time
        </p>
      </div>
    </div>
  )
})

export default MobileTopInsights
