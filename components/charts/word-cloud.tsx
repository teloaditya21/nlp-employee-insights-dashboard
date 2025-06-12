'use client';

import React from 'react';

interface WordCloudVisualizationProps {
  data: Array<{
    text: string;
    value: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
}

const SENTIMENT_COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#F59E0B',
};

export default function WordCloudVisualization({ data }: WordCloudVisualizationProps) {
  // Simple word cloud implementation using CSS
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="w-full h-80 flex flex-wrap items-center justify-center gap-2 p-4 overflow-hidden">
      {data.slice(0, 30).map((word, index) => {
        const fontSize = Math.max(12, (word.value / maxValue) * 32);
        const opacity = Math.max(0.6, word.value / maxValue);
        
        return (
          <span
            key={index}
            className="inline-block cursor-pointer transition-transform hover:scale-110"
            style={{
              fontSize: `${fontSize}px`,
              color: SENTIMENT_COLORS[word.sentiment],
              opacity,
              fontWeight: word.value > maxValue * 0.7 ? 'bold' : 'normal',
            }}
            title={`${word.text}: ${word.value} mentions (${word.sentiment})`}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
}
