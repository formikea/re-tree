import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

// JWT secret - should match the one in auth.ts
const jwtSecret = () => process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Extend the Context type to include user information
declare module 'hono' {
  interface ContextVariableMap {
    user: {
      id: number
      email: string
      name: string | null
      organisationId: number
      role: string
    }
  }
}

export const authenticate = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        error: 'Unauthorized',
        message: 'No token provided',
        timestamp: new Date().toISOString()
      }, 401)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    console.log(token)

    try {
      const decoded = jwt.verify(token, jwtSecret()) as any
      
      // Get user details from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          organisationId: true,
          role: true,
          emailVerified: true
        }
      })

      if (!user) {
        return c.json({
          error: 'Unauthorized',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }, 401)
      }

      // Check if user email is verified
      if (!user.emailVerified) {
        return c.json({
          error: 'Unauthorized',
          message: 'Please verify your email address before logging in',
          timestamp: new Date().toISOString()
        }, 401)
      }

      // Set user in context for use in route handlers
      c.set('user', user)
      
      return await next()
    } catch (jwtError) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      }, 401)
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Something went wrong during authentication',
      timestamp: new Date().toISOString()
    }, 500)
  }
} 