'use client';

import React from 'react';

interface CorrelationMatrixProps {
  data: Array<{
    topic: string;
    engagement: number;
    sentiment_score: number;
    volume: number;
    impact: number;
  }>;
}

export default function CorrelationMatrix({ data }: CorrelationMatrixProps) {
  // Calculate correlation matrix
  const metrics = ['engagement', 'sentiment_score', 'volume', 'impact'];
  const correlations: number[][] = [];

  for (let i = 0; i < metrics.length; i++) {
    correlations[i] = [];
    for (let j = 0; j < metrics.length; j++) {
      if (i === j) {
        correlations[i][j] = 1;
      } else {
        // Simple correlation calculation
        const metric1 = data.map(d => d[metrics[i] as keyof typeof d] as number);
        const metric2 = data.map(d => d[metrics[j] as keyof typeof d] as number);
        
        const mean1 = metric1.reduce((a, b) => a + b, 0) / metric1.length;
        const mean2 = metric2.reduce((a, b) => a + b, 0) / metric2.length;
        
        const numerator = metric1.reduce((sum, val, idx) => 
          sum + (val - mean1) * (metric2[idx] - mean2), 0);
        
        const denominator = Math.sqrt(
          metric1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) *
          metric2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0)
        );
        
        correlations[i][j] = denominator === 0 ? 0 : numerator / denominator;
      }
    }
  }

  const getColor = (value: number) => {
    const intensity = Math.abs(value);
    if (value > 0) {
      return `rgba(16, 185, 129, ${intensity})`;
    } else {
      return `rgba(239, 68, 68, ${intensity})`;
    }
  };

  return (
    <div className="w-full h-80 flex items-center justify-center">
      <div className="grid grid-cols-4 gap-1">
        {/* Header row */}
        <div></div>
        {metrics.map(metric => (
          <div key={metric} className="text-xs font-medium text-center p-2">
            {metric.replace('_', ' ')}
          </div>
        ))}
        
        {/* Data rows */}
        {metrics.map((rowMetric, i) => (
          <React.Fragment key={rowMetric}>
            <div className="text-xs font-medium p-2">
              {rowMetric.replace('_', ' ')}
            </div>
            {correlations[i].map((correlation, j) => (
              <div
                key={j}
                className="w-16 h-16 flex items-center justify-center text-xs font-bold text-white rounded"
                style={{ backgroundColor: getColor(correlation) }}
              >
                {correlation.toFixed(2)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
