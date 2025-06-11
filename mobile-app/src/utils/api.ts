import axios from 'axios'

const API_BASE_URL = 'https://employee-insights-api.adityalasika.workers.dev'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mobile_auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('mobile_auth_token')
      localStorage.removeItem('mobile_login_time')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export interface InsightData {
  id: string
  employee_name: string
  feedback: string
  sentiment: 'positive' | 'negative' | 'neutral'
  witel: string
  source: string
  created_at: string
  total_count?: number
}

export interface WordCloudData {
  text: string
  value: number
  category?: string
}

export interface TopInsight {
  id: string
  insight: string
  sentiment: 'positive' | 'negative' | 'neutral'
  importance_score: number
  witel: string
  source: string
  created_at: string
}

// API Functions
export const apiService = {
  // Get word cloud data from D1 database
  async getWordCloudData(): Promise<WordCloudData[]> {
    try {
      const response = await api.get('/api/insights/top-10')
      console.log('D1 insights API response:', response.data)

      // Process D1 insights data to create word cloud
      const insightsData = response.data.data || []

      // Convert D1 insights to word cloud format
      const wordCloudData = insightsData.map((item: any) => ({
        text: item.word_insight || item.wordInsight,
        value: item.total_count || item.totalCount || 1,
        category: item.dominant_sentiment || 'neutral'
      }))

      return wordCloudData.slice(0, 50) // Top 50 insights
    } catch (error) {
      console.error('Error fetching word cloud data from D1:', error)
      return []
    }
  },

  // Get top insights from D1 database
  async getTopInsights(limit: number = 10): Promise<TopInsight[]> {
    try {
      const response = await api.get('/api/insights/top-10')
      console.log('D1 insights data for mobile:', response.data)

      const insightsData = response.data.data || []

      // Transform D1 data to mobile format
      const insights = insightsData
        .map((item: any, index: number) => {
          return {
            id: item.id || `insight-${index}`,
            insight: item.word_insight || item.wordInsight || 'No insight available',
            sentiment: item.dominant_sentiment || 'neutral',
            importance_score: Math.min(item.total_count || 1, 10), // Use total_count as importance, cap at 10
            witel: item.witel || 'Unknown',
            source: 'Employee Feedback',
            created_at: item.created_at || new Date().toISOString()
          }
        })
        .sort((a: any, b: any) => b.importance_score - a.importance_score)
        .slice(0, limit)

      return insights
    } catch (error) {
      console.error('Error fetching top insights from D1:', error)
      return []
    }
  },

  // Get employee insights data from D1 database
  async getSurveyData(): Promise<InsightData[]> {
    try {
      const response = await api.get('/api/employee-insights/paginated?limit=100')
      const data = response.data.data || []

      // Transform D1 employee insights to mobile format
      return data.map((item: any) => ({
        id: item.id.toString(),
        employee_name: item.employeeName || item.employee_name || 'Unknown',
        feedback: item.sentenceInsight || item.sentence_insight || item.originalInsight || 'No feedback',
        sentiment: item.sentimen || item.sentiment || 'neutral',
        witel: item.witel || 'Unknown',
        source: item.sourceData || item.source || 'Employee Feedback',
        created_at: item.date || item.created_at || new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error fetching employee insights from D1:', error)
      return []
    }
  },

  // Get AI summary
  async getAISummary(data: any): Promise<string> {
    try {
      const response = await api.post('/api/ai-summary', { data })
      return response.data.summary || 'No summary available'
    } catch (error) {
      console.error('Error fetching AI summary:', error)
      return 'Unable to generate summary at this time'
    }
  }
}

export default api
