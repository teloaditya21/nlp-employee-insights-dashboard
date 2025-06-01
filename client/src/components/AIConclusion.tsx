import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIConclusionProps {
  conclusion?: string | null;
  isGenerating?: boolean;
  onGenerate?: () => void;
  className?: string;
  currentPage?: string;
  compact?: boolean;
}

const AIConclusion: React.FC<AIConclusionProps> = ({
  conclusion,
  isGenerating = false,
  onGenerate,
  className,
  currentPage,
  compact = false
}) => {
  const getPageTitle = (page?: string) => {
    switch (page) {
      case 'survey-dashboard':
        return 'Survey Dashboard';
      case 'top-insights':
        return 'Top Insights';
      case 'smart-analytics':
        return 'Smart Analytics';
      default:
        return 'Current Page';
    }
  };

  if (compact) {
    return (
      <Card className={cn("border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 w-full h-auto", className)}>
        <CardContent className="p-4 h-auto">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 text-blue-600" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold text-gray-900">AI Insights</h4>
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Auto
                </Badge>
              </div>

              {isGenerating ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menganalisis data...
                </div>
              ) : conclusion ? (
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words word-wrap overflow-wrap-anywhere" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
                    {conclusion}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Belum ada analisis AI. Klik tombol untuk menghasilkan insights.
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              {!conclusion && onGenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onGenerate) {
                      onGenerate();
                    }
                  }}
                  disabled={isGenerating}
                  className="text-xs"
                >
                  Generate
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 w-full h-auto", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              {isGenerating ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <Brain className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                AI Instant Conclusion
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>

            {!conclusion && onGenerate && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onGenerate) {
                    onGenerate();
                  }
                }}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                Generate Insights
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-auto">
        {isGenerating ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                AI sedang menganalisis data dan menghasilkan insights...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Proses ini membutuhkan beberapa detik
              </p>
            </div>
          </div>
        ) : conclusion ? (
          <div className="space-y-4 w-full">
            <div className="bg-white rounded-lg p-6 border border-blue-100 w-full h-auto overflow-visible">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-gray-800 leading-relaxed text-sm md:text-base flex-1">
                  {/* Format the conclusion with proper styling for sections */}
                  <div
                    className="prose prose-sm md:prose-base max-w-none"
                    style={{
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      lineHeight: '1.7'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: conclusion
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-semibold text-lg block mb-2 mt-4 first:mt-0">$1</strong>')
                        .replace(/\n\n/g, '</p><p class="mt-3 mb-3">')
                        .replace(/^/, '<p class="mb-3">')
                        .replace(/$/, '</p>')
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum Ada Analisis AI
            </h3>
            <p className="text-gray-600 mb-4">
              Klik tombol "Generate Insights" untuk mendapatkan analisis AI berdasarkan data yang sedang ditampilkan.
            </p>
            {onGenerate && (
              <Button
                variant="default"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onGenerate) {
                    onGenerate();
                  }
                }}
                disabled={isGenerating}
                className="gap-2"
              >
                <Brain className="w-4 h-4" />
                Generate AI Insights
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIConclusion;
