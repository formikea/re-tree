import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, desc, ne } from 'drizzle-orm'
import { db } from '../db/index.js'
import { seasons, sites } from '../db/schema.js'
import {
  CreateSeasonSchema,
  UpdateSeasonSchema,
  BulkCreateSeasonSchema
} from '../schemas/season.js'
import { authenticate } from '../middleware/auth.js'

const routes = new Hono()

// Apply authentication middleware to all season routes
routes.use('*', authenticate)

// Get all seasons for the authenticated user's organization
routes.get('/', async (c) => {
  try {
    const user = c.get('user')
    
    const seasonList = await db.query.seasons.findMany({
      where: eq(seasons.organisationId, user.organisationId),
      with: {
        site: true
      },
      orderBy: desc(seasons.createdAt)
    })

    return c.json({
      seasons: seasonList,
      count: seasonList.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching seasons:', error)
    return c.json({ 
      error: 'Failed to fetch seasons',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get season by ID (organization-scoped)
routes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const user = c.get('user')
    
    const season = await db.query.seasons.findFirst({
      where: and(
        eq(seasons.id, id),
        eq(seasons.organisationId, user.organisationId)
      ),
      with: {
        site: true
      }
    })

    if (!season) {
      return c.json({ 
        error: 'Season not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    return c.json({
      season,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching season:', error)
    return c.json({ 
      error: 'Failed to fetch season',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get seasons by site ID (organization-scoped)
routes.get('/site/:siteId', async (c) => {
  try {
    const siteId = parseInt(c.req.param('siteId') ?? '', 10)
    const user = c.get('user')
    
    // Verify that site belongs to the user's organization
    const site = await db.query.sites.findFirst({
      where: and(
        eq(sites.id, siteId),
        eq(sites.organisationId, user.organisationId)
      )
    })
    
    if (!site) {
      return c.json({ 
        error: 'Site not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    const seasonList = await db.query.seasons.findMany({
      where: and(
        eq(seasons.siteId, siteId),
        eq(seasons.organisationId, user.organisationId)
      ),
      with: {
        site: true
      },
      orderBy: desc(seasons.createdAt)
    })

    return c.json({
      seasons: seasonList,
      count: seasonList.length,
      site: {
        id: site.id,
        name: site.name
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching seasons by site:', error)
    return c.json({ 
      error: 'Failed to fetch seasons by site',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Create new season
routes.post('/', zValidator('json', CreateSeasonSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    // Verify that site belongs to the user's organization
    const site = await db.query.sites.findFirst({
      where: and(
        eq(sites.id, body.siteId),
        eq(sites.organisationId, user.organisationId)
      )
    })
    
    if (!site) {
      return c.json({ 
        error: 'Site not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    // Check if a season already exists for this site with the same year and season
    const existingSeason = await db.query.seasons.findFirst({
      where: and(
        eq(seasons.siteId, body.siteId),
        eq(seasons.organisationId, user.organisationId),
        eq(seasons.year, body.year),
        eq(seasons.season, body.season)
      )
    })
    
    if (existingSeason) {
      return c.json({ 
        error: `A season for ${body.season} ${body.year} already exists for this site`,
        timestamp: new Date().toISOString()
      }, 409)
    }
    
    const [inserted] = await db.insert(seasons).values({
      siteId: body.siteId,
      organisationId: user.organisationId,
      year: body.year,
      season: body.season,
      notes: body.notes || null
    }).returning()

    if (!inserted) {
      throw new Error('Failed to create season')
    }

    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, inserted.id),
      with: {
        site: true
      }
    })

    return c.json({
      season,
      message: 'Season created successfully',
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    console.error('Error creating season:', error)
    return c.json({ 
      error: 'Failed to create season',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Create seasons for all organization sites
routes.post('/bulk', zValidator('json', BulkCreateSeasonSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    // Verify that the target site belongs to the user's organization
    const targetSite = await db.query.sites.findFirst({
      where: and(
        eq(sites.id, body.siteId),
        eq(sites.organisationId, user.organisationId)
      )
    })
    
    if (!targetSite) {
      return c.json({ 
        error: 'Site not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    // Get all sites in the organization
    const allSites = await db.select().from(sites).where(eq(sites.organisationId, user.organisationId))
    
    // Get existing seasons for the specified year and season
    const existingSeasons = await db.select({ siteId: seasons.siteId }).from(seasons).where(
      and(
        eq(seasons.organisationId, user.organisationId),
        eq(seasons.year, body.year),
        eq(seasons.season, body.season)
      )
    )
    
    const sitesWithExistingSeasons = new Set(existingSeasons.map((s) => s.siteId))
    
    // Filter sites that don't already have this season
    const sitesToAddSeason = allSites.filter((site) => !sitesWithExistingSeasons.has(site.id))
    
    if (sitesToAddSeason.length === 0) {
      return c.json({
        seasons: [],
        created: 0,
        skipped: allSites.length,
        message: `All sites already have a season for ${body.season} ${body.year}`,
        timestamp: new Date().toISOString()
      })
    }
    
    const inserted = await db.insert(seasons).values(
      sitesToAddSeason.map(site => ({
        siteId: site.id,
        organisationId: user.organisationId,
        year: body.year,
        season: body.season,
        notes: body.notes || null
      }))
    ).returning()

    const siteById = new Map(sitesToAddSeason.map(site => [site.id, site]))
    const createdSeasons = inserted.map(season => ({
      ...season,
      site: siteById.get(season.siteId)
    }))
    
    return c.json({
      seasons: createdSeasons,
      created: createdSeasons.length,
      skipped: sitesWithExistingSeasons.size,
      message: `Created seasons for ${createdSeasons.length} sites`,
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    console.error('Error creating bulk seasons:', error)
    return c.json({ 
      error: 'Failed to create seasons',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Update season
routes.put('/:id', zValidator('json', UpdateSeasonSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const body = c.req.valid('json')
    const user = c.get('user')

    // Check if season exists and belongs to user's organization
    const existingSeason = await db.query.seasons.findFirst({
      where: and(
        eq(seasons.id, id),
        eq(seasons.organisationId, user.organisationId)
      )
    })

    if (!existingSeason) {
      return c.json({ 
        error: 'Season not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // If updating site, verify it belongs to the organization
    if (body.siteId) {
      const site = await db.query.sites.findFirst({
        where: and(
          eq(sites.id, body.siteId),
          eq(sites.organisationId, user.organisationId)
        )
      })
      
      if (!site) {
        return c.json({ 
          error: 'Site not found or does not belong to your organization',
          timestamp: new Date().toISOString()
        }, 404)
      }
    }

    // Check for duplicate season if year or season is being updated
    if (body.year !== undefined || body.season !== undefined) {
      const targetSiteId = body.siteId || existingSeason.siteId
      const targetYear = body.year !== undefined ? body.year : existingSeason.year
      const targetSeason = body.season !== undefined ? body.season : existingSeason.season
      
      const duplicateSeason = await db.query.seasons.findFirst({
        where: and(
          eq(seasons.siteId, targetSiteId),
          eq(seasons.organisationId, user.organisationId),
          eq(seasons.year, targetYear),
          eq(seasons.season, targetSeason),
          ne(seasons.id, id)
        )
      })
      
      if (duplicateSeason) {
        return c.json({ 
          error: `A season for ${targetSeason} ${targetYear} already exists for this site`,
          timestamp: new Date().toISOString()
        }, 409)
      }
    }

    await db.update(seasons).set({
      ...(body.siteId !== undefined && { siteId: body.siteId }),
      ...(body.year !== undefined && { year: body.year }),
      ...(body.season !== undefined && { season: body.season }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
      updatedAt: new Date()
    }).where(eq(seasons.id, id))

    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, id),
      with: {
        site: true
      }
    })

    return c.json({
      season,
      message: 'Season updated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating season:', error)
    return c.json({ 
      error: 'Failed to update season',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Delete season
routes.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const user = c.get('user')

    // Check if season exists and belongs to user's organization
    const existingSeason = await db.query.seasons.findFirst({
      where: and(
        eq(seasons.id, id),
        eq(seasons.organisationId, user.organisationId)
      )
    })

    if (!existingSeason) {
      return c.json({ 
        error: 'Season not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    await db.delete(seasons).where(eq(seasons.id, id))

    return c.json({
      message: 'Season deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting season:', error)
    return c.json({ 
      error: 'Failed to delete season',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default routes
