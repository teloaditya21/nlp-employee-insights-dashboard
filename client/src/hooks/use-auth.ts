/**
 * @fileoverview Enhanced authentication hook
 * @description Improved authentication hook with better error handling and type safety
 */

import { useState, useEffect, useCallback, useReducer } from "react";
import { useLocation } from "wouter";
import {
  User,
  AuthState,
  AuthAction,
  LoginCredentials,
  UseAuthReturn,
  Permission,
  AuthError,
  AuthErrorCode
} from '@/types';
import { AUTH_STORAGE_KEYS, AUTH_CONSTANTS, API_CONFIG } from '@/utils/constants';
import { useErrorHandler } from './useErrorHandler';
import { useToast } from './use-toast';

// Auth reducer for better state management
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        sessionToken: action.payload.sessionToken,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        sessionToken: null,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        sessionToken: null,
        error: null,
      };
    case 'AUTH_RESET_ERROR':
      return { ...state, error: null };
    case 'SESSION_VALIDATE_START':
      return { ...state, loading: true };
    case 'SESSION_VALIDATE_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload,
      };
    case 'SESSION_VALIDATE_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        sessionToken: null,
      };
    default:
      return state;
  }
}

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  sessionToken: null,
  error: null,
};

export function useAuth(): UseAuthReturn {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const errorHandler = useErrorHandler({ showToast: false });

  /**
   * Create auth error with proper typing
   */
  const createAuthError = useCallback((code: AuthErrorCode, message: string, details?: any): AuthError => ({
    code,
    message,
    details,
  }), []);

  /**
   * Update last activity timestamp
   */
  const updateLastActivity = useCallback(() => {
    localStorage.setItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  }, []);

  /**
   * Check if session is expired based on inactivity
   */
  const isSessionExpired = useCallback((): boolean => {
    const lastActivity = localStorage.getItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY);
    if (!lastActivity) return true;

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
    return timeSinceLastActivity > AUTH_CONSTANTS.INACTIVITY_TIMEOUT;
  }, []);

  /**
   * Validate session with the server
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);

    if (!token) {
      dispatch({ type: 'SESSION_VALIDATE_FAILURE' });
      return false;
    }

    // Check for inactivity timeout
    if (isSessionExpired()) {
      dispatch({ type: 'SESSION_VALIDATE_FAILURE' });
      localStorage.clear();
      return false;
    }

    dispatch({ type: 'SESSION_VALIDATE_START' });

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({ type: 'SESSION_VALIDATE_SUCCESS', payload: data.data.user });
          updateLastActivity();
          return true;
        }
      }

      // Session invalid
      dispatch({ type: 'SESSION_VALIDATE_FAILURE' });
      localStorage.clear();
      return false;
    } catch (error) {
      console.error("Session validation error:", error);
      dispatch({ type: 'SESSION_VALIDATE_FAILURE' });
      localStorage.clear();
      return false;
    }
  }, [isSessionExpired, updateLastActivity]);

  /**
   * Login with credentials
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { user, session_token } = data.data;

        // Store session data
        localStorage.setItem(AUTH_STORAGE_KEYS.SESSION_TOKEN, session_token);
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
        updateLastActivity();

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, sessionToken: session_token }
        });

        toast({
          title: 'Login Successful',
          description: `Welcome back, ${user.username}!`,
        });

        return true;
      } else {
        const errorCode: AuthErrorCode = response.status === 401
          ? 'INVALID_CREDENTIALS'
          : 'UNKNOWN_ERROR';

        const error = createAuthError(
          errorCode,
          data.error || 'Login failed',
          { status: response.status }
        );

        dispatch({ type: 'AUTH_FAILURE', payload: error.message });

        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
        });

        return false;
      }
    } catch (error) {
      const authError = createAuthError(
        'NETWORK_ERROR',
        'Network error occurred during login',
        { originalError: error }
      );

      dispatch({ type: 'AUTH_FAILURE', payload: authError.message });

      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: authError.message,
      });

      return false;
    }
  }, [createAuthError, updateLastActivity, toast]);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      const token = localStorage.getItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
      if (token) {
        // Call logout endpoint to clean up session on server
        await fetch(`${API_CONFIG.BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.clear();
      dispatch({ type: 'AUTH_LOGOUT' });
      setLocation("/login");

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    }
  }, [setLocation, toast]);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_RESET_ERROR' });
  }, []);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!state.user) return false;

    // Admin has all permissions
    if (state.user.role === 'admin') return true;

    // Add permission checking logic based on user role
    // This would typically come from a permissions mapping
    return false;
  }, [state.user]);

  /**
   * Auto-validate session and handle inactivity
   */
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const startSessionCheck = () => {
      intervalId = setInterval(async () => {
        if (state.sessionToken && state.isAuthenticated) {
          const isValid = await validateSession();
          if (!isValid) {
            setLocation("/login");
          }
        }
      }, 30000); // Check every 30 seconds
    };

    if (state.isAuthenticated && state.sessionToken) {
      startSessionCheck();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state.isAuthenticated, state.sessionToken, validateSession, setLocation]);

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      await validateSession();
    };

    initAuth();
  }, [validateSession]);

  /**
   * Update activity on user interaction
   */
  useEffect(() => {
    const handleUserActivity = () => {
      if (state.isAuthenticated) {
        updateLastActivity();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [state.isAuthenticated, updateLastActivity]);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    sessionToken: state.sessionToken,
    error: state.error,
    login,
    logout,
    validateSession,
    clearError,
    hasPermission,
    hasAnyPermission: (permissions: Permission[]) => permissions.some(hasPermission),
    hasAllPermissions: (permissions: Permission[]) => permissions.every(hasPermission),
  };
}
