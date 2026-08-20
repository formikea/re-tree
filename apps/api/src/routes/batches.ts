import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { batches, nurseries, allotments } from '../db/schema.js'
import {
  CreateBatchSchema,
  UpdateBatchSchema
} from '../schemas/batch.js'
import { authenticate } from '../middleware/auth.js'

const routes = new Hono()

// Apply authentication middleware to all batch routes
routes.use('*', authenticate)

async function orgNurseryIds(organisationId: number) {
  const orgNurseries = await db.select({ id: nurseries.id }).from(nurseries).where(eq(nurseries.organisationId, organisationId))
  return orgNurseries.map(n => n.id)
}

// Get all batches for the authenticated user's organization
routes.get('/', async (c) => {
  try {
    const user = c.get('user')
    const ids = await orgNurseryIds(user.organisationId)
    
    const batchList = await db.query.batches.findMany({
      where: inArray(batches.nurseryId, ids.length ? ids : [-1]),
      with: {
        species: true,
        nursery: true
      },
      orderBy: desc(batches.createdAt)
    })

    return c.json({
      batches: batchList,
      count: batchList.length,
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
routes.get('/nursery/:nurseryId', async (c) => {
  try {
    const nurseryId = parseInt(c.req.param('nurseryId') ?? '', 10)
    const user = c.get('user')
    
    // Verify that the nursery belongs to the user's organization
    const nursery = await db.query.nurseries.findFirst({
      where: and(
        eq(nurseries.id, nurseryId),
        eq(nurseries.organisationId, user.organisationId)
      )
    })

    if (!nursery) {
      return c.json({ 
        error: 'Nursery not found',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    const batchList = await db.query.batches.findMany({
      where: eq(batches.nurseryId, nurseryId),
      with: {
        species: true,
        nursery: true
      },
      orderBy: desc(batches.createdAt)
    })

    return c.json({
      batches: batchList,
      count: batchList.length,
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
routes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const user = c.get('user')
    
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, id),
      with: {
        species: true,
        nursery: true
      }
    })

    if (!batch || batch.nursery.organisationId !== user.organisationId) {
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
routes.post('/', zValidator('json', CreateBatchSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    // Verify that the nursery belongs to the user's organization
    const nursery = await db.query.nurseries.findFirst({
      where: and(
        eq(nurseries.id, body.nurseryId),
        eq(nurseries.organisationId, user.organisationId)
      )
    })
    
    if (!nursery) {
      return c.json({ 
        error: 'Nursery not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    const [inserted] = await db.insert(batches).values({
      speciesId: body.speciesId,
      nurseryId: body.nurseryId,
      origin: body.origin || null,
      quantity: body.quantity || null,
      stage: body.stage || null,
      isOrder: body.isOrder || false,
      notes: body.notes || null
    }).returning()

    if (!inserted) {
      throw new Error('Failed to create batch')
    }

    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, inserted.id),
      with: {
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
routes.put('/:id', zValidator('json', UpdateBatchSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const body = c.req.valid('json')
    const user = c.get('user')
    const ids = await orgNurseryIds(user.organisationId)

    // Check if batch exists and belongs to user's organization
    const existingBatch = await db.query.batches.findFirst({
      where: and(
        eq(batches.id, id),
        inArray(batches.nurseryId, ids.length ? ids : [-1])
      )
    })

    if (!existingBatch) {
      return c.json({ 
        error: 'Batch not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // If updating nursery, verify it belongs to the organization
    if (body.nurseryId) {
      const nursery = await db.query.nurseries.findFirst({
        where: and(
          eq(nurseries.id, body.nurseryId),
          eq(nurseries.organisationId, user.organisationId)
        )
      })
      
      if (!nursery) {
        return c.json({ 
          error: 'Nursery not found or does not belong to your organization',
          timestamp: new Date().toISOString()
        }, 404)
      }
    }

    const updateData: Partial<typeof batches.$inferInsert> = { updatedAt: new Date() }
    
    if (body.speciesId !== undefined) updateData.speciesId = body.speciesId
    if (body.nurseryId !== undefined) updateData.nurseryId = body.nurseryId
    if (body.origin !== undefined) updateData.origin = body.origin || null
    if (body.quantity !== undefined) updateData.quantity = body.quantity || null
    if (body.stage !== undefined) updateData.stage = body.stage || null
    if (body.isOrder !== undefined) updateData.isOrder = body.isOrder
    if (body.completedAt !== undefined) updateData.completedAt = body.completedAt || null
    if (body.notes !== undefined) updateData.notes = body.notes || null

    await db.update(batches).set(updateData).where(eq(batches.id, id))

    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, id),
      with: {
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
routes.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const user = c.get('user')
    const ids = await orgNurseryIds(user.organisationId)

    // Check if batch exists and belongs to user's organization
    const existingBatch = await db.query.batches.findFirst({
      where: and(
        eq(batches.id, id),
        inArray(batches.nurseryId, ids.length ? ids : [-1])
      )
    })

    if (!existingBatch) {
      return c.json({ 
        error: 'Batch not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Check if batch is being used in any allotments
    const allotmentsUsingBatch = await db.query.allotments.findMany({
      where: eq(allotments.batchId, id),
      with: {
        season: {
          with: {
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
          allotments: allotmentsUsingBatch.map((allotment) => ({
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

    await db.delete(batches).where(eq(batches.id, id))

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

export default routes
