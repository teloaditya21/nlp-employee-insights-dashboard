/**
 * @fileoverview Authentication-related TypeScript type definitions
 * @description Type definitions for user authentication, sessions, and authorization
 */

// User Types
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user' | 'viewer';
  created_at?: string;
  updated_at?: string;
}

// Session Types
export interface SessionData {
  user: User;
  session_token: string;
  expires_at: string;
  created_at: string;
}

export interface SessionValidationResponse {
  success: boolean;
  data: {
    user: User;
    session_valid: boolean;
    expires_at: string;
  };
  message: string;
}

// Authentication State
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionToken: string | null;
  error: string | null;
}

// Authentication Actions
export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; sessionToken: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_RESET_ERROR' }
  | { type: 'SESSION_VALIDATE_START' }
  | { type: 'SESSION_VALIDATE_SUCCESS'; payload: User }
  | { type: 'SESSION_VALIDATE_FAILURE' };

// Login/Logout Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: SessionData;
  message: string;
  error?: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// Permission Types
export type Permission = 
  | 'read:insights'
  | 'write:insights'
  | 'delete:insights'
  | 'read:analytics'
  | 'write:analytics'
  | 'admin:users'
  | 'admin:settings';

export interface UserPermissions {
  userId: number;
  permissions: Permission[];
}

// Role-based Access Control
export interface RolePermissions {
  admin: Permission[];
  user: Permission[];
  viewer: Permission[];
}

// Authentication Hook Return Type
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionToken: string | null;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  clearError: () => void;
}

// Protected Route Props
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

// Authentication Context Type
export interface AuthContextType extends UseAuthReturn {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

// Token Types
export interface TokenPayload {
  userId: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    session_token: string;
    expires_at: string;
  };
  message: string;
}

// Authentication Error Types
export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'TOKEN_INVALID'
  | 'USER_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'ACCOUNT_LOCKED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, any>;
}

// Session Storage Keys
export const AUTH_STORAGE_KEYS = {
  SESSION_TOKEN: 'session_token',
  USER: 'user',
  REMEMBER_ME: 'remember_me',
  LAST_ACTIVITY: 'last_activity',
} as const;

// Authentication Constants
export const AUTH_CONSTANTS = {
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour in milliseconds
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_LOGIN_ATTEMPTS: 3,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
} as const;
