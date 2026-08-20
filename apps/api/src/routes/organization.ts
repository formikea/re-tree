import { Hono } from 'hono'
import { prisma } from '#prisma'
import { authenticate } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import { emailService } from '../lib/email.js'

const organization = new Hono()

// Apply authentication to all routes
organization.use('*', authenticate)

// ===============================
// INVITATION ROUTES
// ===============================

// Verify invitation token
organization.get('/invite/verify/:token', async (c) => {
  try {
    const token = c.req.param('token')
    
    if (!token) {
      return c.json({
        error: 'Bad request',
        message: 'Invitation token is required',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Find user with this invitation token
    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        emailVerified: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        invitationExpires: true,
        organisation: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!user) {
      return c.json({
        error: 'Not found',
        message: 'Invalid or expired invitation token',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Check if token is expired
    if (user.invitationExpires && new Date() > user.invitationExpires) {
      return c.json({
        error: 'Expired',
        message: 'Invitation token has expired',
        timestamp: new Date().toISOString()
      }, 410)
    }

    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organisation: user.organisation
      },
      message: 'Invitation token is valid',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error verifying invitation token:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to verify invitation token',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Accept invitation and set password
organization.post('/invite/accept', async (c) => {
  try {
    const body = await c.req.json()
    const { token, password, name } = body

    if (!token || !password) {
      return c.json({
        error: 'Bad request',
        message: 'Token and password are required',
        timestamp: new Date().toISOString()
      }, 400)
    }

    if (password.length < 6) {
      return c.json({
        error: 'Bad request',
        message: 'Password must be at least 6 characters',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Find user with this invitation token
    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        emailVerified: false
      }
    })

    if (!user) {
      return c.json({
        error: 'Not found',
        message: 'Invalid or expired invitation token',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Check if token is expired
    if (user.invitationExpires && new Date() > user.invitationExpires) {
      return c.json({
        error: 'Expired',
        message: 'Invitation token has expired',
        timestamp: new Date().toISOString()
      }, 410)
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user: set password, mark as verified, clear invitation token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: true,
        invitationToken: null,
        invitationExpires: null,
        name: name || user.name
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        organisationId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return c.json({
      user: updatedUser,
      message: 'Invitation accepted successfully. You can now log in.',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to accept invitation',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default organization
