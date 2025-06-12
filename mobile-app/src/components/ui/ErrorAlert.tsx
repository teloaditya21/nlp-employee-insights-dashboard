import React from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
  className?: string
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  message, 
  onDismiss, 
  className = '' 
}) => {
  return (
    <div className={`bg-red-50 border-2 border-red-200 rounded-2xl p-4 animate-shake ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
          <p className="text-red-600 text-sm font-semibold">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors ml-3 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorAlert
