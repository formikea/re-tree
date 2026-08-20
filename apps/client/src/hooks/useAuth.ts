import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  const navigate = useNavigate();
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Global error handler for authentication errors
  useEffect(() => {
    const handleAuthError = (event: ErrorEvent) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('Session expired') || 
           event.error.message.includes('Authentication failed') ||
           event.error.message.includes('Please log in again'))) {
        console.log('Global auth error detected, redirecting to login');
        context.logout();
        navigate('/login');
      }
    };

    window.addEventListener('error', handleAuthError);
    
    return () => {
      window.removeEventListener('error', handleAuthError);
    };
  }, [context, navigate]);
  
  return context;
} 