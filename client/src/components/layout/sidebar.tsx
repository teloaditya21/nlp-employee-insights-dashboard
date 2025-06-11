import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Brain, ChartLine, Star, BarChart3, Settings } from "lucide-react";
import nlpLogo from "../../assets/logo-nlp.webp";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { CURRENT_CONFIG } from "@/utils/constants";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
}

const SidebarItem = ({ href, icon, children, badge }: SidebarItemProps) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href}>
      <div
        className={cn(
          "sidebar-item",
          isActive && "active"
        )}
      >
        <span className="w-5 text-gray-500">{icon}</span>
        <span className="ml-3">{children}</span>
        {badge && (
          <span className="ml-auto bg-gray-100 text-xs rounded-full px-2 py-1">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
};

interface TopInsightItemProps {
  label: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
}

const TopInsightItem = ({ label, count, sentiment, onClick }: TopInsightItemProps) => {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-yellow-600';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 rounded-md cursor-pointer transition-all duration-200"
      onClick={onClick}
    >
      <span className={`truncate ${getSentimentColor(sentiment)}`}># {label}</span>
      <span className="bg-gray-100 text-xs rounded-full px-2 py-1 text-gray-700">{count}</span>
    </div>
  );
};

// Interface untuk format respons API
interface TopWordInsight {
  id: number;
  word_insight: string;
  total_count: number;
  positif_percentage: number;
  negatif_percentage: number;
  netral_percentage: number;
  dominant_sentiment: 'positive' | 'negative' | 'neutral';
}

interface ApiResponse {
  success: boolean;
  data: TopWordInsight[];
  total: number;
  message: string;
}

