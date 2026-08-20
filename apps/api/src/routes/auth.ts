import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '#prisma'
import { loginSchema, loginResponseSchema, refreshTokenSchema, resetPasswordSchema } from '../schemas/auth.js'

const auth = new Hono()

// JWT secret - in production, this should be in environment variables
const jwtSecret = () => process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const refreshTokenSecret = () => process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key-change-in-production'

// Helper function to generate tokens
const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      organisationId: user.organisationId,
      role: user.role
    },
    jwtSecret(),
    { expiresIn: '1h' } // Shorter access token lifetime
  )

  const tokenVersion = user.tokenVersion || 0;
  console.log(`Generating tokens for user ${user.email} with token version: ${tokenVersion}`);

  const refreshToken = jwt.sign(
    { 
      userId: user.id,
      tokenVersion: tokenVersion // For token invalidation
    },
    refreshTokenSecret(),
    { expiresIn: '7d' } // Longer refresh token lifetime
  )

  return { accessToken, refreshToken }
}

// Login endpoint
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')

    // Find user by email with organization
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organisation: true
      }
    })

    if (!user) {
      return c.json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      }, 401)
    }

    // Check if user email is verified
    if (!user.emailVerified) {
      return c.json({
        error: 'Email not verified',
        message: 'Please verify your email address before logging in. Check your email for an invitation link.',
        timestamp: new Date().toISOString()
      }, 401)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return c.json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      }, 401)
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user)

    // Return success response
    const response = {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organisationId: user.organisationId,
        role: user.role,
        organisationName: user.organisation.name,
        createdAt: user.createdAt.toISOString()
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    }

    return c.json(response, 200)
  } catch (error) {
    console.error('Login error:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Something went wrong during login',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Refresh token endpoint
auth.post('/refresh', zValidator('json', refreshTokenSchema), async (c) => {
  try {
    const { refreshToken } = c.req.valid('json')

    // Verify refresh token
    let decoded: any
    try {
      decoded = jwt.verify(refreshToken, refreshTokenSecret()) as any
    } catch (jwtError) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid refresh token',
        timestamp: new Date().toISOString()
      }, 401)
    }

    // Get user with current token version
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organisation: true
      }
    })

    if (!user) {
      return c.json({
        error: 'Unauthorized',
        message: 'User not found',
        timestamp: new Date().toISOString()
      }, 401)
    }

    // Check if token version matches (for invalidation)
    const tokenVersionInToken = decoded.tokenVersion;
    const tokenVersionInDb = user.tokenVersion || 0;
    
    console.log(`Token refresh attempt - User: ${user.email}, Token version in token: ${tokenVersionInToken}, Token version in DB: ${tokenVersionInDb}`);
    
    if (tokenVersionInToken !== tokenVersionInDb) {
      console.log(`Token version mismatch for user ${user.email} - token: ${tokenVersionInToken}, db: ${tokenVersionInDb}`);
      return c.json({
        error: 'Unauthorized',
        message: 'Refresh token has been invalidated',
        timestamp: new Date().toISOString()
      }, 401)
    }

    // Update user's token version first
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: (user.tokenVersion || 0) + 1 }
    })

    // Generate new tokens with updated token version
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(updatedUser)

    return c.json({
      token: accessToken,
      refreshToken: newRefreshToken,
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    }, 200)
  } catch (error) {
    console.error('Token refresh error:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Something went wrong during token refresh',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Logout endpoint (invalidate refresh token)
auth.post('/logout', async (c) => {
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

    try {
      const decoded = jwt.verify(token, jwtSecret()) as any
      
      // Invalidate refresh token by incrementing token version
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { tokenVersion: (decoded.tokenVersion || 0) + 1 }
      })

      return c.json({
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      }, 200)
    } catch (jwtError) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid token',
        timestamp: new Date().toISOString()
      }, 401)
    }
  } catch (error) {
    console.error('Logout error:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Something went wrong during logout',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Verify token endpoint (for testing)
auth.get('/verify', async (c) => {
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

    try {
      const decoded = jwt.verify(token, jwtSecret()) as any
      
      // Get user details with organization
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          organisationId: true,
          role: true,
          organisation: {
            select: {
              id: true,
              name: true
            }
          },
          createdAt: true
        }
      })

      if (!user) {
        return c.json({
          error: 'Unauthorized',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }, 401)
      }

      return c.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organisationId: user.organisationId,
          role: user.role,
          organisationName: user.organisation.name,
          createdAt: user.createdAt.toISOString()
        },
        message: 'Token is valid',
        timestamp: new Date().toISOString()
      }, 200)
    } catch (jwtError) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      }, 401)
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Something went wrong during token verification',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Reset password endpoint
auth.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
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

    let decoded: any
    try {
      decoded = jwt.verify(token, jwtSecret()) as any
    } catch (jwtError) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid token',
        timestamp: new Date().toISOString()
      }, 401)
    }

    const { currentPassword, newPassword } = c.req.valid('json')

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return c.json({
        error: 'User not found',
        message: 'User not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password)

    if (!isValidCurrentPassword) {
      return c.json({
        error: 'Invalid password',
        message: 'Current password is incorrect',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password and increment token version to invalidate existing tokens
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedNewPassword,
        tokenVersion: (user.tokenVersion || 0) + 1
      }
    })

    return c.json({
      message: 'Password updated successfully',
      timestamp: new Date().toISOString()
    }, 200)
  } catch (error) {
    console.error('Reset password error:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Something went wrong during password reset',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default auth 