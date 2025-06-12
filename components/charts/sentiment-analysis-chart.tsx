'use client';

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SentimentAnalysisChartProps {
  data: Array<{
    topic: string;
    positive: number;
    negative: number;
    neutral: number;
    total: number;
    confidence: number;
  }>;
}

const COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#F59E0B',
};

export default function SentimentAnalysisChart({ data }: SentimentAnalysisChartProps) {
  // Transform data for scatter plot
  const scatterData = data.map(item => ({
    x: item.positive - item.negative, // Sentiment score
    y: item.total, // Volume
    z: item.confidence, // Confidence (for size)
    topic: item.topic,
    sentiment: item.positive > item.negative ? 'positive' : item.negative > item.positive ? 'negative' : 'neutral',
  }));

  const getColor = (sentiment: string) => {
    return COLORS[sentiment as keyof typeof COLORS] || COLORS.neutral;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Sentiment Score"
            domain={[-100, 100]}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Volume"
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border rounded shadow">
                    <p className="font-medium">{data.topic}</p>
                    <p>Sentiment Score: {data.x.toFixed(1)}</p>
                    <p>Volume: {data.y}</p>
                    <p>Confidence: {(data.z * 100).toFixed(1)}%</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter data={scatterData} fill="#8884d8">
            {scatterData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.sentiment)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
