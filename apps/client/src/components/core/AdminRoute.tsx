import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { isSuperAdmin } from '@utils/roles';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check for SUPER_ADMIN role instead of isAdmin boolean
  if (!user?.role || !isSuperAdmin(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}