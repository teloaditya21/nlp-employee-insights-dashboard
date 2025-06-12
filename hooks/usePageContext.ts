import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '@/utils/constants';

export interface PageContextData {
  user_session_id: string;
  current_page: 'survey-dashboard' | 'top-insights' | 'smart-analytics';
  active_filters: Record<string, any>;
  displayed_data: Record<string, any>;
  total_insights: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  top_keywords: string[];
  date_range: string;
  location_filter: string;
  source_filter: string;
  ai_conclusion?: string;
  ai_conclusion_generated_at?: string;
}

export interface PageContextResponse {
  success: boolean;
  data: PageContextData;
  message: string;
}

export interface AIConclusion {
  ai_conclusion: string;
  ai_conclusion_generated_at: string;
  user_session_id: string;
  current_page: string;
}

const API_BASE_URL = 'https://employee-insights-api.adityalasika.workers.dev';

// Generate or get session ID from localStorage
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('page_context_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('page_context_session_id', sessionId);
  }
  return sessionId;
};

export const usePageContext = (currentPage: PageContextData['current_page']) => {
  const [pageContext, setPageContext] = useState<PageContextData | null>(null);
  const [aiConclusion, setAiConclusion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = getSessionId();

  // Fetch current page context
  const fetchPageContext = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/page-context/${sessionId}/${currentPage}`);
      const result: PageContextResponse = await response.json();

      if (result.success) {
        setPageContext(result.data);
        setAiConclusion(result.data.ai_conclusion || null);

        // Auto-generate AI conclusion if not present
        if (!result.data.ai_conclusion) {
          setTimeout(() => {
            generateAIConclusion().catch(error => {
              console.error('Error auto-generating AI conclusion:', error);
            });
          }, 500); // Small delay to ensure page context is set
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch page context');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentPage]);

  // Update page context
  const updatePageContext = useCallback(async (
    contextData: Partial<PageContextData>,
    generateAI: boolean = false
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const updateData = {
        user_session_id: sessionId,
        current_page: currentPage,
        generate_ai_conclusion: generateAI,
        ...contextData
      };

      const response = await fetch(`${API_BASE_URL}/api/page-context/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (result.success) {
        setPageContext(result.data);
        if (result.data.ai_conclusion) {
          setAiConclusion(result.data.ai_conclusion);
        }
        return result.data;
      } else {
        setError(result.message);
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update page context');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentPage]);

  // Generate AI conclusion
  const generateAIConclusion = useCallback(async (contextSummary?: Record<string, any>) => {
    try {
      setIsGeneratingAI(true);
      setError(null);

      // Use current page context if no summary provided
      const rawSummary = contextSummary || {
        page: currentPage,
        total_insights: pageContext?.total_insights || 0,
        positive_count: pageContext?.positive_count || 0,
        negative_count: pageContext?.negative_count || 0,
        neutral_count: pageContext?.neutral_count || 0,
        top_keywords: pageContext?.top_keywords || [],
        filters: {
          date_range: pageContext?.date_range || 'All Time',
          location_filter: pageContext?.location_filter || 'All Cities',
          source_filter: pageContext?.source_filter || 'All Sources',
          active_filters: pageContext?.active_filters || {}
        }
      };

      // Sanitize the summary to remove any circular references
      const summary = JSON.parse(JSON.stringify(rawSummary));

      const response = await fetch(`${API_BASE_URL}/api/ai-conclusion/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_session_id: sessionId,
          current_page: currentPage,
          context_summary: summary
        })
      });

      const result = await response.json();

      if (result.success) {
        setAiConclusion(result.data.ai_conclusion);
        // Update local page context with new AI conclusion
        if (pageContext) {
          setPageContext({
            ...pageContext,
            ai_conclusion: result.data.ai_conclusion,
            ai_conclusion_generated_at: result.data.ai_conclusion_generated_at
          });
        }
        return result.data;
      } else {
        setError(result.message);
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI conclusion');
      throw err;
    } finally {
      setIsGeneratingAI(false);
    }
  }, [sessionId, currentPage, pageContext]);

  // Track page filters and data changes
  const trackPageData = useCallback(async (data: {
    filters?: Record<string, any>;
    insights?: any[];
    totalCount?: number;
    sentimentCounts?: {
      positive: number;
      negative: number;
      neutral: number;
    };
    topKeywords?: string[];
  }) => {
    try {
      const {
        filters = {},
        insights = [],
        totalCount = 0,
        sentimentCounts = { positive: 0, negative: 0, neutral: 0 },
        topKeywords = []
      } = data;

      // Sanitize filters to remove any circular references or DOM elements
      const sanitizedFilters = JSON.parse(JSON.stringify({
        search: filters.search || '',
        selectedTopics: Array.isArray(filters.selectedTopics) ? filters.selectedTopics : [],
        selectedSentiment: filters.selectedSentiment || 'all',
        dateRange: filters.dateRange || 'All Time',
        kota: filters.kota || '',
        location: filters.location || '',
        source: filters.source || '',
        witel: filters.witel || '',
        activeFilterDescriptions: Array.isArray(filters.activeFilterDescriptions) ? filters.activeFilterDescriptions : []
      }));

      // Sanitize top keywords to ensure they're just strings
      const sanitizedKeywords = Array.isArray(topKeywords)
        ? topKeywords.filter(keyword => typeof keyword === 'string').slice(0, 10)
        : [];

      const contextUpdate: Partial<PageContextData> = {
        active_filters: sanitizedFilters,
        displayed_data: {
          insights_count: insights.length,
          last_updated: new Date().toISOString(),
          filters_applied: Object.keys(sanitizedFilters).some(key =>
            sanitizedFilters[key] && sanitizedFilters[key] !== '' && sanitizedFilters[key] !== 'all'
          )
        },
        total_insights: totalCount,
        positive_count: sentimentCounts.positive,
        negative_count: sentimentCounts.negative,
        neutral_count: sentimentCounts.neutral,
        top_keywords: sanitizedKeywords,
        date_range: sanitizedFilters.dateRange || 'All Time',
        location_filter: sanitizedFilters.kota || sanitizedFilters.location || 'All Cities',
        source_filter: sanitizedFilters.source || 'All Sources'
      };

      await updatePageContext(contextUpdate, true); // Auto-generate AI conclusion
    } catch (error) {
      console.error('Error in trackPageData:', error);
      // Don't throw error to prevent breaking the UI
    }
  }, [updatePageContext]);

  // Auto-fetch context on mount and page change
  useEffect(() => {
    fetchPageContext();
  }, [fetchPageContext]);

  return {
    pageContext,
    aiConclusion,
    isLoading,
    isGeneratingAI,
    error,
    sessionId,
    fetchPageContext,
    updatePageContext,
    generateAIConclusion,
    trackPageData
  };
};

export default usePageContext;
