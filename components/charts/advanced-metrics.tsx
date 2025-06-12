'use client';

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AdvancedMetricsProps {
  metrics: {
    sentimentStability: number;
    topicDiversity: number;
    engagementRate: number;
    polarizationIndex: number;
  };
}

export default function AdvancedMetrics({ metrics }: AdvancedMetricsProps) {
  const data = [
    {
      name: 'Sentiment Stability',
      value: Math.min(100, Math.max(0, 100 - metrics.sentimentStability)),
      fill: '#8884d8',
    },
    {
      name: 'Topic Diversity',
      value: Math.min(100, metrics.topicDiversity * 2),
      fill: '#82ca9d',
    },
    {
      name: 'Engagement Rate',
      value: Math.min(100, metrics.engagementRate / 10),
      fill: '#ffc658',
    },
    {
      name: 'Polarization Index',
      value: Math.min(100, metrics.polarizationIndex),
      fill: '#ff7300',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Radial Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={data}>
            <RadialBar
              label={{ position: 'insideStart', fill: '#fff' }}
              background
              dataKey="value"
            />
            <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
            <Tooltip />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800">Sentiment Stability</h4>
          <p className="text-2xl font-bold text-blue-600">
            {(100 - metrics.sentimentStability).toFixed(1)}%
          </p>
          <p className="text-xs text-blue-600">Higher is better</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-800">Topic Diversity</h4>
          <p className="text-2xl font-bold text-green-600">
            {metrics.topicDiversity}
          </p>
          <p className="text-xs text-green-600">Unique topics</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800">Engagement Rate</h4>
          <p className="text-2xl font-bold text-yellow-600">
            {metrics.engagementRate.toFixed(1)}
          </p>
          <p className="text-xs text-yellow-600">Avg. per topic</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-orange-800">Polarization Index</h4>
          <p className="text-2xl font-bold text-orange-600">
            {metrics.polarizationIndex.toFixed(1)}%
          </p>
          <p className="text-xs text-orange-600">Lower is better</p>
        </div>
      </div>
    </div>
  );
}
