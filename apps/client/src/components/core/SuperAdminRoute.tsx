import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { isSuperAdmin } from '@utils/roles';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only SUPER_ADMIN users can access these routes
  if (!user?.role || !isSuperAdmin(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
