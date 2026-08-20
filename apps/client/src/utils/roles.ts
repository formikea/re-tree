import { UserRole } from '../types/auth';

// Role hierarchy (higher numbers = higher privileges)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 1,
  MANAGER: 2,
  SUPER_ADMIN: 3,
};

/**
 * Check if a user has at least the minimum required role
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Check if a user is a super admin
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN';
}

/**
 * Check if a user is an admin (SUPER_ADMIN)
 */
export function isAdmin(role: UserRole): boolean {
  return hasMinimumRole(role, 'SUPER_ADMIN');
}

/**
 * Check if a user can manage users in their organization (MANAGER or SUPER_ADMIN)
 */
export function canManageUsers(role: UserRole): boolean {
  return hasMinimumRole(role, 'MANAGER');
}

/**
 * Check if a user is a manager (MANAGER or SUPER_ADMIN)
 */
export function isManager(role: UserRole): boolean {
  return hasMinimumRole(role, 'MANAGER');
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    USER: 'User',
    MANAGER: 'Manager',
    SUPER_ADMIN: 'Super Admin',
  };
  return displayNames[role];
}
