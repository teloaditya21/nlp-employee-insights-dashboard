import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Brain, Sparkles, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIConclusionProps {
  conclusion?: string | null;
  isGenerating?: boolean;
  onGenerate?: () => void;
  className?: string;
  currentPage?: string;
  compact?: boolean;
}

interface ParsedAIContent {
  executiveSummary: string;
  deepAnalysis: string;
  improvementEfforts: string;
}

const AIConclusion: React.FC<AIConclusionProps> = ({
  conclusion,
  isGenerating = false,
  onGenerate,
  className,
  currentPage,
  compact = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Validate if content has sufficient data
  const hasValidContent = (text: string | null): boolean => {
    if (!text || text.trim().length < 50) return false;

    // Check if it's not just loading/error messages
    const invalidPatterns = [
      /sedang diproses/i,
      /akan segera tersedia/i,
      /belum ada/i,
      /tidak tersedia/i,
      /error/i,
      /gagal/i,
      /loading/i,
      /memuat/i,
      /tunggu/i,
      /mohon tunggu/i,
      /^\.+$/,  // Only dots
      /^-+$/,   // Only dashes
      /^_+$/    // Only underscores
    ];

    // Check if content is meaningful (has actual words)
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 2).length;
    if (wordCount < 10) return false;

    return !invalidPatterns.some(pattern => pattern.test(text));
  };

  // Parse AI conclusion into structured content
  const parseAIContent = (text: string): ParsedAIContent => {
    if (!text || !hasValidContent(text)) {
      return {
        executiveSummary: '',
        deepAnalysis: '',
        improvementEfforts: ''
      };
    }

    // Look for structured sections in the AI response
    const summaryMatch = text.match(/\*\*SUMMARY EKSEKUTIF\*\*:?\s*(.*?)(?=\*\*ANALISIS MENDALAM\*\*|$)/gi);
    const analysisMatch = text.match(/\*\*ANALISIS MENDALAM\*\*:?\s*(.*?)(?=\*\*UPAYA PENGEMBANGAN\*\*|$)/gi);
    const improvementMatch = text.match(/\*\*UPAYA PENGEMBANGAN\*\*:?\s*(.*?)$/gi);

    let executiveSummary = '';
    let deepAnalysis = '';
    let improvementEfforts = '';

    if (summaryMatch && analysisMatch && improvementMatch) {
      // Structured content found
      executiveSummary = summaryMatch[1].trim();
      deepAnalysis = analysisMatch[1].trim();
      improvementEfforts = improvementMatch[1].trim();
    } else {
      // Fallback: intelligent parsing
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length > 0) {
        // Take first 4-6 sentences for executive summary
        const summaryCount = Math.min(6, Math.max(4, Math.ceil(sentences.length * 0.3)));
        executiveSummary = sentences.slice(0, summaryCount).join('. ').trim() + '.';

        // Remaining content for analysis and improvements
        const remainingText = sentences.slice(summaryCount).join('. ').trim();

        // Look for improvement/recommendation keywords
        const improvementKeywords = /(?:upaya|rekomendasi|saran|perbaikan|pengembangan|strategi|langkah|tindakan|solusi)/i;
        const improvementMatch = remainingText.search(improvementKeywords);

        if (improvementMatch !== -1) {
          deepAnalysis = remainingText.substring(0, improvementMatch).trim();
          improvementEfforts = remainingText.substring(improvementMatch).trim();
        } else {
          // Split remaining content roughly in half
          const midPoint = Math.floor(remainingText.length / 2);
          const splitPoint = remainingText.indexOf('. ', midPoint);
          if (splitPoint !== -1) {
            deepAnalysis = remainingText.substring(0, splitPoint + 1).trim();
            improvementEfforts = remainingText.substring(splitPoint + 1).trim();
          } else {
            deepAnalysis = remainingText;
            improvementEfforts = '';
          }
        }
      }
    }

    return {
      executiveSummary: executiveSummary || '',
      deepAnalysis: deepAnalysis || '',
      improvementEfforts: improvementEfforts || ''
    };
  };

  const parsedContent = conclusion && hasValidContent(conclusion) ? parseAIContent(conclusion) : null;
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
    // Don't show compact version if no valid content and not generating
    if (!isGenerating && !parsedContent) {
      return null;
    }

    return (
      <Card className={cn("border-blue-200 bg-white shadow-sm w-full", className)}>
        <CardContent className="p-3">
          <div className="w-full">
            <div className="w-full">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-xs font-medium text-gray-900">AI Insights</h4>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  <Sparkles className="w-2 h-2 mr-1" />
                  NLP AI
                </Badge>
              </div>

              {isGenerating ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Menganalisis...</span>
                </div>
              ) : parsedContent ? (
                <div
                  className="text-xs text-gray-700 leading-relaxed max-h-16 overflow-y-auto pr-1 custom-scrollbar-compact"
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    lineHeight: '1.5',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 transparent'
                  }}
                >
                  <p>{parsedContent.executiveSummary}</p>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show main component if no valid content and not generating
  if (!isGenerating && !parsedContent) {
    return null;
  }

  return (
    <Card className={cn("border-blue-200 bg-white shadow-sm w-full", className)}>
      <CardContent className="p-4">
        <div className="w-full">
          {/* Content */}
          <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-gray-900">AI Instant Conclusion</h3>
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                <Sparkles className="w-3 h-3 mr-1" />
                NLP AI
              </Badge>
            </div>

            {/* Content */}
            {isGenerating ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menganalisis data...</span>
              </div>
            ) : parsedContent ? (
              <div className="space-y-3">
                {/* Executive Summary with scroll for long content */}
                <div
                  className="text-sm text-gray-700 leading-relaxed max-h-24 overflow-y-auto pr-2 custom-scrollbar"
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    lineHeight: '1.6',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 transparent'
                  }}
                >
                  <p>{parsedContent.executiveSummary}</p>
                </div>

                <style jsx>{`
                  .custom-scrollbar::-webkit-scrollbar,
                  .custom-scrollbar-compact::-webkit-scrollbar {
                    width: 4px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track,
                  .custom-scrollbar-compact::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb,
                  .custom-scrollbar-compact::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 2px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover,
                  .custom-scrollbar-compact::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                  }
                `}</style>

                {/* Detail Button - Only show if there's additional content */}
                {(parsedContent.deepAnalysis || parsedContent.improvementEfforts) && (
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Lihat Detail Analisis
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader className="border-b border-gray-200 pb-6 mb-8">
                        <DialogTitle>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Detail Analisis AI - PT Telkom</h2>
                            <p className="text-base text-gray-600">{getPageTitle(currentPage)} • Employee Insights Dashboard</p>
                          </div>
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-8">
                        {/* Executive Summary Section */}
                        {parsedContent.executiveSummary && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200 shadow-sm">
                            <div className="mb-6">
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ringkasan Eksekutif</h3>
                              <div className="w-16 h-1 bg-blue-500 rounded-full"></div>
                            </div>
                            <div
                              className="text-gray-700 leading-relaxed text-lg space-y-4"
                              style={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                hyphens: 'auto',
                                lineHeight: '1.8'
                              }}
                            >
                              <div className="bg-white/60 rounded-lg p-6 border border-blue-100">
                                <h4 className="font-semibold text-gray-800 mb-3 text-xl">Insight Strategis PT Telkom</h4>
                                <p className="text-gray-700">{parsedContent.executiveSummary}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Deep Analysis Section */}
                        {parsedContent.deepAnalysis && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200 shadow-sm">
                            <div className="mb-6">
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">Analisis Mendalam</h3>
                              <div className="w-16 h-1 bg-green-500 rounded-full"></div>
                            </div>
                            <div
                              className="text-gray-700 leading-relaxed text-lg space-y-6"
                              style={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                hyphens: 'auto',
                                lineHeight: '1.8'
                              }}
                            >
                              <div className="bg-white/60 rounded-lg p-6 border border-green-100">
                                <h4 className="font-semibold text-gray-800 mb-4 text-xl">Analisis Komprehensif untuk PT Telkom</h4>
                                <div className="prose prose-lg max-w-none">
                                  <p className="text-gray-700 mb-4">{parsedContent.deepAnalysis}</p>

                                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                      <h5 className="font-medium text-green-800 mb-2">Kekuatan Utama</h5>
                                      <p className="text-sm text-green-700">Identifikasi area positif yang dapat dipertahankan dan dikembangkan lebih lanjut dalam ekosistem PT Telkom.</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                      <h5 className="font-medium text-amber-800 mb-2">Area Pengembangan</h5>
                                      <p className="text-sm text-amber-700">Fokus pada aspek yang memerlukan perhatian khusus untuk meningkatkan kepuasan dan produktivitas karyawan.</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Development/Improvement Efforts Section */}
                        {parsedContent.improvementEfforts && (
                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-8 border border-orange-200 shadow-sm">
                            <div className="mb-6">
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">Upaya Pengembangan</h3>
                              <div className="w-16 h-1 bg-orange-500 rounded-full"></div>
                            </div>
                            <div
                              className="text-gray-700 leading-relaxed text-lg space-y-6"
                              style={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                hyphens: 'auto',
                                lineHeight: '1.8'
                              }}
                            >
                              <div className="bg-white/60 rounded-lg p-6 border border-orange-100">
                                <h4 className="font-semibold text-gray-800 mb-4 text-xl">Rekomendasi Strategis untuk PT Telkom</h4>
                                <div className="prose prose-lg max-w-none">
                                  <p className="text-gray-700 mb-6">{parsedContent.improvementEfforts}</p>

                                  <div className="space-y-4">
                                    <div className="bg-orange-50 rounded-lg p-5 border border-orange-200">
                                      <h5 className="font-medium text-orange-800 mb-3 text-lg">Langkah Prioritas</h5>
                                      <p className="text-sm text-orange-700 mb-3">Implementasi segera untuk dampak maksimal pada kepuasan karyawan dan produktivitas organisasi.</p>
                                      <div className="flex items-center text-xs text-orange-600">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                                        <span>Timeline: 1-3 bulan</span>
                                      </div>
                                    </div>

                                    <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                                      <h5 className="font-medium text-blue-800 mb-3 text-lg">Pengembangan Jangka Menengah</h5>
                                      <p className="text-sm text-blue-700 mb-3">Inisiatif strategis untuk membangun fondasi yang kuat bagi pertumbuhan berkelanjutan PT Telkom.</p>
                                      <div className="flex items-center text-xs text-blue-600">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                        <span>Timeline: 3-12 bulan</span>
                                      </div>
                                    </div>

                                    <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
                                      <h5 className="font-medium text-purple-800 mb-3 text-lg">Visi Jangka Panjang</h5>
                                      <p className="text-sm text-purple-700 mb-3">Transformasi berkelanjutan untuk menjadikan PT Telkom sebagai perusahaan telekomunikasi terdepan dengan karyawan yang highly engaged.</p>
                                      <div className="flex items-center text-xs text-purple-600">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                        <span>Timeline: 1-3 tahun</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>


                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIConclusion;
