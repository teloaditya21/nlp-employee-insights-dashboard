import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  const formatOptions: Intl.DateTimeFormatOptions = { 
    day: "2-digit", 
    month: "short", 
    year: "numeric"
  };
  
  const startFormatted = startDate.toLocaleDateString("en-US", formatOptions);
  const endFormatted = endDate.toLocaleDateString("en-US", formatOptions);
  
  return `${startFormatted} - ${endFormatted}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function calculateSentimentPercentages(
  neutral: number,
  negative: number,
  positive: number
): { 
  neutralPercentage: number; 
  negativePercentage: number; 
  positivePercentage: number 
} {
  const total = neutral + negative + positive;
  if (total === 0) return { neutralPercentage: 0, negativePercentage: 0, positivePercentage: 0 };
  
  return {
    neutralPercentage: Math.round((neutral / total) * 100),
    negativePercentage: Math.round((negative / total) * 100),
    positivePercentage: Math.round((positive / total) * 100)
  };
}
