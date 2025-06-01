import { cn } from "@/lib/utils";

interface ProgressBarProps {
  neutralPercentage: number;
  negativePercentage: number;
  positivePercentage: number;
  className?: string;
}

export function ProgressBar({
  neutralPercentage,
  negativePercentage,
  positivePercentage,
  className,
}: ProgressBarProps) {
  return (
    <div
      className={cn("h-1.5 rounded-full overflow-hidden bg-muted", className)}
    >
      <div className="flex h-full">
        <div
          className="bg-[#FDCB6E]"
          style={{ width: `${neutralPercentage}%` }}
        />
        <div
          className="bg-[#FF7675]"
          style={{ width: `${negativePercentage}%` }}
        />
        <div
          className="bg-[#00B894]"
          style={{ width: `${positivePercentage}%` }}
        />
      </div>
    </div>
  );
}

interface SentimentIndicatorProps {
  color: string;
  label: string;
  percentage: number;
}

export function SentimentIndicator({
  color,
  label,
  percentage,
}: SentimentIndicatorProps) {
  return (
    <div className="flex items-center space-x-1">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-gray-500">
        {label}: {percentage}%
      </span>
    </div>
  );
}

interface SentimentMetricsProps {
  neutralPercentage: number;
  negativePercentage: number;
  positivePercentage: number;
}

export function SentimentMetrics({
  neutralPercentage,
  negativePercentage,
  positivePercentage,
}: SentimentMetricsProps) {
  return (
    <div className="flex items-center text-xs text-gray-500 space-x-6">
      <SentimentIndicator
        color="#FDCB6E"
        label="Netral"
        percentage={neutralPercentage}
      />
      <SentimentIndicator
        color="#FF7675"
        label="Negatif"
        percentage={negativePercentage}
      />
      <SentimentIndicator
        color="#00B894"
        label="Positif"
        percentage={positivePercentage}
      />
    </div>
  );
}

interface InsightStatsProps {
  views: number;
  comments: number;
}

export function InsightStats({ views, comments }: InsightStatsProps) {
  return (
    <div className="flex items-center space-x-6 mt-3 text-xs text-gray-500">
      <div className="flex items-center space-x-1">
        <span className="font-bold">#</span>
        <span>{views}</span>
      </div>
      <div className="flex items-center space-x-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-message-square"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Total Feedback: {comments}</span>
      </div>
    </div>
  );
}
