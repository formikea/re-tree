import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { canManageUsers } from '@utils/roles';

interface ManagerRouteProps {
  children: React.ReactNode;
}

export function ManagerRoute({ children }: ManagerRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only MANAGER and SUPER_ADMIN users can access these routes
  if (!user?.role || !canManageUsers(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
