'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendAnalysisChartProps {
  data: Array<{
    period: string;
    value: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    topic: string;
  }>;
}

const COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#F59E0B',
};

export default function TrendAnalysisChart({ data }: TrendAnalysisChartProps) {
  // Group data by sentiment for multiple lines
  const groupedData = data.reduce((acc, item) => {
    const existing = acc.find(d => d.period === item.period);
    if (existing) {
      existing[item.sentiment] = (existing[item.sentiment] || 0) + item.value;
    } else {
      acc.push({
        period: item.period,
        positive: item.sentiment === 'positive' ? item.value : 0,
        negative: item.sentiment === 'negative' ? item.value : 0,
        neutral: item.sentiment === 'neutral' ? item.value : 0,
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={groupedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="positive" 
            stroke={COLORS.positive} 
            strokeWidth={2}
            name="Positive"
          />
          <Line 
            type="monotone" 
            dataKey="negative" 
            stroke={COLORS.negative} 
            strokeWidth={2}
            name="Negative"
          />
          <Line 
            type="monotone" 
            dataKey="neutral" 
            stroke={COLORS.neutral} 
            strokeWidth={2}
            name="Neutral"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