// Hook untuk mengambil data top insights dari D1 database
function useTopWordInsights() {
  return useQuery<TopWordInsight[]>({
    queryKey: ['/api/insights/top-10'],
    queryFn: async () => {
      const response = await fetch(`${CURRENT_CONFIG.API_BASE_URL}/api/insights/top-10`);
      if (!response.ok) {
        throw new Error('Failed to fetch top insights from D1 database');
      }
      const data: ApiResponse = await response.json();
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Helper function to censor employee names
function censorEmployeeName(name: string): string {
  if (!name || name.length === 0) return 'Unknown';
  if (name.length === 1) return name + '*****';
  return name.charAt(0) + '*****';
}

// Component for the insight detail popup
interface InsightDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  insightLabel: string;
  insightData: any;
  isLoading: boolean;
}

const InsightDetailPopup = ({ isOpen, onClose, insightLabel, insightData, isLoading }: InsightDetailPopupProps) => {
  if (!insightData || !insightData.data) {
    return null;
  }

  const data = insightData.data;

  // Calculate sentiment percentages
  const totalCount = data.length;
  const positiveCount = data.filter((item: any) => item.sentimen === 'positif').length;
  const negativeCount = data.filter((item: any) => item.sentimen === 'negatif').length;
  const neutralCount = data.filter((item: any) => item.sentimen === 'netral').length;

  const positivePercentage = totalCount > 0 ? ((positiveCount / totalCount) * 100).toFixed(2) : '0';
  const negativePercentage = totalCount > 0 ? ((negativeCount / totalCount) * 100).toFixed(2) : '0';
  const neutralPercentage = totalCount > 0 ? ((neutralCount / totalCount) * 100).toFixed(2) : '0';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Detail Insight</DialogTitle>
          <DialogDescription className="text-base">
            {insightLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Sentiment Distribution */}
          <div>
            <h4 className="text-sm font-medium mb-2">Distribusi Sentimen</h4>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div className="flex h-full rounded-full overflow-hidden">
                <div
                  className="bg-yellow-500"
                  style={{ width: `${neutralPercentage}%` }}
                ></div>
                <div
                  className="bg-red-500"
                  style={{ width: `${negativePercentage}%` }}
                ></div>
                <div
                  className="bg-green-500"
                  style={{ width: `${positivePercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 my-2">
              <div className="bg-yellow-50 p-3 rounded-md text-center">
                <p className="text-xs text-gray-500">Netral</p>
                <p className="text-xl font-bold text-yellow-500">{neutralPercentage}%</p>
              </div>
              <div className="bg-red-50 p-3 rounded-md text-center">
                <p className="text-xs text-gray-500">Negatif</p>
                <p className="text-xl font-bold text-red-500">{negativePercentage}%</p>
              </div>
              <div className="bg-green-50 p-3 rounded-md text-center">
                <p className="text-xs text-gray-500">Positif</p>
                <p className="text-xl font-bold text-green-500">{positivePercentage}%</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h4 className="text-sm font-medium mb-2">Statistik</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-md text-center">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <p className="text-xs text-gray-500">Comments</p>
                <p className="text-2xl font-bold text-gray-600">0</p>
              </div>
            </div>
          </div>

          {/* Data Detail */}
          <div>
            <h4 className="text-sm font-medium mb-2">Data Detail</h4>
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
                  {data.map((item: any) => (
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
          </div>

          {/* Sentence Detail */}
          <div>
            <h4 className="text-sm font-medium mb-2">Sentence Detail</h4>
            <div className="overflow-auto max-h-[300px] border rounded-md">
              <div className="divide-y divide-gray-200">
                {data.map((item: any) => (
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
                          // You can add functionality to show full original insight here
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Sidebar() {
  // Menggunakan fungsi query untuk mendapatkan data top word insights
  const { data: topWordInsights, isLoading } = useTopWordInsights();

  // State for popup
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  // Fetch detailed data when popup is opened
  const { data: insightDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: [`/api/insights/details/${selectedInsight}`, showPopup],
    queryFn: async () => {
      if (!showPopup || !selectedInsight) return null;
      const response = await fetch(`${CURRENT_CONFIG.API_BASE_URL}/api/insights/details/${encodeURIComponent(selectedInsight)}?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch insight details');
      return response.json();
    },
    enabled: showPopup && !!selectedInsight,
  });

  // Handle insight item click
  const handleInsightClick = (insightLabel: string) => {
    setSelectedInsight(insightLabel);
    setShowPopup(true);
  };

  // Handle popup close
  const handlePopupClose = () => {
    setShowPopup(false);
    setSelectedInsight(null);
  };

  console.log('Top insights in Sidebar:', topWordInsights);

  return (
    <aside className="w-64 bg-white shadow-neu flex-shrink-0 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-gray-100 flex items-center">
        <img
          src={nlpLogo}
          alt="NLP Logo"
          className="h-20 w-28"
        />
      </div>

      <div className="p-4 border-b border-gray-100">
        <nav className="space-y-1">
          <SidebarItem href="/my-insights" icon={<ChartLine size={18} />}>
            My Insight
          </SidebarItem>
          <SidebarItem href="/survey-dashboard" icon={<BarChart3 size={18} />}>
            Survey Dashboard
          </SidebarItem>
          <SidebarItem href="/top-insights" icon={<Star size={18} />}>
            Top Insight
          </SidebarItem>
          <SidebarItem href="/smart-analytics" icon={<Brain size={18} />}>
            Smart Analytics
          </SidebarItem>
          <SidebarItem href="/settings" icon={<Settings size={18} />}>
            Settings
          </SidebarItem>
        </nav>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          TOP INSIGHTS
        </p>
        <nav className="mt-4 space-y-1">
          {isLoading ? (
            // Tampilkan loading state saat data sedang dimuat
            <div className="text-center py-4 text-gray-400 text-sm">
              Loading insights...
            </div>
          ) : topWordInsights && topWordInsights.length > 0 ? (
            // Tampilkan data jika tersedia
            topWordInsights.map((insight) => (
              <TopInsightItem
                key={insight.id}
                label={insight.word_insight}
                count={insight.total_count}
                sentiment={insight.dominant_sentiment}
                onClick={() => handleInsightClick(insight.word_insight)}
              />
            ))
          ) : (
            // Tampilkan pesan jika tidak ada data
            <div className="text-center py-4 text-gray-400 text-sm">
              No insights available
            </div>
          )}
        </nav>
      </div>

      {/* Insight Detail Popup */}
      <InsightDetailPopup
        isOpen={showPopup}
        onClose={handlePopupClose}
        insightLabel={selectedInsight || ''}
        insightData={insightDetails}
        isLoading={isDetailsLoading}
      />
    </aside>
  );
}
