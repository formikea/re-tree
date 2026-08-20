import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma.js'
import {
  CreateBatchSchema,
  UpdateBatchSchema
} from '../schemas/batch.js'
import { authenticate } from '../middleware/auth.js'

const batches = new Hono()

// Apply authentication middleware to all batch routes
batches.use('*', authenticate)

// Get all batches for the authenticated user's organization
batches.get('/', async (c) => {
  try {
    const user = c.get('user')
    
    const batches = await prisma.batch.findMany({
      where: {
        nursery: {
          organisationId: user.organisationId
        }
      },
      include: {
        species: true,
        nursery: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return c.json({
      batches,
      count: batches.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching batches:', error)
    return c.json({ 
      error: 'Failed to fetch batches',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get batches by nursery ID (organization-scoped)
batches.get('/nursery/:nurseryId', async (c) => {
  try {
    const nurseryId = parseInt(c.req.param('nurseryId'))
    const user = c.get('user')
    
    // Verify that the nursery belongs to the user's organization
    const nursery = await prisma.nursery.findFirst({
      where: {
        id: nurseryId,
        organisationId: user.organisationId
      }
    })

    if (!nursery) {
      return c.json({ 
        error: 'Nursery not found',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    const batches = await prisma.batch.findMany({
      where: {
        nurseryId,
        nursery: {
          organisationId: user.organisationId
        }
      },
      include: {
        species: true,
        nursery: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return c.json({
      batches,
      count: batches.length,
      nursery: {
        id: nursery.id,
        name: nursery.name
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching batches by nursery:', error)
    return c.json({ 
      error: 'Failed to fetch batches by nursery',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get batch by ID (organization-scoped)
batches.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const user = c.get('user')
    
    const batch = await prisma.batch.findFirst({
      where: { 
        id,
        nursery: {
          organisationId: user.organisationId
        }
      },
      include: {
        species: true,
        nursery: true
      }
    })

    if (!batch) {
      return c.json({ 
        error: 'Batch not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    return c.json({
      batch,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching batch:', error)
    return c.json({ 
      error: 'Failed to fetch batch',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Create new batch
batches.post('/', zValidator('json', CreateBatchSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    // Verify that the nursery belongs to the user's organization
    const nursery = await prisma.nursery.findFirst({
      where: {
        id: body.nurseryId,
        organisationId: user.organisationId
      }
    })
    
    if (!nursery) {
      return c.json({ 
        error: 'Nursery not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    const batch = await prisma.batch.create({
      data: {
        speciesId: body.speciesId,
        nurseryId: body.nurseryId,
        origin: body.origin || null,
        quantity: body.quantity || null,
        stage: body.stage || null,
        isOrder: body.isOrder || false,
        notes: body.notes || null
      },
      include: {
        species: true,
        nursery: true
      }
    })

    return c.json({
      batch,
      message: 'Batch created successfully',
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    console.error('Error creating batch:', error)
    return c.json({ 
      error: 'Failed to create batch',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Update batch
batches.put('/:id', zValidator('json', UpdateBatchSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = c.req.valid('json')
    const user = c.get('user')

    // Check if batch exists and belongs to user's organization
    const existingBatch = await prisma.batch.findFirst({
      where: { 
        id,
        nursery: {
          organisationId: user.organisationId
        }
      }
    })

    if (!existingBatch) {
      return c.json({ 
        error: 'Batch not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // If updating nursery, verify it belongs to the organization
    if (body.nurseryId) {
      const nursery = await prisma.nursery.findFirst({
        where: {
          id: body.nurseryId,
          organisationId: user.organisationId
        }
      })
      
      if (!nursery) {
        return c.json({ 
          error: 'Nursery not found or does not belong to your organization',
          timestamp: new Date().toISOString()
        }, 404)
      }
    }

    const updateData: any = {}
    
    if (body.speciesId !== undefined) updateData.speciesId = body.speciesId
    if (body.nurseryId !== undefined) updateData.nurseryId = body.nurseryId
    if (body.origin !== undefined) updateData.origin = body.origin || null
    if (body.quantity !== undefined) updateData.quantity = body.quantity || null
    if (body.stage !== undefined) updateData.stage = body.stage || null
    if (body.isOrder !== undefined) updateData.isOrder = body.isOrder
    if (body.completedAt !== undefined) updateData.completedAt = body.completedAt || null
    if (body.notes !== undefined) updateData.notes = body.notes || null

    const batch = await prisma.batch.update({
      where: { id },
      data: updateData,
      include: {
        species: true,
        nursery: true
      }
    })

    return c.json({
      batch,
      message: 'Batch updated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating batch:', error)
    return c.json({ 
      error: 'Failed to update batch',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Delete batch
batches.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const user = c.get('user')

    // Check if batch exists and belongs to user's organization
    const existingBatch = await prisma.batch.findFirst({
      where: { 
        id,
        nursery: {
          organisationId: user.organisationId
        }
      }
    })

    if (!existingBatch) {
      return c.json({ 
        error: 'Batch not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Check if batch is being used in any allotments
    const allotmentsUsingBatch = await prisma.allotment.findMany({
      where: { batchId: id },
      include: {
        season: {
          include: {
            site: true
          }
        }
      }
    })

    if (allotmentsUsingBatch.length > 0) {
      return c.json({ 
        error: 'Cannot delete batch as it is being used in allotments',
        details: {
          allotmentCount: allotmentsUsingBatch.length,
          allotments: allotmentsUsingBatch.map((allotment: any) => ({
            id: allotment.id,
            quantity: allotment.quantity,
            season: {
              id: allotment.season.id,
              year: allotment.season.year,
              season: allotment.season.season,
              site: {
                id: allotment.season.site.id,
                name: allotment.season.site.name
              }
            }
          }))
        },
        timestamp: new Date().toISOString()
      }, 409)
    }

    await prisma.batch.delete({
      where: { id }
    })

    return c.json({
      message: 'Batch deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting batch:', error)
    return c.json({ 
      error: 'Failed to delete batch',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default batches 