/**
 * @fileoverview Authentication service
 * @description Service class for authentication-related API operations
 */

import { 
  ApiResponse, 
  LoginCredentials, 
  LoginResponse, 
  LogoutResponse, 
  SessionValidationResponse,
  User 
} from '@/types';
import { apiClient } from './apiClient';
import { AUTH_STORAGE_KEYS } from '@/utils/constants';

/**
 * Authentication service class
 */
export class AuthService {
  private readonly basePath = '/api/auth';

  /**
   * Login with credentials
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse['data']>(
      `${this.basePath}/login`, 
      credentials
    );

    // Store session data if login successful
    if (response.success && response.data) {
      this.storeSessionData(response.data);
      apiClient.setAuthToken(response.data.session_token);
    }

    return response as LoginResponse;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<LogoutResponse> {
    try {
      const response = await apiClient.post<LogoutResponse>(`${this.basePath}/logout`);
      this.clearSessionData();
      return response;
    } catch (error) {
      // Clear session data even if logout request fails
      this.clearSessionData();
      throw error;
    }
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<SessionValidationResponse> {
    const token = this.getStoredToken();
    
    if (!token) {
      throw new Error('No session token found');
    }

    const response = await apiClient.get<SessionValidationResponse['data']>(
      `${this.basePath}/validate`
    );

    return response as SessionValidationResponse;
  }

  /**
   * Refresh session token
   */
  async refreshToken(): Promise<ApiResponse<{
    session_token: string;
    expires_at: string;
  }>> {
    const response = await apiClient.post(`${this.basePath}/refresh`);
    
    if (response.success && response.data) {
      // Update stored token
      localStorage.setItem(AUTH_STORAGE_KEYS.SESSION_TOKEN, response.data.session_token);
      apiClient.setAuthToken(response.data.session_token);
    }

    return response;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`${this.basePath}/me`);
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`${this.basePath}/me`, updates);
  }

  /**
   * Change password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.basePath}/change-password`, data);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.basePath}/forgot-password`, { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.basePath}/reset-password`, data);
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>(`${this.basePath}/permissions`);
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(permission: string): Promise<ApiResponse<{ hasPermission: boolean }>> {
    return apiClient.get(`${this.basePath}/permissions/${permission}`);
  }

  /**
   * Get user sessions
   */
  async getUserSessions(): Promise<ApiResponse<Array<{
    id: string;
    device: string;
    location: string;
    lastActivity: string;
    current: boolean;
  }>>> {
    return apiClient.get(`${this.basePath}/sessions`);
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`${this.basePath}/sessions/${sessionId}`);
  }

  /**
   * Revoke all other sessions
   */
  async revokeAllOtherSessions(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.basePath}/sessions/revoke-others`);
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(): Promise<ApiResponse<{
    qrCode: string;
    backupCodes: string[];
  }>> {
    return apiClient.post(`${this.basePath}/2fa/enable`);
  }

  /**
   * Verify two-factor authentication setup
   */
  async verifyTwoFactor(code: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.basePath}/2fa/verify`, { code });
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(password: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`${this.basePath}/2fa/disable`, { password });
  }

  /**
   * Store session data in localStorage
   */
  private storeSessionData(sessionData: {
    user: User;
    session_token: string;
    expires_at: string;
  }): void {
    localStorage.setItem(AUTH_STORAGE_KEYS.SESSION_TOKEN, sessionData.session_token);
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(sessionData.user));
    localStorage.setItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  }

  /**
   * Clear session data from localStorage
   */
  private clearSessionData(): void {
    localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY);
    apiClient.removeAuthToken();
  }

  /**
   * Get stored session token
   */
  private getStoredToken(): string | null {
    return localStorage.getItem(AUTH_STORAGE_KEYS.SESSION_TOKEN);
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  /**
   * Get last activity timestamp
   */
  getLastActivity(): number | null {
    const lastActivity = localStorage.getItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY);
    return lastActivity ? parseInt(lastActivity, 10) : null;
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity(): void {
    localStorage.setItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  }

  /**
   * Initialize auth service (set token if available)
   */
  initialize(): void {
    const token = this.getStoredToken();
    if (token) {
      apiClient.setAuthToken(token);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Initialize on import
authService.initialize();

export default authService;
