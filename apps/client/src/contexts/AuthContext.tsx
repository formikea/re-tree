import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth data on app start
    const verifyAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = await authService.verifyToken();
          setUser(userData);
        }
      } catch (error) {
        console.warn('Token verification failed, clearing stored auth data:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = (token: string, userData: User) => {
    console.log('AuthContext.login(): Setting token and user data');
    authService.setToken(token);
    authService.setUser(userData);
    setUser(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const setUserData = (userData: User) => {
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    setUser: setUserData,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext }; 