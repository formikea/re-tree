import { Hono } from 'hono'
import { prisma } from '#prisma'
import { authenticate } from '../middleware/auth.js'
import { 
  requireSuperAdmin,
  requireManageOrganizations,
  requireManageAllUsers,
  requireUserManagementInOrganization
} from '../middleware/roles.js'
import { 
  createOrganizationSchema, 
  updateOrganizationSchema,
  createOrganizationUserSchema,
  updateOrganizationUserSchema 
} from '../schemas/organization.js'
import bcrypt from 'bcryptjs'
import { generateInvitationToken, getTokenExpiryDate } from '../lib/tokens.js'

const admin = new Hono()

// Apply authentication to all routes
admin.use('*', authenticate)

// ===============================
// ORGANIZATION ROUTES
// ===============================

// Get all organizations
admin.get('/organizations', requireManageOrganizations, async (c) => {
  try {
    const organizations = await prisma.organisation.findMany({
      include: {
        _count: {
          select: {
            users: true,
            sites: true,
            nurseries: true,
            seasons: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return c.json({
      organizations,
      count: organizations.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to fetch organizations',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get organization by ID
admin.get('/organizations/:id', requireManageOrganizations, async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid organization ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    const organization = await prisma.organisation.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            notes: true,
            createdAt: true,
            updatedAt: true
          }
        },
        sites: {
          select: {
            id: true,
            name: true,
            region: true,
            area: true
          }
        },
        nurseries: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            users: true,
            sites: true,
            nurseries: true,
            seasons: true
          }
        }
      }
    })

    if (!organization) {
      return c.json({
        error: 'Not found',
        message: 'Organization not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    return c.json({
      organization,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to fetch organization',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Create organization
admin.post('/organizations', requireManageOrganizations, async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = createOrganizationSchema.parse(body)

    const organization = await prisma.organisation.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            users: true,
            sites: true,
            nurseries: true,
            seasons: true
          }
        }
      }
    })

    return c.json({
      organization,
      message: 'Organization created successfully',
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return c.json({
        error: 'Validation error',
        message: 'Invalid data provided',
        details: error,
        timestamp: new Date().toISOString()
      }, 400)
    }

    console.error('Error creating organization:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to create organization',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Update organization
admin.put('/organizations/:id', requireManageOrganizations, async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid organization ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    const body = await c.req.json()
    const validatedData = updateOrganizationSchema.parse(body)

    // Check if organization exists
    const existingOrganization = await prisma.organisation.findUnique({
      where: { id }
    })

    if (!existingOrganization) {
      return c.json({
        error: 'Not found',
        message: 'Organization not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Prepare update data - only include defined fields  
    const updateData: { name?: string } = {}
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }

    const organization = await prisma.organisation.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            sites: true,
            nurseries: true,
            seasons: true
          }
        }
      }
    })

    return c.json({
      organization,
      message: 'Organization updated successfully',
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

    console.error('Error updating organization:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to update organization',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Delete organization
admin.delete('/organizations/:id', requireManageOrganizations, async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid organization ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Check if organization exists
    const existingOrganization = await prisma.organisation.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            sites: true,
            nurseries: true,
            seasons: true
          }
        }
      }
    })

    if (!existingOrganization) {
      return c.json({
        error: 'Not found',
        message: 'Organization not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Check if organization has dependencies
    if (existingOrganization._count.users > 0 || 
        existingOrganization._count.sites > 0 || 
        existingOrganization._count.nurseries > 0 || 
        existingOrganization._count.seasons > 0) {
      return c.json({
        error: 'Conflict',
        message: 'Cannot delete organization with existing users, sites, nurseries, or seasons',
        timestamp: new Date().toISOString()
      }, 409)
    }

    await prisma.organisation.delete({
      where: { id }
    })

    return c.json({
      message: 'Organization deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to delete organization',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// ===============================
// ORGANIZATION USER ROUTES
// ===============================

// Get all users for an organization
admin.get('/organizations/:id/users', requireManageAllUsers, async (c) => {
  try {
    const organizationId = parseInt(c.req.param('id'))
    
    if (isNaN(organizationId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid organization ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Check if organization exists
    const organization = await prisma.organisation.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true }
    })

    if (!organization) {
      return c.json({
        error: 'Not found',
        message: 'Organization not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const users = await prisma.user.findMany({
      where: { organisationId: organizationId },
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
        email: 'asc'
      }
    })

    return c.json({
      users,
      organization,
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

// Get user by ID within organization
admin.get('/organizations/:orgId/users/:userId', requireManageAllUsers, async (c) => {
  try {
    const organizationId = parseInt(c.req.param('orgId'))
    const userId = parseInt(c.req.param('userId'))
    
    if (isNaN(organizationId) || isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid organization or user ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        organisationId: organizationId 
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
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
        message: 'User not found in this organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    return c.json({
      user,
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

// Create user in organization
admin.post('/organizations/:id/users', requireManageAllUsers, async (c) => {
  try {
    const organizationId = parseInt(c.req.param('id'))
    
    if (isNaN(organizationId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid organization ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Check if organization exists
    const organization = await prisma.organisation.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      return c.json({
        error: 'Not found',
        message: 'Organization not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const body = await c.req.json()
    const validatedData = createOrganizationUserSchema.parse(body)

    // Check if user with this email already exists
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

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: placeholderPassword,
        name: validatedData.name || null,
        notes: validatedData.notes || null,
        organisationId: organizationId,
        role: validatedData.role || 'USER',
        emailVerified: false,
        invitationToken,
        invitationExpires
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        organisation: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return c.json({
      user,
      message: 'User created successfully',
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return c.json({
        error: 'Validation error',
        message: 'Invalid data provided',
        details: error,
        timestamp: new Date().toISOString()
      }, 400)
    }

    console.error('Error creating organization user:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to create organization user',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Update user in organization
admin.put('/organizations/:orgId/users/:userId', requireManageAllUsers, async (c) => {
  try {
    const organizationId = parseInt(c.req.param('orgId'))
    const userId = parseInt(c.req.param('userId'))
    
    if (isNaN(organizationId) || isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid organization or user ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    const body = await c.req.json()
    const validatedData = updateOrganizationUserSchema.parse(body)

    // Check if user exists in this organization
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        organisationId: organizationId 
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

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        organisation: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return c.json({
      user,
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

// Delete user from organization
admin.delete('/organizations/:orgId/users/:userId', requireManageAllUsers, async (c) => {
  try {
    const organizationId = parseInt(c.req.param('orgId'))
    const userId = parseInt(c.req.param('userId'))
    
    if (isNaN(organizationId) || isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid organization or user ID',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Check if user exists in this organization
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        organisationId: organizationId 
      }
    })

    if (!existingUser) {
      return c.json({
        error: 'Not found',
        message: 'User not found in this organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Prevent deleting the requesting admin user
    const requestingUser = c.get('user')
    if (requestingUser.id === userId) {
      return c.json({
        error: 'Forbidden',
        message: 'Cannot delete your own user account',
        timestamp: new Date().toISOString()
      }, 403)
    }

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

// ===============================
// ROLE MANAGEMENT ROUTES
// ===============================

// Update user role
admin.patch('/organizations/:orgId/users/:userId/role', requireManageAllUsers, async (c) => {
  try {
    const organizationId = parseInt(c.req.param('orgId'))
    const userId = parseInt(c.req.param('userId'))
    
    if (isNaN(organizationId) || isNaN(userId)) {
      return c.json({
        error: 'Bad request',
        message: 'Invalid organization or user ID',
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
        organisationId: organizationId 
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
    const requestingUser = c.get('user')
    if (requestingUser.id === userId) {
      return c.json({
        error: 'Forbidden',
        message: 'Cannot change your own role',
        timestamp: new Date().toISOString()
      }, 403)
    }

    // Only super admins can assign super admin role
    if (role === 'SUPER_ADMIN' && requestingUser.role !== 'SUPER_ADMIN') {
      return c.json({
        error: 'Forbidden',
        message: 'Only super admins can assign super admin role',
        timestamp: new Date().toISOString()
      }, 403)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        organisation: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return c.json({
      user,
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

// Get available roles
admin.get('/roles', requireManageOrganizations, async (c) => {
  try {
    const roles = [
      { value: 'USER', label: 'User', description: 'Basic user with read access to own organization' },
              { value: 'MANAGER', label: 'Manager', description: 'Can manage users and write to own organization' },
        { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full system access and organization management' }
    ]

    return c.json({
      roles,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return c.json({
      error: 'Internal server error',
      message: 'Failed to fetch roles',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default admin