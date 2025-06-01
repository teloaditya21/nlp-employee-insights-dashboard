import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KotaSummary } from '@/types/kota-summary';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KotaSummaryCardProps {
  kotaSummary: KotaSummary;
  className?: string;
}

export function KotaSummaryCard({ kotaSummary, className }: KotaSummaryCardProps) {
  const getDominantSentiment = () => {
    const { positif_percentage, negatif_percentage, netral_percentage } = kotaSummary;
    
    if (positif_percentage >= negatif_percentage && positif_percentage >= netral_percentage) {
      return { type: 'positive', percentage: positif_percentage, icon: TrendingUp, color: 'text-green-600' };
    } else if (negatif_percentage >= positif_percentage && negatif_percentage >= netral_percentage) {
      return { type: 'negative', percentage: negatif_percentage, icon: TrendingDown, color: 'text-red-600' };
    } else {
      return { type: 'neutral', percentage: netral_percentage, icon: Minus, color: 'text-yellow-600' };
    }
  };

  const dominant = getDominantSentiment();
  const DominantIcon = dominant.icon;

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {kotaSummary.kota}
          </CardTitle>
          <div className="flex items-center space-x-1">
            <DominantIcon className={`h-4 w-4 ${dominant.color}`} />
            <span className={`text-sm font-medium ${dominant.color}`}>
              {dominant.percentage}%
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Total Count */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {kotaSummary.total_count.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Total Insights</div>
        </div>

        {/* Sentiment Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Positif</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {kotaSummary.positif_count}
              </span>
              <Badge variant="secondary" className="text-xs">
                {kotaSummary.positif_percentage}%
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Negatif</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {kotaSummary.negatif_count}
              </span>
              <Badge variant="secondary" className="text-xs">
                {kotaSummary.negatif_percentage}%
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Netral</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {kotaSummary.netral_count}
              </span>
              <Badge variant="secondary" className="text-xs">
                {kotaSummary.netral_percentage}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="flex h-2 rounded-full overflow-hidden">
            <div 
              className="bg-green-500" 
              style={{ width: `${kotaSummary.positif_percentage}%` }}
            ></div>
            <div 
              className="bg-red-500" 
              style={{ width: `${kotaSummary.negatif_percentage}%` }}
            ></div>
            <div 
              className="bg-yellow-500" 
              style={{ width: `${kotaSummary.netral_percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-400 text-center">
          Updated: {new Date(kotaSummary.updated_at).toLocaleDateString('id-ID')}
        </div>
      </CardContent>
    </Card>
  );
}
