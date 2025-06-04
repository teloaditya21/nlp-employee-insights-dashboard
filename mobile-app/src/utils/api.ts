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
  // Get word cloud data
  async getWordCloudData(): Promise<WordCloudData[]> {
    try {
      const response = await api.get('/api/survey-data')
      console.log('Survey data API response:', response.data)

      // Process survey data to create word cloud
      const surveyData = response.data.data || []
      const wordFrequency: { [key: string]: number } = {}

      // Extract words from feedback and count frequency
      surveyData.forEach((item: any) => {
        if (item.feedback) {
          const words = item.feedback
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter((word: string) => word.length > 3)

          words.forEach((word: string) => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1
          })
        }
      })

      // Convert to word cloud format and sort by frequency
      return Object.entries(wordFrequency)
        .map(([text, value]) => ({ text, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 50)
    } catch (error) {
      console.error('Error fetching word cloud data:', error)
      return []
    }
  },

  // Get top insights
  async getTopInsights(limit: number = 10): Promise<TopInsight[]> {
    try {
      const response = await api.get('/api/survey-data')
      console.log('Survey data for insights:', response.data)

      const surveyData = response.data.data || []

      // Process survey data to create insights
      const insights = surveyData
        .filter((item: any) => item.feedback && item.feedback.length > 10)
        .map((item: any, index: number) => {
          // Calculate importance score based on multiple factors
          const feedbackLength = item.feedback.length
          const sentimentWeight = item.sentiment === 'positive' ? 1.2 : item.sentiment === 'negative' ? 1.5 : 1.0
          const lengthScore = Math.min(feedbackLength / 100, 3) // Max 3 points for length
          const randomFactor = Math.random() * 2 // Add some randomness
          const importance_score = (lengthScore * sentimentWeight + randomFactor) * 2

          return {
            id: item.id || `insight-${index}`,
            insight: item.feedback,
            sentiment: item.sentiment || 'neutral',
            importance_score: Math.min(importance_score, 10), // Cap at 10
            witel: item.witel || item.kota || 'Unknown',
            source: item.source || 'Survey',
            created_at: item.created_at || new Date().toISOString()
          }
        })
        .sort((a: any, b: any) => b.importance_score - a.importance_score)
        .slice(0, limit)

      return insights
    } catch (error) {
      console.error('Error fetching top insights:', error)
      return []
    }
  },

  // Get survey data for insights
  async getSurveyData(): Promise<InsightData[]> {
    try {
      const response = await api.get('/api/survey-data')
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching survey data:', error)
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
