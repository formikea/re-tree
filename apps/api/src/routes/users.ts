import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users, organisations } from '../db/schema.js'
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
import { emailService } from '../lib/email.js'
import { generateInvitationToken, getTokenExpiryDate } from '../lib/tokens.js'
import { hashPassword } from '../lib/password.js'

const routes = new Hono()

const userPublicColumns = {
  id: true,
  name: true,
  email: true,
  role: true,
  notes: true,
  createdAt: true,
  updatedAt: true
} as const

const userInviteReturning = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  emailVerified: users.emailVerified,
  notes: users.notes,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt
}

const userPublicReturning = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  notes: users.notes,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt
}

// Apply authentication to all routes
routes.use('*', authenticate)

// ===============================
// ORGANIZATION USER MANAGEMENT ROUTES
// ===============================

// Get all users for the current user's organization
routes.get('/', requireManageOwnOrganization, async (c) => {
  try {
    const user = c.get('user')
    
    const userList = await db.query.users.findMany({
      where: eq(users.organisationId, user.organisationId),
      columns: userPublicColumns,
      orderBy: users.name
    })

    return c.json({
      users: userList,
      count: userList.length,
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
routes.get('/:userId', requireManageOwnOrganization, async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(c.req.param('userId') ?? '', 10)
    
    if (isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid user ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    const targetUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, userId),
        eq(users.organisationId, user.organisationId)
      ),
      columns: userPublicColumns
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
routes.post('/', requireManageOwnUsers, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const validatedData = createOrganizationUserSchema.parse(body)

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email)
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
    const placeholderPassword = await hashPassword('placeholder')

    // Get organization name for email
    const organization = await db.query.organisations.findFirst({
      where: eq(organisations.id, user.organisationId),
      columns: { name: true }
    })

    const [newUser] = await db.insert(users).values({
      name: validatedData.name || null,
      email: validatedData.email,
      password: placeholderPassword,
      role: validatedData.role || 'USER',
      emailVerified: false,
      invitationToken,
      invitationExpires,
      notes: validatedData.notes || null,
      organisationId: user.organisationId
    }).returning()

    if (!newUser) {
      throw new Error('Failed to invite user')
    }

    await emailService.sendUserInvitation(
      validatedData.email,
      validatedData.name || null,
      invitationToken,
      organization?.name || 'Your Organization',
      user.name || user.email
    )

    return c.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        emailVerified: newUser.emailVerified,
        notes: newUser.notes,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
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
routes.put('/:userId', requireUserManagementInOrganization, async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(c.req.param('userId') ?? '', 10)
    
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
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, userId),
        eq(users.organisationId, user.organisationId)
      )
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
      const emailConflict = await db.query.users.findFirst({
        where: eq(users.email, validatedData.email)
      })

      if (emailConflict) {
        return c.json({
          error: 'Conflict',
          message: 'User with this email already exists',
          timestamp: new Date().toISOString()
        }, 409)
      }
    }

    const updateData: Partial<typeof users.$inferInsert> = { updatedAt: new Date() }
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.email !== undefined) updateData.email = validatedData.email
    if (validatedData.role !== undefined) updateData.role = validatedData.role
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.password) {
      updateData.password = await hashPassword(validatedData.password)
    }

    const [updatedUser] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning(userPublicReturning)

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
routes.delete('/:userId', requireUserManagementInOrganization, async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(c.req.param('userId') ?? '', 10)
    
    if (isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid user ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Check if user exists in this organization
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, userId),
        eq(users.organisationId, user.organisationId)
      )
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

    await db.delete(users).where(eq(users.id, userId))

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
routes.patch('/:userId/role', requireUserManagementInOrganization, async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(c.req.param('userId') ?? '', 10)
    
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
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, userId),
        eq(users.organisationId, user.organisationId)
      )
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

    const [updatedUser] = await db.update(users).set({
      role,
      updatedAt: new Date()
    }).where(eq(users.id, userId)).returning(userPublicReturning)

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
routes.post('/:userId/resend-invitation', requireUserManagementInOrganization, async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(c.req.param('userId') ?? '', 10)
    
    if (isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid user ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Find the target user
    const targetUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, userId),
        eq(users.organisationId, user.organisationId),
        eq(users.emailVerified, false)
      )
    })

    if (!targetUser) {
      return c.json({
        error: 'Not found',
        message: 'User not found or already verified',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Get organization name
    const organization = await db.query.organisations.findFirst({
      where: eq(organisations.id, user.organisationId),
      columns: { name: true }
    })

    const newInvitationToken = generateInvitationToken()
    const newInvitationExpires = getTokenExpiryDate(7)

    await db.update(users).set({
      invitationToken: newInvitationToken,
      invitationExpires: newInvitationExpires,
      updatedAt: new Date()
    }).where(eq(users.id, userId))

    await emailService.sendUserInvitation(
      targetUser.email,
      targetUser.name,
      newInvitationToken,
      organization?.name || 'Your Organization',
      user.name || user.email
    )

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

export default routes
