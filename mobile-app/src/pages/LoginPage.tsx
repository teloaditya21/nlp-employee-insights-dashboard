import React, { useState, memo, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import logoNLP from '../assets/logo-nlp.webp'

const LoginPage = memo(function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const success = await login(username, password)
      if (!success) {
        setError('Invalid username or password')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [username, password, login])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex flex-col p-6">


      {/* Logo - Centered, Larger and Wider */}
      <div className="flex justify-center mb-12">
        <div className="text-center">
          <img
            src={logoNLP}
            alt="NLP Logo"
            className="w-72 h-40 mx-auto"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-sm">
          {/* Login Title - Left Aligned */}
          <div className="mb-8">
            <h1 className="font-black text-gray-900 mb-3 text-left" style={{ fontSize: '2.5rem', lineHeight: '1' }}>Login</h1>
            <p className="text-gray-500 text-base text-left">Enter your credentials to access dashboard</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm text-center font-medium">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full py-4 pl-14 pr-4 bg-gray-100 border-0 rounded-xl text-base text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all relative z-0 text-center placeholder:text-center"
                placeholder="Username"
                required
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-4 pl-14 pr-14 bg-gray-100 border-0 rounded-xl text-base text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all relative z-0 text-center placeholder:text-center"
                placeholder="Password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Login Button - Mobile Optimized */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg touch-manipulation active:scale-95"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Terms of Service */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              By clicking Login, you agree to our{' '}
              <span className="text-blue-600 font-medium">Terms of Service</span>{' '}
              and{' '}
              <span className="text-blue-600 font-medium">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})

export default LoginPage
