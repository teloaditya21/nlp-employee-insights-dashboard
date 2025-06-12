'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PredictiveInsightsProps {
  data: Array<{
    topic: string;
    current: number;
    predicted: number;
    confidence: number;
    trend: 'up' | 'down';
  }>;
}

export default function PredictiveInsights({ data }: PredictiveInsightsProps) {
  const chartData = data.slice(0, 10).map(item => ({
    topic: item.topic.length > 15 ? item.topic.substring(0, 15) + '...' : item.topic,
    current: item.current,
    predicted: Math.round(item.predicted),
    confidence: item.confidence * 100,
    trend: item.trend,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="topic" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={10}
          />
          <YAxis />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border rounded shadow">
                    <p className="font-medium">{label}</p>
                    <p>Current: {data.current}</p>
                    <p>Predicted: {data.predicted}</p>
                    <p>Confidence: {data.confidence.toFixed(1)}%</p>
                    <p>Trend: {data.trend === 'up' ? '↗️ Increasing' : '↘️ Decreasing'}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Bar dataKey="current" fill="#3B82F6" name="Current" />
          <Bar dataKey="predicted" fill="#10B981" name="Predicted" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
