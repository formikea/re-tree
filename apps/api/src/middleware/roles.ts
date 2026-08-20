import { Context, Next } from 'hono'

// Define permission types
export type Permission = 
  | 'read:own_organization'
  | 'manage:own_organization'
  | 'manage:own_users'
  | 'manage:all_users'
  | 'manage:all_organizations'
  | 'manage:system'

// Define role hierarchy and permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  USER: [
    'read:own_organization',
  ],
  MANAGER: [
    'read:own_organization',
    'manage:own_organization',
    'manage:own_users',
  ],

  SUPER_ADMIN: [
    'read:own_organization',
    'manage:own_organization',
    'manage:own_users',
    'manage:all_users',
    'manage:all_organizations',
    'manage:system',
  ],
}

// Role hierarchy (higher roles inherit permissions from lower roles)
export const ROLE_HIERARCHY: Record<string, number> = {
  USER: 1,
  MANAGER: 2,
  SUPER_ADMIN: 3,
}

// Helper function to check if a role has a specific permission
export function hasPermission(userRole: string, requiredPermission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[userRole] || []
  return userPermissions.includes(requiredPermission)
}

// Helper function to check if a user has a minimum role level
export function hasMinimumRole(userRole: string, minimumRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const minimumLevel = ROLE_HIERARCHY[minimumRole] || 0
  return userLevel >= minimumLevel
}

// Helper function to check if user can access organization data
export function canAccessOrganization(userRole: string, userOrgId: number, targetOrgId: number): boolean {
  // Super admins can access all organizations
  if (hasMinimumRole(userRole, 'SUPER_ADMIN')) {
    return true
  }
  
  // Users and managers can only access their own organization
  return userOrgId === targetOrgId
}

// Helper function to check if user can manage users in a specific organization
export function canManageUsersInOrganization(userRole: string, userOrgId: number, targetOrgId: number): boolean {
  // Super admins can manage users in all organizations
  if (hasPermission(userRole, 'manage:all_users')) {
    return true
  }
  
  // Managers can manage users in their own organization
  if (hasPermission(userRole, 'manage:own_users') && userOrgId === targetOrgId) {
    return true
  }
  
  return false
}

// Middleware to require specific permission
export function requirePermission(permission: Permission) {
  return async (c: Context, next: Next) => {
    try {
      const user = c.get('user')
      
      if (!user) {
        return c.json({
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }, 401)
      }

      if (!hasPermission(user.role, permission)) {
        return c.json({
          error: 'Forbidden',
          message: `Insufficient permissions. Required: ${permission}`,
          timestamp: new Date().toISOString()
        }, 403)
      }

      return await next()
    } catch (error) {
      console.error('Permission middleware error:', error)
      return c.json({
        error: 'Internal server error',
        message: 'Something went wrong during authorization',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }
}

// Middleware to require minimum role
export function requireMinimumRole(minimumRole: string) {
  return async (c: Context, next: Next) => {
    try {
      const user = c.get('user')
      
      if (!user) {
        return c.json({
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }, 401)
      }

      if (!hasMinimumRole(user.role, minimumRole)) {
        return c.json({
          error: 'Forbidden',
          message: `Insufficient role level. Required: ${minimumRole}`,
          timestamp: new Date().toISOString()
        }, 403)
      }

      return await next()
    } catch (error) {
      console.error('Role middleware error:', error)
      return c.json({
        error: 'Internal server error',
        message: 'Something went wrong during authorization',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }
}

// Middleware to check organization access
export function requireOrganizationAccess() {
  return async (c: Context, next: Next) => {
    try {
      const user = c.get('user')
      
      if (!user) {
        return c.json({
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }, 401)
      }

      // Get organization ID from URL params
      const orgId = c.req.param('id') || c.req.param('organisationId')
      
      if (orgId) {
        const targetOrgId = parseInt(orgId)
        
        if (!canAccessOrganization(user.role, user.organisationId, targetOrgId)) {
          return c.json({
            error: 'Forbidden',
            message: 'Access to this organization is not allowed',
            timestamp: new Date().toISOString()
          }, 403)
        }
      }

      return await next()
    } catch (error) {
      console.error('Organization access middleware error:', error)
      return c.json({
        error: 'Internal server error',
        message: 'Something went wrong during authorization',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }
}

// Middleware to check user management permissions in organization
export function requireUserManagementInOrganization() {
  return async (c: Context, next: Next) => {
    try {
      console.log('=== USER MANAGEMENT MIDDLEWARE START ===')
      const user = c.get('user')
      console.log('User in middleware:', user ? { id: user.id, email: user.email, role: user.role, organisationId: user.organisationId } : null)
      
      if (!user) {
        console.log('No user found, returning 401')
        return c.json({
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }, 401)
      }

      // Check if user has permission to manage users in their own organization
      const canManage = canManageUsersInOrganization(user.role, user.organisationId, user.organisationId)
      console.log('Can manage users:', canManage)
      
      if (!canManage) {
        console.log('Insufficient permissions, returning 403')
        return c.json({
          error: 'Forbidden',
          message: 'Insufficient permissions to manage users in this organization',
          timestamp: new Date().toISOString()
        }, 403)
      }

      console.log('=== USER MANAGEMENT MIDDLEWARE END - PROCEEDING ===')
      return await next()
    } catch (error) {
      console.error('=== USER MANAGEMENT MIDDLEWARE ERROR ===')
      console.error('User management middleware error:', error)
      return c.json({
        error: 'Internal server error',
        message: 'Something went wrong during authorization',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }
}

// Convenience middleware functions for common role requirements
export const requireUser = requireMinimumRole('USER')
export const requireManager = requireMinimumRole('MANAGER')
export const requireSuperAdmin = requireMinimumRole('SUPER_ADMIN')

// Convenience middleware functions for common permissions
export const requireReadOwnOrg = requirePermission('read:own_organization')
export const requireManageOwnOrganization = requirePermission('manage:own_organization')
export const requireManageOwnUsers = requirePermission('manage:own_users')
export const requireManageAllUsers = requirePermission('manage:all_users')
export const requireManageOrganizations = requirePermission('manage:all_organizations')
export const requireManageSystem = requirePermission('manage:system')
