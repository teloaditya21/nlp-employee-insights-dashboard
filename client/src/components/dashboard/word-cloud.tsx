import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import './word-cloud.css';

interface WordCloudDataItem {
  wordInsight: string;
  totalCount: number;
}

interface WordCloudProps {
  data?: Array<{
    tag: string;
    weight: number;
  }>;
  width?: string;
  height?: string;
  title?: string;
  useRealData?: boolean;
}

// Predefined colors for words
const COLORS = [
  "#0984E3", // blue
  "#00B894", // green
  "#E84393", // pink
  "#6C5CE7", // purple
  "#FDCB6E", // yellow
  "#E17055", // orange
  "#2D3436"  // dark gray
];

const WordCloud: React.FC<WordCloudProps> = ({ 
  data, 
  width = '100%', 
  height = '300px',
  title = "Common Topics",
  useRealData = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  
  // Fetch real data from the API if useRealData is true
  const { data: apiData, isLoading } = useQuery({
    queryKey: ['/api/survey-dashboard/summary'],
    queryFn: async () => {
      if (!useRealData) return null;
      
      const response = await fetch('/api/survey-dashboard/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch word cloud data');
      }
      
      const result = await response.json();
      return result.data as WordCloudDataItem[];
    },
    enabled: useRealData
  });
  
  // Determine which data to use (API data or prop data)
  const cloudData = useRealData && apiData 
    ? apiData.map(item => ({
        tag: item.wordInsight,
        weight: item.totalCount
      }))
    : data || [];
    
  // Zoom in/out functions
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };
  
  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };
  
  // Reset function
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Zoom in
      setScale(prev => Math.min(prev + 0.1, 3));
    } else {
      // Zoom out
      setScale(prev => Math.max(prev - 0.1, 0.5));
    }
  };
  
  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPosition({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - startPosition.x,
      y: e.clientY - startPosition.y
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Get deterministic color for a word
  const getColor = (word: string) => {
    const hashCode = word.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    return COLORS[hashCode % COLORS.length];
  };
  
  // Generate words with more natural placement
  const renderWords = () => {
    if (!cloudData || cloudData.length === 0) return [];
    
    // Sort and limit data to prevent overcrowding
    const sortedData = [...cloudData].sort((a, b) => b.weight - a.weight);
    const limitedData = sortedData.slice(0, 9); // Further reduce to only 9 words
    
    // Use custom placement instead of strict grid
    return limitedData.map((item, index) => {
      // Generate semi-random positions that still ensure readability
      // Add some noise to prevent perfect grid alignment
      const noise = () => (Math.random() * 10) - 5; // -5 to +5 percent variation
      
      // Division of visual space into general areas, with padding
      const padding = 15;
      const availableWidth = 100 - (padding * 2);
      const availableHeight = 100 - (padding * 2);
      
      // Basic position calculation (still roughly in a 3x3 grid)
      const row = Math.floor(index / 3);
      const col = index % 3;
      
      const baseX = padding + (col * (availableWidth / 3)) + (availableWidth / 6);
      const baseY = padding + (row * (availableHeight / 3)) + (availableHeight / 6);
      
      // Apply noise to create more natural, less grid-like placement
      const x = baseX + noise();
      const y = baseY + noise();
      
      // Get a consistent color for this word
      const color = getColor(item.tag);
      
      // Calculate font size based on weight, but keep range smaller
      const maxWeight = Math.max(...limitedData.map(d => d.weight));
      const minSize = 16; // Slightly larger minimum size
      const maxSize = 22;
      const fontSize = minSize + ((item.weight / maxWeight) * (maxSize - minSize));
      
      return (
        <div
          key={`word-${index}`}
          className="word-item"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            fontSize: `${fontSize}px`,
            color: color,
            transform: `translate(-50%, -50%)`,
            fontWeight: item.weight === maxWeight ? "bold" : "normal"
          }}
        >
          {item.tag}
        </div>
      );
    });
  };

  // Show loading state
  if (useRealData && isLoading) {
    return (
      <div className="rounded-xl bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-800">{title}</h3>
        </div>
        <div style={{ width, height }} className="flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading word cloud data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-medium text-gray-800">{title}</h3>
        <div className="flex space-x-2">
          <button 
            className="zoom-button" 
            onClick={zoomIn}
            aria-label="Zoom In"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button 
            className="zoom-button" 
            onClick={zoomOut}
            aria-label="Zoom Out"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button 
            className="zoom-button" 
            onClick={resetZoom}
            aria-label="Reset Zoom"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3M3 12H9M3 12L5.5 9.5M3 12L5.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div 
        ref={containerRef}
        className="word-cloud-container"
        style={{ 
          width, 
          height,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="word-cloud-inner"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease'
          }}
        >
          {renderWords()}
        </div>
      </div>
    </div>
  );
};

export default WordCloud;