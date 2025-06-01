/**
 * @fileoverview Top Insights Charts Component
 * @description Word cloud and map visualizations for top insights
 */

import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/common';
import { BarChart3, Map, AlertCircle } from 'lucide-react';

// Lazy load chart components
const AmChartsWordCloud = React.lazy(() => import('@/components/dashboard/amcharts-word-cloud'));
const IndonesiaMap = React.lazy(() => import('@/components/dashboard/indonesia-map'));

interface WordCloudDataPoint {
  tag: string;
  weight: number;
}

interface MapDataPoint {
  id: number;
  location: string;
  sentiment: string;
  insight: string;
}

interface TopInsightsChartsProps {
  wordCloudData?: WordCloudDataPoint[];
  mapData: MapDataPoint[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Top insights charts component
 */
const TopInsightsCharts: React.FC<TopInsightsChartsProps> = ({
  wordCloudData,
  mapData,
  isLoading = false,
  className,
}) => {
  // Process map data for visualization
  const processedMapData = React.useMemo(() => {
    if (!mapData || mapData.length === 0) return [];

    // Group by location and calculate sentiment distribution
    const locationGroups = mapData.reduce((acc, item) => {
      const location = item.location;
      if (!acc[location]) {
        acc[location] = {
          location,
          total: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
        };
      }
      
      acc[location].total++;
      acc[location][item.sentiment as keyof typeof acc[typeof location]]++;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(locationGroups);
  }, [mapData]);

  // Process word cloud data
  const processedWordCloudData = React.useMemo(() => {
    if (!wordCloudData || wordCloudData.length === 0) {
      // Generate sample data from map data if word cloud data is not available
      const words = mapData
        .flatMap(item => item.insight.split(' '))
        .filter(word => word.length > 3)
        .reduce((acc, word) => {
          const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
          acc[cleanWord] = (acc[cleanWord] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      return Object.entries(words)
        .map(([tag, weight]) => ({ tag, weight }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 50);
    }

    return wordCloudData;
  }, [wordCloudData, mapData]);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Word Cloud Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Word Cloud Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loading variant="spinner" text="Loading word cloud..." />
            </div>
          ) : processedWordCloudData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No word cloud data available</p>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <Suspense 
                fallback={
                  <div className="h-full flex items-center justify-center">
                    <Loading variant="spinner" text="Loading word cloud..." />
                  </div>
                }
              >
                <AmChartsWordCloud 
                  data={processedWordCloudData}
                  height="100%"
                />
              </Suspense>
            </div>
          )}
          
          {/* Word Cloud Legend */}
          {processedWordCloudData.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Top Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {processedWordCloudData.slice(0, 10).map((item, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white rounded text-xs text-gray-600 border"
                  >
                    {item.tag} ({item.weight})
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loading variant="spinner" text="Loading map..." />
            </div>
          ) : processedMapData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No geographic data available</p>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <Suspense 
                fallback={
                  <div className="h-full flex items-center justify-center">
                    <Loading variant="spinner" text="Loading map..." />
                  </div>
                }
              >
                <IndonesiaMap 
                  data={processedMapData}
                  height="100%"
                />
              </Suspense>
            </div>
          )}

          {/* Map Legend */}
          {processedMapData.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Sentiment Legend
              </h4>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Positive</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Negative</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Neutral</span>
                </div>
              </div>
              
              {/* Top Locations */}
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-600 mb-1">
                  Top Locations by Insights
                </h5>
                <div className="space-y-1">
                  {processedMapData
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map((location, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600">{location.location}</span>
                        <span className="font-medium">{location.total} insights</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(TopInsightsCharts);
