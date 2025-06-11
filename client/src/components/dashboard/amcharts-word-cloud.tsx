import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5wc from '@amcharts/amcharts5/wc';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { useQuery } from '@tanstack/react-query';
import { CURRENT_CONFIG } from '@/utils/constants';

interface WordCloudData {
  tag: string;
  weight: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface AmChartsWordCloudProps {
  title?: string;
  width?: string;
  height?: string;
}

const AmChartsWordCloud: React.FC<AmChartsWordCloudProps> = ({
  title = "Top Insights",
  width = '100%',
  height = '400px'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<am5.Root | null>(null);

  // Fetch top 10 insights data from D1 database
  const { data: topInsights, isLoading } = useQuery({
    queryKey: ['/api/insights/top-10'],
    queryFn: async () => {
      const response = await fetch(`${CURRENT_CONFIG.API_BASE_URL}/api/insights/top-10`);
      if (!response.ok) {
        throw new Error('Failed to fetch top insights from D1 database');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useLayoutEffect(() => {
    if (!chartRef.current || isLoading || !topInsights) return;

    // Dispose previous chart if exists
    if (rootRef.current) {
      rootRef.current.dispose();
    }

    // Create root element
    const root = am5.Root.new(chartRef.current);
    rootRef.current = root;

    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create container
    const container = root.container.children.push(am5.Container.new(root, {
      width: am5.percent(100),
      height: am5.percent(100),
      layout: root.verticalLayout
    }));

    // Create WordCloud series
    const series = container.children.push(am5wc.WordCloud.new(root, {
      categoryField: "tag",
      valueField: "weight",
      calculateAggregates: true,
      maxFontSize: am5.percent(12),
      minFontSize: am5.percent(4),
      maxCount: 10,
      angles: [0, 0, 0, 0, 90, 90], // Mix of horizontal and vertical text
      rotationThreshold: 0.5
    }));

    // Prepare data from API response
    const wordCloudData = topInsights.map((insight: any) => ({
      tag: insight.word_insight,
      weight: insight.total_count,
      sentiment: insight.dominant_sentiment
    }));

    // Configure labels
    series.labels.template.setAll({
      paddingTop: 5,
      paddingBottom: 5,
      paddingLeft: 5,
      paddingRight: 5,
      fontFamily: "Arial, sans-serif",
      cursorOverStyle: "pointer"
    });

    // Set up colors based on sentiment using adapters
    series.labels.template.adapters.add("fill", function(fill, target) {
      const dataItem = target.dataItem;
      if (dataItem) {
        const dataContext = dataItem.dataContext as any;
        const sentiment = dataContext.sentiment;

        switch (sentiment) {
          case 'positive':
            return am5.color("#10B981"); // Green
          case 'negative':
            return am5.color("#EF4444"); // Red
          case 'neutral':
            return am5.color("#F59E0B"); // Yellow
          default:
            return am5.color("#6B7280"); // Gray
        }
      }
      return fill;
    });

    // Add hover effects
    series.labels.template.on("pointerover", function(ev) {
      const target = ev.target;
      target.animate({
        key: "scale",
        to: 1.2,
        duration: 200,
        easing: am5.ease.out(am5.ease.cubic)
      });
    });

    series.labels.template.on("pointerout", function(ev) {
      const target = ev.target;
      target.animate({
        key: "scale",
        to: 1,
        duration: 200,
        easing: am5.ease.out(am5.ease.cubic)
      });
    });

    // Set tooltip
    series.labels.template.set("tooltipText", "{tag}: {weight} mentions ({sentiment})");

    // Set data
    series.data.setAll(wordCloudData);

    // Cleanup function
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose();
        rootRef.current = null;
      }
    };
  }, [topInsights, isLoading]);

  // Cleanup on unmount
  useLayoutEffect(() => {
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-800">{title}</h3>
        </div>
        <div className="p-6 flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading word cloud...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-medium text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">
          Size reflects frequency • Colors show sentiment:
          <span className="text-green-600 ml-1">Positive</span>
          <span className="text-red-600 ml-1">Negative</span>
          <span className="text-yellow-600 ml-1">Neutral</span>
        </p>
      </div>
      <div
        ref={chartRef}
        style={{ width, height }}
        className="bg-gray-50"
      />
    </div>
  );
};

export default AmChartsWordCloud;
