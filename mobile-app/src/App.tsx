import React, { useState, useEffect } from 'react'
import { Route, Switch } from 'wouter'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InsightDetailPage from './pages/InsightDetailPage'
import { AuthProvider, useAuth } from './hooks/useAuth'
import ErrorBoundary from './components/ErrorBoundary'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()



  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-container">
      <Switch>
        <Route path="/login">
          {isAuthenticated ? <DashboardPage /> : <LoginPage />}
        </Route>
        <Route path="/dashboard">
          {isAuthenticated ? <DashboardPage /> : <LoginPage />}
        </Route>
        <Route path="/insight-detail">
          {isAuthenticated ? <InsightDetailPage /> : <LoginPage />}
        </Route>
        <Route path="/">
          {isAuthenticated ? <DashboardPage /> : <LoginPage />}
        </Route>
      </Switch>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
