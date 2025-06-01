/**
 * @fileoverview Analytics Statistics Component
 * @description Displays key statistics and metrics for smart analytics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { TrendingUp, TrendingDown, Users, BarChart3, Target, Activity } from 'lucide-react';

interface AnalyticsStatsData {
  totalCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
}

interface AnalyticsStatsProps {
  data: AnalyticsStatsData;
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  className?: string;
}

/**
 * Analytics statistics component
 */
const AnalyticsStats: React.FC<AnalyticsStatsProps> = ({
  data,
  isLoading = false,
  hasActiveFilters = false,
  className,
}) => {
  // Calculate additional metrics
  const sentimentRatio = data.totalCount > 0 ? {
    positiveRatio: data.positiveCount / data.totalCount,
    negativeRatio: data.negativeCount / data.totalCount,
    neutralRatio: data.neutralCount / data.totalCount,
  } : { positiveRatio: 0, negativeRatio: 0, neutralRatio: 0 };

  // Determine overall sentiment health
  const overallHealth = sentimentRatio.positiveRatio > 0.6 ? 'excellent' :
                       sentimentRatio.positiveRatio > 0.4 ? 'good' :
                       sentimentRatio.negativeRatio > 0.4 ? 'poor' : 'average';

  const healthColors = {
    excellent: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    good: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    average: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    poor: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  const stats = [
    {
      title: 'Total Insights',
      value: data.totalCount,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: hasActiveFilters ? 'Filtered view' : 'All data',
    },
    {
      title: 'Positive Insights',
      value: data.positiveCount,
      percentage: data.positivePercentage,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: sentimentRatio.positiveRatio > 0.5 ? 'up' : 'neutral',
    },
    {
      title: 'Negative Insights',
      value: data.negativeCount,
      percentage: data.negativePercentage,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: sentimentRatio.negativeRatio > 0.3 ? 'down' : 'neutral',
    },
    {
      title: 'Neutral Insights',
      value: data.neutralCount,
      percentage: data.neutralPercentage,
      icon: Activity,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      trend: 'neutral',
    },
  ];

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(stat.value)}
                      </p>
                      {stat.percentage !== undefined && (
                        <span className="text-sm text-gray-500">
                          ({formatPercentage(stat.percentage)})
                        </span>
                      )}
                    </div>
                    {stat.change && (
                      <p className="text-xs text-gray-500 mt-1">
                        {stat.change}
                      </p>
                    )}
                    {stat.trend && stat.trend !== 'neutral' && (
                      <div className="flex items-center mt-2">
                        {stat.trend === 'up' && (
                          <div className="flex items-center text-green-600 text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            <span>Above average</span>
                          </div>
                        )}
                        {stat.trend === 'down' && (
                          <div className="flex items-center text-red-600 text-xs">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            <span>Needs attention</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall Health Indicator */}
      <Card className={`${healthColors[overallHealth].bg} ${healthColors[overallHealth].border} border`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className={`w-5 h-5 ${healthColors[overallHealth].text}`} />
            Sentiment Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Health Score */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${healthColors[overallHealth].text} mb-1`}>
                {overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}
              </div>
              <p className="text-sm text-gray-600">Overall Health</p>
            </div>

            {/* Sentiment Distribution */}
            <div className="col-span-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Sentiment Distribution</span>
                  <span className="text-sm text-gray-500">{formatNumber(data.totalCount)} total</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div className="h-full flex">
                    {data.positivePercentage > 0 && (
                      <div 
                        className="bg-green-500 h-full"
                        style={{ width: `${data.positivePercentage}%` }}
                        title={`Positive: ${data.positivePercentage}%`}
                      />
                    )}
                    {data.negativePercentage > 0 && (
                      <div 
                        className="bg-red-500 h-full"
                        style={{ width: `${data.negativePercentage}%` }}
                        title={`Negative: ${data.negativePercentage}%`}
                      />
                    )}
                    {data.neutralPercentage > 0 && (
                      <div 
                        className="bg-yellow-500 h-full"
                        style={{ width: `${data.neutralPercentage}%` }}
                        title={`Neutral: ${data.neutralPercentage}%`}
                      />
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Positive ({formatPercentage(data.positivePercentage)})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Negative ({formatPercentage(data.negativePercentage)})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>Neutral ({formatPercentage(data.neutralPercentage)})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
            <div className="text-sm text-gray-600">
              {overallHealth === 'excellent' && (
                <p>Excellent sentiment health! Continue current strategies and monitor for consistency.</p>
              )}
              {overallHealth === 'good' && (
                <p>Good sentiment health. Consider strategies to increase positive feedback and address neutral responses.</p>
              )}
              {overallHealth === 'average' && (
                <p>Average sentiment health. Focus on understanding neutral feedback and converting it to positive.</p>
              )}
              {overallHealth === 'poor' && (
                <p>Sentiment health needs attention. Prioritize addressing negative feedback and implementing improvement strategies.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(AnalyticsStats);
