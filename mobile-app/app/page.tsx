'use client'

import React, { useState, memo, useCallback, useEffect } from 'react'
import { useAuth } from '../src/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import Image from 'next/image'

interface LoginFormData {
  username: string
  password: string
}

const LoginPage = memo(function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, authLoading, router])

  const handleInputChange = useCallback((field: keyof LoginFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('') // Clear error when user starts typing
  }, [error])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const success = await login(formData.username, formData.password)
      if (success) {
        router.push('/dashboard')
      } else {
        setError('Invalid username or password')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [formData.username, formData.password, login, router])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen p-6">
        {/* Logo Section - Simplified */}
        <div className="flex justify-center pt-12 mb-12">
          <div className="text-center">
            <Image
              src="/logo-nlp.webp"
              alt="NLP Logo"
              width={320}
              height={180}
              className="w-80 h-44 mx-auto"
              priority
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-start justify-center">
          <div className="w-full max-w-sm">
            {/* Login Title - Simplified */}
            <div className="mb-10 text-center">
              <h1 className="font-black text-gray-900 mb-4 text-5xl leading-none">
                Login
              </h1>
              <p className="text-gray-600 text-lg font-medium mb-2">Enter your credentials to access dashboard</p>
            </div>

            {/* Login Form - Simplified Design */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-red-600 text-sm font-semibold">{error}</p>
                      <button
                        onClick={() => setError('')}
                        className="text-red-400 hover:text-red-600 transition-colors ml-3"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                {/* Username Field */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 ml-1">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username')(e.target.value)}
                      className="w-full py-4 pl-14 pr-4 bg-white border-2 rounded-2xl text-base text-gray-900 placeholder-gray-400 transition-all duration-300 relative z-0 text-center placeholder:text-center shadow-sm hover:shadow-md focus:shadow-lg border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-blue-50/30 focus:ring-4 focus:ring-blue-100"
                      placeholder="nlp@admin"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password')(e.target.value)}
                      className="w-full py-4 pl-14 pr-14 bg-white border-2 rounded-2xl text-base text-gray-900 placeholder-gray-400 transition-all duration-300 relative z-0 text-center placeholder:text-center shadow-sm hover:shadow-md focus:shadow-lg border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-blue-50/30 focus:ring-4 focus:ring-blue-100"
                      placeholder="•••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors duration-200 z-10 hover:scale-110 transform text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Login Button - Custom Gradient */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-6 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 touch-manipulation active:scale-95 transform hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, #f4f9ff 0%, #8738eb 100%)'
                    }}
                  >
                    <div className="flex items-center justify-center">
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <span>Login</span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Terms and Privacy Policy */}
                <div className="pt-4 text-center">
                  <p className="text-xs text-gray-500">
                    By clicking Login, you agree to our{' '}
                    <span className="text-blue-600 hover:text-blue-800 cursor-pointer">Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-blue-600 hover:text-blue-800 cursor-pointer">Privacy Policy</span>.
                  </p>
                </div>
              </form>
            </div>

            {/* Footer Text - Removed */}
          </div>
        </div>
      </div>
    </div>
  )
})

export default LoginPage
