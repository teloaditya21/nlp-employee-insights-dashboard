import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      const token = localStorage.getItem('mobile_auth_token')
      const loginTime = localStorage.getItem('mobile_login_time')
      
      if (token && loginTime) {
        const now = Date.now()
        const loginTimestamp = parseInt(loginTime)
        const oneMinute = 60 * 1000 // 1 minute in milliseconds
        
        if (now - loginTimestamp < oneMinute) {
          setIsAuthenticated(true)
        } else {
          // Session expired
          localStorage.removeItem('mobile_auth_token')
          localStorage.removeItem('mobile_login_time')
          setIsAuthenticated(false)
        }
      }
      setIsLoading(false)
    }

    checkAuth()

    // Set up session timeout check
    const interval = setInterval(() => {
      const loginTime = localStorage.getItem('mobile_login_time')
      if (loginTime) {
        const now = Date.now()
        const loginTimestamp = parseInt(loginTime)
        const oneMinute = 60 * 1000
        
        if (now - loginTimestamp >= oneMinute) {
          logout()
        }
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Validate credentials
      if (username === 'nlp@admin' && password === '12345') {
        const token = 'mobile_' + Math.random().toString(36).substr(2, 9)
        const loginTime = Date.now().toString()
        
        localStorage.setItem('mobile_auth_token', token)
        localStorage.setItem('mobile_login_time', loginTime)
        setIsAuthenticated(true)
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('mobile_auth_token')
    localStorage.removeItem('mobile_login_time')
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
