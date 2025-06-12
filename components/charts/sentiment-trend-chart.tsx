'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SentimentTrendChartProps {
  data: Array<{
    name: string;
    positive: number;
    negative: number;
    neutral: number;
    total: number;
  }>;
}

const COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#F59E0B',
};

export default function SentimentTrendChart({ data }: SentimentTrendChartProps) {
  // Aggregate sentiment data
  const aggregatedData = data.reduce(
    (acc, item) => {
      acc.positive += item.positive * item.total / 100;
      acc.negative += item.negative * item.total / 100;
      acc.neutral += item.neutral * item.total / 100;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0 }
  );

  const pieData = [
    { name: 'Positive', value: aggregatedData.positive, color: COLORS.positive },
    { name: 'Negative', value: aggregatedData.negative, color: COLORS.negative },
    { name: 'Neutral', value: aggregatedData.neutral, color: COLORS.neutral },
  ];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [value.toFixed(0), 'Count']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
