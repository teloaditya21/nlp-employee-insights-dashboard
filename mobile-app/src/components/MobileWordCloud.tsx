import React, { useLayoutEffect, useRef, memo } from 'react'
import * as am5 from '@amcharts/amcharts5'
import * as am5wc from '@amcharts/amcharts5/wc'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import { useMobileWordCloudData } from '../hooks/useOptimizedMobileQuery'

export interface WordCloudData {
  tag: string
  weight: number
  sentiment?: 'positive' | 'negative' | 'neutral'
}

interface MobileWordCloudProps {
  title?: string
  width?: string
  height?: string
}

const MobileWordCloud = memo(function MobileWordCloud({
  title = "🔥 Trending Topics",
  width = '100%',
  height = '300px'
}: MobileWordCloudProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<am5.Root | null>(null)

  // Use optimized mobile query hook
  const { data: topInsights = [], isLoading } = useMobileWordCloudData() as {
    data: WordCloudData[]
    isLoading: boolean
  }

  useLayoutEffect(() => {
    if (!chartRef.current || isLoading || !topInsights.length) return

    // Dispose previous chart if exists
    if (rootRef.current) {
      rootRef.current.dispose()
    }

    // Create root element
    const root = am5.Root.new(chartRef.current)
    rootRef.current = root

    // Set themes
    root.setThemes([am5themes_Animated.new(root)])

    // Create container
    const container = root.container.children.push(am5.Container.new(root, {
      width: am5.percent(100),
      height: am5.percent(100),
      layout: root.verticalLayout
    }))

    // Create WordCloud series
    const series = container.children.push(am5wc.WordCloud.new(root, {
      categoryField: "tag",
      valueField: "weight",
      calculateAggregates: true,
      maxFontSize: am5.percent(12),
      minFontSize: am5.percent(4),
      maxCount: 10,
      angles: [0, 0, 0, 0, 90, 90] // Mix of horizontal and vertical text
    }))

    // Configure labels
    series.labels.template.setAll({
      paddingTop: 5,
      paddingBottom: 5,
      paddingLeft: 5,
      paddingRight: 5,
      fontFamily: "Inter, system-ui, sans-serif",
      cursorOverStyle: "pointer"
    })

    // Set up colors based on sentiment using adapters
    series.labels.template.adapters.add("fill", function(fill, target) {
      const dataItem = target.dataItem
      if (dataItem) {
        const dataContext = dataItem.dataContext as any
        const sentiment = dataContext.sentiment

        switch (sentiment) {
          case 'positive':
            return am5.color("#10B981") // Green
          case 'negative':
            return am5.color("#EF4444") // Red
          case 'neutral':
            return am5.color("#F59E0B") // Yellow
          default:
            return am5.color("#6B7280") // Gray
        }
      }
      return fill
    })

    // Add hover effects (commented out due to TypeScript issues)
    // series.labels.template.onPrivate("pointerover", function(ev) {
    //   const target = ev.target
    //   target.animate({
    //     key: "scale",
    //     to: 1.2,
    //     duration: 200,
    //     easing: am5.ease.out(am5.ease.cubic)
    //   })
    // })

    // series.labels.template.onPrivate("pointerout", function(ev) {
    //   const target = ev.target
    //   target.animate({
    //     key: "scale",
    //     to: 1,
    //     duration: 200,
    //     easing: am5.ease.out(am5.ease.cubic)
    //   })
    // })

    // Set tooltip
    series.labels.template.set("tooltipText", "{tag}: {weight} mentions ({sentiment})")

    // Set data
    series.data.setAll(topInsights)

    // Cleanup function
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
        rootRef.current = null
      }
    }
  }, [topInsights, isLoading])

  // Cleanup on unmount
  useLayoutEffect(() => {
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose()
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-teal-50">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="p-6 flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading word cloud...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-teal-50">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <div
        ref={chartRef}
        style={{ width, height }}
        className="bg-gradient-to-br from-blue-50 via-white to-teal-50"
      />
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>💬 {topInsights.length} topics trending</span>
          <span>Tap words to explore</span>
        </div>
      </div>
    </div>
  )
})

export default MobileWordCloud
