'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TopInsightsChartProps {
  data: Array<{
    name: string;
    value: number;
    positive: number;
    negative: number;
    neutral: number;
  }>;
}

const COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#F59E0B',
};

export default function TopInsightsChart({ data }: TopInsightsChartProps) {
  // Determine color based on dominant sentiment
  const getBarColor = (item: any) => {
    const max = Math.max(item.positive, item.negative, item.neutral);
    if (max === item.positive) return COLORS.positive;
    if (max === item.negative) return COLORS.negative;
    return COLORS.neutral;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [value, 'Total Count']}
            labelFormatter={(label) => `Topic: ${label}`}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
