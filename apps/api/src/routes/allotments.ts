import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { allotments, seasons, batches, nurseries } from '../db/schema.js'
import {
  CreateAllotmentSchema,
  UpdateAllotmentSchema,
  BulkCreateAllotmentSchema
} from '../schemas/allotment.js'
import { authenticate } from '../middleware/auth.js'

const routes = new Hono()

const allotmentWith = {
  season: {
    with: {
      site: true
    }
  },
  batch: {
    with: {
      species: true,
      nursery: true
    }
  }
} as const

async function orgSeasonIds(organisationId: number) {
  const orgSeasons = await db.select({ id: seasons.id }).from(seasons).where(eq(seasons.organisationId, organisationId))
  return orgSeasons.map(s => s.id)
}

async function orgNurseryIds(organisationId: number) {
  const orgNurseries = await db.select({ id: nurseries.id }).from(nurseries).where(eq(nurseries.organisationId, organisationId))
  return orgNurseries.map(n => n.id)
}

// Apply authentication middleware to all allotment routes
routes.use('*', authenticate)

// Get all allotments for the authenticated user's organization
routes.get('/', async (c) => {
  try {
    const user = c.get('user')
    const ids = await orgSeasonIds(user.organisationId)
    
    const allotmentList = await db.query.allotments.findMany({
      where: inArray(allotments.seasonId, ids.length ? ids : [-1]),
      with: allotmentWith,
      orderBy: desc(allotments.createdAt)
    })

    return c.json({
      allotments: allotmentList,
      count: allotmentList.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching allotments:', error)
    return c.json({ 
      error: 'Failed to fetch allotments',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get allotment by ID (organization-scoped)
routes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const user = c.get('user')
    
    const allotment = await db.query.allotments.findFirst({
      where: eq(allotments.id, id),
      with: allotmentWith
    })

    if (!allotment || allotment.season.organisationId !== user.organisationId) {
      return c.json({ 
        error: 'Allotment not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    return c.json({
      allotment,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching allotment:', error)
    return c.json({ 
      error: 'Failed to fetch allotment',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Create new allotment (single)
routes.post('/', zValidator('json', CreateAllotmentSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    // Verify that season belongs to the user's organization
    const season = await db.query.seasons.findFirst({
      where: and(
        eq(seasons.id, body.seasonId),
        eq(seasons.organisationId, user.organisationId)
      )
    })
    
    if (!season) {
      return c.json({ 
        error: 'Season not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const nurseryIds = await orgNurseryIds(user.organisationId)

    // Verify that batch belongs to the user's organization
    const batch = await db.query.batches.findFirst({
      where: and(
        eq(batches.id, body.batchId),
        inArray(batches.nurseryId, nurseryIds.length ? nurseryIds : [-1])
      )
    })
    
    if (!batch) {
      return c.json({ 
        error: 'Batch not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    const [inserted] = await db.insert(allotments).values({
      seasonId: body.seasonId,
      batchId: body.batchId,
      quantity: body.quantity
    }).returning()

    if (!inserted) {
      throw new Error('Failed to create allotment')
    }

    const allotment = await db.query.allotments.findFirst({
      where: eq(allotments.id, inserted.id),
      with: allotmentWith
    })

    return c.json({
      allotment,
      message: 'Allotment created successfully',
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    console.error('Error creating allotment:', error)
    return c.json({ 
      error: 'Failed to create allotment',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Create multiple allotments (bulk)
routes.post('/bulk', zValidator('json', BulkCreateAllotmentSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    // Validate all seasons and batches belong to the user's organization
    const seasonIds = [...new Set(body.allotments.map(a => a.seasonId))]
    const batchIds = [...new Set(body.allotments.map(a => a.batchId))]
    
    // Verify all seasons belong to the user's organization
    const seasonRows = await db.query.seasons.findMany({
      where: and(
        inArray(seasons.id, seasonIds),
        eq(seasons.organisationId, user.organisationId)
      )
    })
    
    if (seasonRows.length !== seasonIds.length) {
      return c.json({ 
        error: 'One or more seasons not found or do not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const nurseryIds = await orgNurseryIds(user.organisationId)

    // Verify all batches belong to the user's organization
    const batchRows = await db.query.batches.findMany({
      where: and(
        inArray(batches.id, batchIds),
        inArray(batches.nurseryId, nurseryIds.length ? nurseryIds : [-1])
      )
    })
    
    if (batchRows.length !== batchIds.length) {
      return c.json({ 
        error: 'One or more batches not found or do not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    const inserted = await db.insert(allotments).values(
      body.allotments.map(allotment => ({
        seasonId: allotment.seasonId,
        batchId: allotment.batchId,
        quantity: allotment.quantity
      }))
    ).returning()

    const createdRows = await db.query.allotments.findMany({
      where: inArray(allotments.id, inserted.map(r => r.id)),
      with: allotmentWith
    })

    const byId = new Map(createdRows.map(row => [row.id, row]))
    const createdAllotments = inserted.map(row => byId.get(row.id)!)

    return c.json({
      allotments: createdAllotments,
      message: `${createdAllotments.length} allotment(s) created successfully`,
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    console.error('Error creating allotments:', error)
    return c.json({ 
      error: 'Failed to create allotments',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Update allotment
routes.put('/:id', zValidator('json', UpdateAllotmentSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const body = c.req.valid('json')
    const user = c.get('user')
    const seasonIds = await orgSeasonIds(user.organisationId)

    // Check if allotment exists and belongs to user's organization
    const existingAllotment = await db.query.allotments.findFirst({
      where: and(
        eq(allotments.id, id),
        inArray(allotments.seasonId, seasonIds.length ? seasonIds : [-1])
      )
    })

    if (!existingAllotment) {
      return c.json({ 
        error: 'Allotment not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // If updating season, verify it belongs to the organization
    if (body.seasonId) {
      const season = await db.query.seasons.findFirst({
        where: and(
          eq(seasons.id, body.seasonId),
          eq(seasons.organisationId, user.organisationId)
        )
      })
      
      if (!season) {
        return c.json({ 
          error: 'Season not found or does not belong to your organization',
          timestamp: new Date().toISOString()
        }, 404)
      }
    }

    // If updating batch, verify it belongs to the organization
    if (body.batchId) {
      const nurseryIds = await orgNurseryIds(user.organisationId)
      const batch = await db.query.batches.findFirst({
        where: and(
          eq(batches.id, body.batchId),
          inArray(batches.nurseryId, nurseryIds.length ? nurseryIds : [-1])
        )
      })
      
      if (!batch) {
        return c.json({ 
          error: 'Batch not found or does not belong to your organization',
          timestamp: new Date().toISOString()
        }, 404)
      }
    }

    await db.update(allotments).set({
      ...(body.seasonId !== undefined && { seasonId: body.seasonId }),
      ...(body.batchId !== undefined && { batchId: body.batchId }),
      ...(body.quantity !== undefined && { quantity: body.quantity }),
      updatedAt: new Date()
    }).where(eq(allotments.id, id))

    const allotment = await db.query.allotments.findFirst({
      where: eq(allotments.id, id),
      with: allotmentWith
    })

    return c.json({
      allotment,
      message: 'Allotment updated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating allotment:', error)
    return c.json({ 
      error: 'Failed to update allotment',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get allotments by season ID
routes.get('/season/:seasonId', async (c) => {
  try {
    const seasonId = parseInt(c.req.param('seasonId') ?? '', 10)
    const user = c.get('user')
    
    // Verify that season belongs to the user's organization
    const season = await db.query.seasons.findFirst({
      where: and(
        eq(seasons.id, seasonId),
        eq(seasons.organisationId, user.organisationId)
      ),
      with: {
        site: true
      }
    })
    
    if (!season) {
      return c.json({ 
        error: 'Season not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const allotmentList = await db.query.allotments.findMany({
      where: eq(allotments.seasonId, seasonId),
      with: allotmentWith,
      orderBy: desc(allotments.createdAt)
    })

    return c.json({
      allotments: allotmentList,
      count: allotmentList.length,
      season: {
        id: season.id,
        year: season.year,
        season: season.season,
        site: season.site
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching allotments by season:', error)
    return c.json({ 
      error: 'Failed to fetch allotments by season',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Delete allotment
routes.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const user = c.get('user')
    const seasonIds = await orgSeasonIds(user.organisationId)

    // Check if allotment exists and belongs to user's organization
    const existingAllotment = await db.query.allotments.findFirst({
      where: and(
        eq(allotments.id, id),
        inArray(allotments.seasonId, seasonIds.length ? seasonIds : [-1])
      )
    })

    if (!existingAllotment) {
      return c.json({ 
        error: 'Allotment not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    await db.delete(allotments).where(eq(allotments.id, id))

    return c.json({
      message: 'Allotment deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting allotment:', error)
    return c.json({ 
      error: 'Failed to delete allotment',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default routes
