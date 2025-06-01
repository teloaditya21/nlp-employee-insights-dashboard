import { X, Info, Pin, Bookmark } from "lucide-react";
import {
  ProgressBar,
  SentimentMetrics,
  InsightStats
} from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBookmarkState } from "@/hooks/useBookmarks";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper function untuk sensor nama karyawan
function censorEmployeeName(name: string): string {
  if (!name || name === 'Anonymous' || name.trim() === '') {
    return 'Anonymous';
  }

  // Ambil huruf pertama dan ganti sisanya dengan *****
  const firstChar = name.charAt(0).toUpperCase();
  return `${firstChar}*****`;
}

export interface InsightData {
  id: number;
  title: string;
  neutralPercentage: number;
  negativePercentage: number;
  positivePercentage: number;
  views: number;
  comments: number;
}

interface InsightItemProps {
  insight: InsightData;
  onRemove?: (id: number) => void;
  onPin?: (insight: InsightData) => void;
  isPinned?: boolean;
}

export function InsightItem({ insight, onRemove, onPin, isPinned = false }: InsightItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  // Use bookmark state from API
  const { isBookmarked, toggleBookmark, isLoading: isBookmarkLoading } = useBookmarkState(insight.id, insight.title);

  // Function to handle bookmark click
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark();

    // Keep legacy onPin callback for compatibility
    if (onPin) onPin(insight);
  };

  // Fetch detailed data from employee_insights when dialog is opened
  const { data: insightDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: [`/api/insights/details/${insight.title}`, showDetails],
    queryFn: async () => {
      if (!showDetails) return null;
      // Request up to 100 items to ensure we get all data available
      const response = await fetch(`https://employee-insights-api.adityalasika.workers.dev/api/insights/details/${encodeURIComponent(insight.title)}?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch insight details');
      return response.json();
    },
    enabled: showDetails,
  });

  return (
    <>
      <div
        className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium text-sm text-gray-700">{insight.title}</p>
          <div className="flex space-x-2">
            <button
              className="text-gray-400 hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
            >
              <Info className="h-4 w-4" />
            </button>
            {onPin && (
              <button
                className={`${isBookmarked ? 'text-blue-500' : 'text-gray-400'} hover:text-blue-600 ${isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleBookmarkClick}
                disabled={isBookmarkLoading}
                title={isBookmarked ? "Tersimpan di My Insights - Klik untuk menghapus" : "Simpan ke My Insights"}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}
            {onRemove && (
              <button
                className="text-gray-400 hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRemove) onRemove(insight.id);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <ProgressBar
          neutralPercentage={insight.neutralPercentage}
          negativePercentage={insight.negativePercentage}
          positivePercentage={insight.positivePercentage}
          className="mb-2"
        />

        <SentimentMetrics
          neutralPercentage={insight.neutralPercentage}
          negativePercentage={insight.negativePercentage}
          positivePercentage={insight.positivePercentage}
        />

        <InsightStats views={insight.views} comments={insight.comments} />
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{insight.title}</DialogTitle>
            <DialogDescription className="text-base">
              Detail Insight
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Distribusi Sentimen</h4>
              <ProgressBar
                neutralPercentage={insight.neutralPercentage}
                negativePercentage={insight.negativePercentage}
                positivePercentage={insight.positivePercentage}
                className="mb-2"
              />

              <div className="grid grid-cols-3 gap-2 my-2">
                <div className="bg-yellow-50 p-3 rounded-md text-center">
                  <p className="text-xs text-gray-500">Netral</p>
                  <p className="text-xl font-bold text-yellow-500">{insight.neutralPercentage}%</p>
                </div>
                <div className="bg-red-50 p-3 rounded-md text-center">
                  <p className="text-xs text-gray-500">Negatif</p>
                  <p className="text-xl font-bold text-red-500">{insight.negativePercentage}%</p>
                </div>
                <div className="bg-green-50 p-3 rounded-md text-center">
                  <p className="text-xs text-gray-500">Positif</p>
                  <p className="text-xl font-bold text-green-500">{insight.positivePercentage}%</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Statistik</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-blue-500">{insight.views}</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Comments</p>
                  <p className="text-lg font-bold text-indigo-500">{insight.comments}</p>
                </div>
              </div>
            </div>

            {isDetailsLoading && (
              <div className="flex justify-center py-4">
                <p className="text-gray-500">Memuat data detail...</p>
              </div>
            )}

            {!isDetailsLoading && insightDetails && insightDetails.data && insightDetails.data.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Data Detail</h4>
                <div className="space-y-4">
                  <div className="overflow-auto max-h-60 border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sumber</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karyawan</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kota</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentimen</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {insightDetails.data.map((item: any) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-xs">{item.sourceData}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs">{censorEmployeeName(item.employeeName)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs">
                              {format(new Date(item.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs">{item.kota}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.sentimen === 'positif'
                                  ? 'bg-green-100 text-green-800'
                                  : item.sentimen === 'negatif'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.sentimen}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h4 className="text-sm font-medium mb-2">Sentence Detail</h4>
                  <div className="overflow-auto max-h-[500px] border rounded-md">
                    <div className="divide-y divide-gray-200">
                      {insightDetails.data.map((item: any) => (
                        <div key={`sentence-${item.id}`} className="p-3 hover:bg-gray-50">
                          <div className="flex items-start space-x-2 mb-1">
                            <div className="flex-shrink-0 mt-0.5">
                              <span className={`inline-block w-2 h-2 rounded-full ${
                                item.sentimen === 'positif'
                                  ? 'bg-green-500'
                                  : item.sentimen === 'negatif'
                                  ? 'bg-red-500'
                                  : 'bg-yellow-500'
                              }`}></span>
                            </div>
                            <p className="text-xs text-gray-700">{item.sentenceInsight}</p>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500 mt-1 pl-4">
                            <div>
                              <span>{censorEmployeeName(item.employeeName)}</span>
                              <span className="mx-2">•</span>
                              <span>{item.sourceData}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInsight(item.originalInsight);
                              }}
                              className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                            >
                              Lihat Lengkap
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-right text-gray-500">
                  Menampilkan {insightDetails.data.length} dari {insightDetails.total} data
                </div>
              </div>
            )}

            {!isDetailsLoading && (!insightDetails || !insightDetails.data || insightDetails.data.length === 0) && (
              <div className="py-4 text-center text-gray-500">
                Tidak ada data detail untuk ditampilkan.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog to display original insight */}
      <Dialog open={!!selectedInsight} onOpenChange={() => setSelectedInsight(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Komentar Lengkap</DialogTitle>
          </DialogHeader>
          <div className="mt-2 p-4 bg-gray-50 rounded-md text-sm text-gray-700 max-h-[60vh] overflow-y-auto">
            {selectedInsight}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function untuk mendapatkan sentimen dominan
function getDominantSentiment(insight: InsightData): "neutral" | "negative" | "positive" {
  const { neutralPercentage, negativePercentage, positivePercentage } = insight;

  if (neutralPercentage >= negativePercentage && neutralPercentage >= positivePercentage) {
    return "neutral";
  } else if (negativePercentage >= neutralPercentage && negativePercentage >= positivePercentage) {
    return "negative";
  } else {
    return "positive";
  }
}

// Helper function untuk mendapatkan percentage berdasarkan jenis sentimen
function getPercentageForSentiment(insight: InsightData, sentiment: "neutral" | "negative" | "positive"): number {
  switch (sentiment) {
    case "neutral":
      return insight.neutralPercentage;
    case "negative":
      return insight.negativePercentage;
    case "positive":
      return insight.positivePercentage;
    default:
      return 0;
  }
}

// Helper function untuk deskripsi sentimen
function getDominantSentimentDescription(insight: InsightData): string {
  const sentiment = getDominantSentiment(insight);

  switch (sentiment) {
    case "neutral":
      return " netral atau seimbang";
    case "negative":
      return " negatif dan perlu perhatian";
    case "positive":
      return " positif dan menunjukkan kepuasan";
    default:
      return "";
  }
}

export interface SentimentCategoryProps {
  title: string;
  badge: number;
  type: "neutral" | "negative" | "positive";
  insights: InsightData[];
  onRemoveInsight?: (id: number) => void;
  onPinInsight?: (insight: InsightData) => void;
  className?: string;
}

export function SentimentCategoryCard({
  title,
  badge,
  type,
  insights,
  onRemoveInsight,
  onPinInsight,
  className,
}: SentimentCategoryProps) {
  const getBadgeColor = () => {
    switch (type) {
      case "neutral":
        return "bg-yellow-100 text-yellow-800";
      case "negative":
        return "bg-red-100 text-red-800";
      case "positive":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={cn("bg-white rounded-[12px] shadow-[0_10px_20px_rgba(0,0,0,0.05)] overflow-hidden card-hover", className)}>
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-primary">{title}</h3>
          <span className={`${getBadgeColor()} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
            {badge}
          </span>
        </div>

      </div>

      {insights.map((insight) => (
        <InsightItem
          key={insight.id}
          insight={insight}
          onRemove={onRemoveInsight}
          onPin={onPinInsight}
        />
      ))}
    </div>
  );
}
