import { User, UserRole } from '../types/auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordCredentials {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  message: string;
  timestamp: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  message: string;
  timestamp: string;
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

class AuthService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'auth_refresh_token';
  private userKey = 'auth_user';
  private isRefreshing = false;
  private refreshPromise: Promise<RefreshTokenResponse> | null = null;

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('AuthService.login(): Attempting login for:', credentials.email);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AuthService.login(): Login failed:', errorData);
      throw new Error(errorData.message || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    console.log('AuthService.login(): Login successful, storing tokens and user data');
    
    // Store token, refresh token, and user data
    this.setToken(data.token);
    this.setRefreshToken(data.refreshToken);
    this.setUser({
      ...data.user,
      role: data.user.role as UserRole
    });
    
    return data;
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    console.log('AuthService.refreshToken(): Starting token refresh');
    
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      console.log('AuthService.refreshToken(): Already refreshing, returning existing promise');
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.error('AuthService.refreshToken(): No refresh token found');
      throw new Error('No refresh token found');
    }
    
    console.log('AuthService.refreshToken(): Refresh token found, proceeding with refresh');

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh(refreshToken);

    try {
      const result = await this.refreshPromise;
      this.setToken(result.token);
      this.setRefreshToken(result.refreshToken);
      return result;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh token is invalidated, clear all auth data and force re-login
      if (error instanceof Error && error.message.includes('invalidated')) {
        console.log('Refresh token invalidated, clearing auth data');
        this.handleRefreshTokenInvalidation();
        throw new Error('Session expired. Please log in again.');
      }
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performRefresh(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || 'Token refresh failed';
      
      // Handle refresh token invalidation specifically
      if (errorMessage.includes('invalidated')) {
        this.handleRefreshTokenInvalidation();
        throw new Error('Session expired. Please log in again.');
      }
      
      // For other errors, logout normally
      this.logout();
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    
    // Try to invalidate the refresh token on the server
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        // Ignore errors during logout
        console.warn('Logout request failed:', error);
      }
    }

    // Clear local storage
    this.clearStoredTokens();
  }

  // Add a method to clear stored tokens without server call
  private clearStoredTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Add a method to handle refresh token invalidation
  handleRefreshTokenInvalidation(): void {
    console.log('Refresh token invalidated, clearing stored tokens');
    this.clearStoredTokens();
    // Dispatch a global error event to trigger redirect to login
    window.dispatchEvent(new ErrorEvent('error', { 
      error: new Error('Session expired. Please log in again.') 
    }));
  }

  // Getter for isRefreshing state
  get isRefreshingState(): boolean {
    return this.isRefreshing;
  }

  async verifyToken(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Try to refresh the token
      try {
        await this.refreshToken();
        // Retry the verification with the new token
        return this.verifyToken();
      } catch (refreshError) {
        this.logout();
        throw new Error('Token verification failed');
      }
    }

    const data = await response.json();
    this.setUser(data.user);
    return data.user;
  }

  async resetPassword(credentials: ResetPasswordCredentials): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Password reset failed');
    }

    // Password changed successfully, tokens are invalidated
    // User will need to log in again
    this.logout();
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    console.log('AuthService.getToken():', token ? 'Token found' : 'No token');
    return token;
  }

  setToken(token: string): void {
    console.log('AuthService.setToken(): Storing token');
    localStorage.setItem(this.tokenKey, token);
  }

  getRefreshToken(): string | null {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    console.log('AuthService.getRefreshToken():', refreshToken ? 'Refresh token found' : 'No refresh token');
    return refreshToken;
  }

  setRefreshToken(refreshToken: string): void {
    console.log('AuthService.setRefreshToken(): Storing refresh token');
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('AuthService.getUser():', user ? 'User found' : 'No user');
    return user;
  }

  setUser(user: User): void {
    console.log('AuthService.setUser(): Storing user data');
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    const authenticated = !!this.getToken();
    console.log('AuthService.isAuthenticated():', authenticated);
    return authenticated;
  }

  // Check if token is expired (with 5 minute buffer)
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      return currentTime >= (expirationTime - bufferTime);
    } catch (error) {
      return true;
    }
  }
}

export const authService = new AuthService(); 