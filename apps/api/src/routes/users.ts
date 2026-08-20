import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { 
  requireUserManagementInOrganization,
  requireManageOwnOrganization,
  requireManageOwnUsers
} from '../middleware/roles.js'
import { 
  createOrganizationUserSchema,
  updateOrganizationUserSchema 
} from '../schemas/organization.js'
import bcrypt from 'bcryptjs'
import { emailService } from '../lib/email.js'
import { generateInvitationToken, getTokenExpiryDate } from '../lib/tokens.js'

const users = new Hono()

// Apply authentication to all routes
users.use('*', authenticate)



// ===============================
// ORGANIZATION USER MANAGEMENT ROUTES
// ===============================

// Get all users for the current user's organization
users.get('/', requireManageOwnOrganization, async (c) => {
  try {
    const user = c.get('user')
    
    const users = await prisma.user.findMany({
      where: {
        organisationId: user.organisationId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return c.json({
      users,
      count: users.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching organization users:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to fetch organization users',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get user by ID within the current user's organization
users.get('/:userId', requireManageOwnOrganization, async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(c.req.param('userId'))
    
    if (isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid user ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organisationId: user.organisationId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!targetUser) {
      return c.json({
        error: 'Not found',
        message: 'User not found in this organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    return c.json({
      user: targetUser,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching organization user:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to fetch organization user',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Create user in the current user's organization
users.post('/', requireManageOwnUsers, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const validatedData = createOrganizationUserSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return c.json({
        error: 'Conflict',
        message: 'User with this email already exists',
        timestamp: new Date().toISOString()
      }, 409)
    }

    // Generate invitation token and expiry
    const invitationToken = generateInvitationToken()
    const invitationExpires = getTokenExpiryDate(7) // 7 days

    // Create placeholder password (will be changed when user accepts invitation)
    const placeholderPassword = await bcrypt.hash('placeholder', 10)

    // Get organization name for email
    const organization = await prisma.organisation.findUnique({
      where: { id: user.organisationId },
      select: { name: true }
    })

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Create user with unverified state
      const newUser = await tx.user.create({
        data: {
          name: validatedData.name || null,
          email: validatedData.email,
          password: placeholderPassword,
          role: validatedData.role || 'USER',
          emailVerified: false,
          invitationToken,
          invitationExpires,
          notes: validatedData.notes || null,
          organisationId: user.organisationId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          notes: true,
          createdAt: true,
          updatedAt: true
        }
      })

      // Send invitation email - if this fails, the entire transaction will rollback
      await emailService.sendUserInvitation(
        validatedData.email,
        validatedData.name || null,
        invitationToken,
        organization?.name || 'Your Organization',
        user.name || user.email
      )

      return newUser
    })

    return c.json({
      user: result,
      message: 'User invited successfully. An invitation email has been sent.',
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    console.error('Error creating organization user:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return c.json({
        error: 'Validation error',
        message: 'Invalid data provided',
        details: error,
        timestamp: new Date().toISOString()
      }, 400)
    }

    return c.json({
      error: 'Internal server error',
      message: 'Failed to create organization user',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Update user in the current user's organization
users.put('/:userId', requireUserManagementInOrganization, async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(c.req.param('userId'))
    
    if (isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid user ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    const body = await c.req.json()
    const validatedData = updateOrganizationUserSchema.parse(body)

    // Check if user exists in this organization
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        organisationId: user.organisationId 
      }
    })

    if (!existingUser) {
      return c.json({
        error: 'Not found',
        message: 'User not found in this organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // If email is being updated, check for conflicts
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })

      if (emailConflict) {
        return c.json({
          error: 'Conflict',
          message: 'User with this email already exists',
          timestamp: new Date().toISOString()
        }, 409)
      }
    }

    // Prepare update data
    const updateData: any = { ...validatedData }
    
    // Hash password if provided
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return c.json({
      user: updatedUser,
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return c.json({
        error: 'Validation error',
        message: 'Invalid data provided',
        details: error,
        timestamp: new Date().toISOString()
      }, 400)
    }

    console.error('Error updating organization user:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to update organization user',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Delete user from the current user's organization
users.delete('/:userId', requireUserManagementInOrganization, async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(c.req.param('userId'))
    
    if (isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid user ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Check if user exists in this organization
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        organisationId: user.organisationId 
      }
    })

    if (!existingUser) {
      return c.json({
        error: 'Not found',
        message: 'User not found in this organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Prevent deleting the requesting user
    if (userId === user.id) {
      return c.json({
        error: 'Bad request',
        message: 'Cannot delete your own account',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    })

    return c.json({
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting organization user:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to delete organization user',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Update user role in the current user's organization
users.patch('/:userId/role', requireUserManagementInOrganization, async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(c.req.param('userId'))
    
    if (isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid user ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    const body = await c.req.json()
    const { role } = body

    if (!role || !['USER', 'MANAGER', 'SUPER_ADMIN'].includes(role)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid role. Must be one of: USER, MANAGER, SUPER_ADMIN',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Check if user exists in this organization
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        organisationId: user.organisationId 
      }
    })

    if (!existingUser) {
      return c.json({
        error: 'Not found',
        message: 'User not found in this organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Prevent changing your own role
    if (userId === user.id) {
      return c.json({
        error: 'Bad request',
        message: 'Cannot change your own role',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Only super admins can assign super admin role
    if (role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return c.json({
        error: 'Forbidden',
        message: 'Only super admins can assign super admin role',
        timestamp: new Date().toISOString()
      }, 403)
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return c.json({
      user: updatedUser,
      message: 'User role updated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to update user role',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Resend invitation email
users.post('/:userId/resend-invitation', requireUserManagementInOrganization, async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(c.req.param('userId'))
    
    if (isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid user ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Find the target user
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organisationId: user.organisationId,
        emailVerified: false
      }
    })

    if (!targetUser) {
      return c.json({
        error: 'Not found',
        message: 'User not found or already verified',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Get organization name
    const organization = await prisma.organisation.findUnique({
      where: { id: user.organisationId },
      select: { name: true }
    })

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx: any) => {
      // Generate new invitation token and expiry
      const newInvitationToken = generateInvitationToken()
      const newInvitationExpires = getTokenExpiryDate(7)

      // Update user with new token
      await tx.user.update({
        where: { id: userId },
        data: {
          invitationToken: newInvitationToken,
          invitationExpires: newInvitationExpires
        }
      })

      // Send new invitation email - if this fails, the token update will rollback
      await emailService.sendUserInvitation(
        targetUser.email,
        targetUser.name,
        newInvitationToken,
        organization?.name || 'Your Organization',
        user.name || user.email
      )
    })

    return c.json({
      message: 'Invitation email resent successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error resending invitation:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to resend invitation',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default users
