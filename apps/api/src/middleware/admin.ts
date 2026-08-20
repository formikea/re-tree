import { Context, Next } from 'hono'
import { requireSuperAdmin } from './roles.js'

// Legacy admin middleware for backward compatibility
// Now redirects to requireSuperAdmin since ADMIN role has been removed
export const requireAdmin = requireSuperAdmin