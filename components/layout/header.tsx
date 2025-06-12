import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, RefreshCcw, Calendar as CalendarIcon, Filter, Layers, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/hooks/use-auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// We've replaced HeaderFilter with more modern Select and Popover components

interface SelectOption {
  label: string;
  value: string;
}

interface HeaderProps {
  title: string;
  totalInsights?: number;
  showFilters?: boolean;
  
  // Control visibility of specific filters
  showSourceFilter?: boolean;
  showSurveyFilter?: boolean;
  showDateFilter?: boolean;
  
  // Filter values
  sourceValue?: string;
  surveyValue?: string;
  dateRangeValue?: DateRange;
  wordInsightValue?: string;
  sentimentValue?: string;
  // Filter options
  sourceOptions?: SelectOption[];
  surveyOptions?: SelectOption[];
  wordInsightOptions?: SelectOption[];
  sentimentOptions?: SelectOption[];
  
  // Filter callbacks
  onSourceChange?: (value: string) => void;
  onSurveyChange?: (value: string) => void;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onWordInsightChange?: (value: string) => void;
  onSentimentChange?: (value: string) => void;

  onResetFilters?: () => void;
}

export default function Header({
  title,
  totalInsights = 101,
  showFilters = true,
  showSourceFilter = true,
  showSurveyFilter = true,
  showDateFilter = true,
  sourceValue = "all",
  surveyValue = "all",
  dateRangeValue,
  wordInsightValue = "all",
  sentimentValue = "all",

  sourceOptions = [],
  surveyOptions = [],
  wordInsightOptions = [],
  sentimentOptions = [],
  onSourceChange,
  onSurveyChange,
  onDateRangeChange,
  onWordInsightChange,
  onSentimentChange,
  onResetFilters,
}: HeaderProps) {
  const pathname = usePathname();
  
  // Date range (one month ago to now)
  const today = new Date();
  const defaultDateRange = {
    from: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
    to: today
  };
  
  // Use provided values or defaults
  const source = sourceValue;
  const survey = surveyValue;
  const dateRange = dateRangeValue || (showFilters ? defaultDateRange : undefined);
  
  // Import useAuth hook
  const { logout } = useAuth();
  
  // Handler for logout action
  const handleLogout = () => {
    logout();
  };
  
  // Semua fungsi handler telah dipindahkan ke inline function dalam component

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 py-4 px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between shadow-sm">
      <h1 className="text-2xl font-display font-bold text-black tracking-tight">{title}</h1>

      <div className="flex items-center justify-between mt-4 lg:mt-0">
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap items-center gap-3 pb-2 lg:pb-0">
            {/* Total Insights Counter */}
            <div className="flex items-center bg-gradient-to-r from-blue-50 to-blue-100 rounded-full py-1 px-4 shadow-sm border border-blue-200">
              <span className="text-sm font-medium text-blue-800">
                <Layers className="h-4 w-4 inline-block mr-1.5 text-blue-600" />
                Total Insights: {totalInsights}
              </span>
            </div>

            {/* Source Filter */}
            {showSourceFilter && (
              <div className="relative w-full sm:w-auto">
                <Select 
                  value={source} 
                  onValueChange={(value) => {
                    if (onSourceChange) onSourceChange(value);
                  }}
                >
                  <SelectTrigger className="w-full min-w-[140px] bg-white border-gray-200 rounded-full shadow-sm pl-3 pr-2 py-1 h-auto">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                      <SelectValue placeholder="Source" className="text-sm truncate" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {sourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range Picker */}
            {showDateFilter && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto min-w-[140px] sm:min-w-[230px] justify-start bg-white border-gray-200 rounded-full shadow-sm pl-3 pr-2 py-1 h-auto"
                  >
                    <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-normal truncate">
                      {dateRange && dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        "Select date range"
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="overflow-hidden">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => {
                        if (onDateRangeChange) onDateRangeChange(range);
                      }}
                      initialFocus
                      numberOfMonths={2}
                      defaultMonth={dateRange?.from || new Date()}
                      className="p-2"
                    />
                    <div className="p-3 border-t border-border flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Select a date range
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs rounded-full px-3"
                        onClick={() => {
                          if (onDateRangeChange) {
                            onDateRangeChange({
                              from: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
                              to: today
                            } as DateRange);
                          }
                        }}
                      >
                        Last 30 Days
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Survey Type Filter */}
            {showSurveyFilter && (
              <div className="relative w-full sm:w-auto">
                <Select 
                  value={survey} 
                  onValueChange={(value) => {
                    if (onSurveyChange) onSurveyChange(value);
                  }}
                >
                  <SelectTrigger className="w-full min-w-[140px] bg-white border-gray-200 rounded-full shadow-sm pl-3 pr-2 py-1 h-auto">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                      <SelectValue placeholder="Location" className="text-sm truncate" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {surveyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Word Insight Filter - NEW */}
            <div className="relative w-full sm:w-auto">
              <Select 
                value={wordInsightValue} 
                onValueChange={(value) => {
                  if (onWordInsightChange) onWordInsightChange(value);
                }}
              >
                <SelectTrigger className="w-full min-w-[140px] bg-white border-gray-200 rounded-full shadow-sm pl-3 pr-2 py-1 h-auto">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <SelectValue placeholder="Topic" className="text-sm truncate" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {wordInsightOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sentiment Filter */}
            <div className="relative w-full sm:w-auto">
              <Select 
                value={sentimentValue} 
                onValueChange={(value) => {
                  if (onSentimentChange) onSentimentChange(value);
                }}
              >
                <SelectTrigger className="w-full min-w-[140px] bg-white border-gray-200 rounded-full shadow-sm pl-3 pr-2 py-1 h-auto">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <SelectValue placeholder="Sentiment" className="text-sm truncate" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  {sentimentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            <Button 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm rounded-full px-4 py-1 h-8"
              onClick={() => {
                if (onResetFilters) onResetFilters();
              }}
            >
              <RefreshCcw className="h-4 w-4 mr-1.5 flex-shrink-0" /> Reset
            </Button>
          </div>
        )}

        {/* User Profile - Always show regardless of showFilters */}
        <div className="flex items-center gap-2 ml-auto">
          <Avatar className="h-8 w-8 border-2 border-blue-100">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs">
              T
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-medium text-gray-800">Tester</p>
            <p className="text-xs text-gray-500">User</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="h-4 w-4 mr-2 text-gray-500" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}