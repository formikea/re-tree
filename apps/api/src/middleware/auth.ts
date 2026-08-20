import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'

const jwtSecret = () => process.env.JWT_SECRET || 'your-secret-key-change-in-production'

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

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, jwtSecret()) as { userId: number }

      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
        columns: {
          id: true,
          email: true,
          name: true,
          organisationId: true,
          role: true,
          emailVerified: true,
        },
      })

      if (!user) {
        return c.json({
          error: 'Unauthorized',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }, 401)
      }

      if (!user.emailVerified) {
        return c.json({
          error: 'Unauthorized',
          message: 'Please verify your email address before logging in',
          timestamp: new Date().toISOString()
        }, 401)
      }

      c.set('user', user)
      return await next()
    } catch {
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
