import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '#prisma'
import {
  CreateNurserySchema,
  UpdateNurserySchema
} from '../schemas/nursery.js'
import { authenticate } from '../middleware/auth.js'

const nurseries = new Hono()

// Apply authentication middleware to all nursery routes
nurseries.use('*', authenticate)

// Get all nurseries for the authenticated user's organization
nurseries.get('/', async (c) => {
  try {
    const user = c.get('user')
    
    const nurseries = await prisma.nursery.findMany({
      where: {
        organisationId: user.organisationId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return c.json({
      nurseries,
      count: nurseries.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching nurseries:', error)
    return c.json({ 
      error: 'Failed to fetch nurseries',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get nursery by ID (organization-scoped)
nurseries.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const user = c.get('user')
    
    const nursery = await prisma.nursery.findFirst({
      where: { 
        id,
        organisationId: user.organisationId
      }
    })

    if (!nursery) {
      return c.json({ 
        error: 'Nursery not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    return c.json({
      nursery,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching nursery:', error)
    return c.json({ 
      error: 'Failed to fetch nursery',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Create new nursery
nurseries.post('/', zValidator('json', CreateNurserySchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    const nursery = await prisma.nursery.create({
      data: {
        name: body.name,
        organisationId: user.organisationId
      }
    })

    return c.json({
      nursery,
      message: 'Nursery created successfully',
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    console.error('Error creating nursery:', error)
    return c.json({ 
      error: 'Failed to create nursery',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Update nursery
nurseries.put('/:id', zValidator('json', UpdateNurserySchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = c.req.valid('json')
    const user = c.get('user')
    
    // Check if nursery exists and belongs to user's organization
    const existingNursery = await prisma.nursery.findFirst({
      where: { 
        id,
        organisationId: user.organisationId
      }
    })

    if (!existingNursery) {
      return c.json({ 
        error: 'Nursery not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const updateData: any = {}
    if (body.name !== undefined) {
      updateData.name = body.name
    }

    const nursery = await prisma.nursery.update({
      where: { id },
      data: updateData
    })

    return c.json({
      nursery,
      message: 'Nursery updated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating nursery:', error)
    return c.json({ 
      error: 'Failed to update nursery',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Delete nursery
nurseries.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const user = c.get('user')
    
    // Check if nursery exists and belongs to user's organization
    const existingNursery = await prisma.nursery.findFirst({
      where: { 
        id,
        organisationId: user.organisationId
      }
    })

    if (!existingNursery) {
      return c.json({ 
        error: 'Nursery not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Check if nursery has any batches
    const batchesCount = await prisma.batch.count({
      where: { nurseryId: id }
    })

    if (batchesCount > 0) {
      return c.json({ 
        error: 'Cannot delete nursery with existing batches',
        timestamp: new Date().toISOString()
      }, 400)
    }

    await prisma.nursery.delete({
      where: { id }
    })

    return c.json({
      message: 'Nursery deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting nursery:', error)
    return c.json({ 
      error: 'Failed to delete nursery',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default nurseries 