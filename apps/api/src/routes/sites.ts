import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma.js'
import {
  CreateSiteSchema,
  UpdateSiteSchema
} from '../schemas/site.js'
import { authenticate } from '../middleware/auth.js'
import { requireReadOwnOrg, requireManageOwnOrganization } from '../middleware/roles.js'

const sites = new Hono()

// Apply authentication middleware to all site routes
sites.use('*', authenticate)

// Get all sites for the authenticated user's organization
sites.get('/', requireReadOwnOrg, async (c) => {
  try {
    const user = c.get('user')
    
    const sites = await prisma.site.findMany({
      where: {
        organisationId: user.organisationId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return c.json({
      sites,
      count: sites.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching sites:', error)
    return c.json({ 
      error: 'Failed to fetch sites',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get site by ID (organization-scoped)
sites.get('/:id', requireReadOwnOrg, async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const user = c.get('user')
    
    const site = await prisma.site.findFirst({
      where: { 
        id,
        organisationId: user.organisationId
      }
    })

    if (!site) {
      return c.json({ 
        error: 'Site not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    return c.json({
      site,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching site:', error)
    return c.json({ 
      error: 'Failed to fetch site',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Create new site
sites.post('/', requireManageOwnOrganization, zValidator('json', CreateSiteSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    const site = await prisma.site.create({
      data: {
        name: body.name,
        type: body.type ?? null,
        notes: body.notes ?? null,
        region: body.region ?? null,
        coordinates: body.coordinates ?? null,
        area: body.area ?? null,
        owner: body.owner ?? null,
        organisationId: user.organisationId
      }
    })

    return c.json({
      site,
      message: 'Site created successfully',
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    console.error('Error creating site:', error)
    return c.json({ 
      error: 'Failed to create site',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Update site
sites.put('/:id', requireManageOwnOrganization, zValidator('json', UpdateSiteSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = c.req.valid('json')
    const user = c.get('user')

    // Check if site exists and belongs to user's organization
    const existingSite = await prisma.site.findFirst({
      where: { 
        id,
        organisationId: user.organisationId
      }
    })

    if (!existingSite) {
      return c.json({ 
        error: 'Site not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.region !== undefined) updateData.region = body.region
    if (body.coordinates !== undefined) updateData.coordinates = body.coordinates
    if (body.area !== undefined) updateData.area = body.area
    if (body.owner !== undefined) updateData.owner = body.owner

    const site = await prisma.site.update({
      where: { id },
      data: updateData
    })

    return c.json({
      site,
      message: 'Site updated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating site:', error)
    return c.json({ 
      error: 'Failed to update site',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Delete site
sites.delete('/:id', requireManageOwnOrganization, async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const user = c.get('user')

    // Check if site exists and belongs to user's organization
    const existingSite = await prisma.site.findFirst({
      where: { 
        id,
        organisationId: user.organisationId
      }
    })

    if (!existingSite) {
      return c.json({ 
        error: 'Site not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    await prisma.site.delete({
      where: { id }
    })

    return c.json({
      message: 'Site deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting site:', error)
    return c.json({ 
      error: 'Failed to delete site',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default sites 