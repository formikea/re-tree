import { User } from '../types/auth';
import { isAdmin, isManager, canManageUsers } from './roles';

/**
 * Check if the current user has access to a specific organization
 */
export function hasOrganizationAccess(user: User | null, organisationId: string): boolean {
  if (!user) return false;
  return user.organisationId === organisationId;
}

/**
 * Check if the current user has a specific role
 */
export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if the current user has admin privileges (SUPER_ADMIN)
 */
export function isAdminUser(user: User | null): boolean {
  if (!user) return false;
  return isAdmin(user.role);
}

/**
 * Check if the current user has manager privileges (MANAGER or SUPER_ADMIN)
 */
export function isCoordinator(user: User | null): boolean {
  if (!user) return false;
  return isManager(user.role);
}

/**
 * Check if the current user can manage users in their organization (MANAGER or SUPER_ADMIN)
 */
export function canManageOrganizationUsers(user: User | null): boolean {
  if (!user) return false;
  return canManageUsers(user.role);
}

/**
 * Get the current user's organization ID
 */
export function getCurrentOrganizationId(user: User | null): string | null {
  return user?.organisationId || null;
}

/**
 * Get the current user's organization name
 */
export function getCurrentOrganizationName(user: User | null): string | null {
  return user?.organisationName || null;
} 