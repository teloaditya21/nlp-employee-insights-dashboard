'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GeographicDistributionProps {
  data: Array<{
    name: string;
    positive: number;
    negative: number;
    neutral: number;
    total: number;
  }>;
}

export default function GeographicDistribution({ data }: GeographicDistributionProps) {
  // Mock geographic data based on insights
  const geographicData = [
    { region: 'Jakarta', value: data.slice(0, 5).reduce((acc, item) => acc + item.total, 0) },
    { region: 'Surabaya', value: data.slice(5, 10).reduce((acc, item) => acc + item.total, 0) },
    { region: 'Bandung', value: data.slice(10, 15).reduce((acc, item) => acc + item.total, 0) },
    { region: 'Medan', value: data.slice(15, 20).reduce((acc, item) => acc + item.total, 0) },
    { region: 'Makassar', value: data.slice(20, 25).reduce((acc, item) => acc + item.total, 0) },
    { region: 'Denpasar', value: data.slice(25, 30).reduce((acc, item) => acc + item.total, 0) },
  ].filter(item => item.value > 0);

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={geographicData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="region" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [value, 'Total Insights']}
            labelFormatter={(label) => `Region: ${label}`}
          />
          <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
