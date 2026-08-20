import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '#prisma'
import {
  CreateSeasonSchema,
  UpdateSeasonSchema,
  BulkCreateSeasonSchema
} from '../schemas/season.js'
import { authenticate } from '../middleware/auth.js'

const seasons = new Hono()

// Apply authentication middleware to all season routes
seasons.use('*', authenticate)

// Get all seasons for the authenticated user's organization
seasons.get('/', async (c) => {
  try {
    const user = c.get('user')
    
    const seasons = await prisma.season.findMany({
      where: {
        organisationId: user.organisationId
      },
      include: {
        site: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return c.json({
      seasons,
      count: seasons.length,
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
seasons.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const user = c.get('user')
    
    const season = await prisma.season.findFirst({
      where: { 
        id,
        organisationId: user.organisationId
      },
      include: {
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
seasons.get('/site/:siteId', async (c) => {
  try {
    const siteId = parseInt(c.req.param('siteId'))
    const user = c.get('user')
    
    // Verify that site belongs to the user's organization
    const site = await prisma.site.findFirst({
      where: { 
        id: siteId,
        organisationId: user.organisationId
      }
    })
    
    if (!site) {
      return c.json({ 
        error: 'Site not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    const seasons = await prisma.season.findMany({
      where: {
        siteId,
        organisationId: user.organisationId
      },
      include: {
        site: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return c.json({
      seasons,
      count: seasons.length,
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
seasons.post('/', zValidator('json', CreateSeasonSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    // Verify that site belongs to the user's organization
    const site = await prisma.site.findFirst({
      where: { 
        id: body.siteId,
        organisationId: user.organisationId
      }
    })
    
    if (!site) {
      return c.json({ 
        error: 'Site not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    // Check if a season already exists for this site with the same year and season
    const existingSeason = await prisma.season.findFirst({
      where: {
        siteId: body.siteId,
        organisationId: user.organisationId,
        year: body.year,
        season: body.season
      }
    })
    
    if (existingSeason) {
      return c.json({ 
        error: `A season for ${body.season} ${body.year} already exists for this site`,
        timestamp: new Date().toISOString()
      }, 409)
    }
    
    const season = await prisma.season.create({
      data: {
        siteId: body.siteId,
        organisationId: user.organisationId,
        year: body.year,
        season: body.season,
        notes: body.notes || null
      },
      include: {
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
seasons.post('/bulk', zValidator('json', BulkCreateSeasonSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    // Verify that the target site belongs to the user's organization
    const targetSite = await prisma.site.findFirst({
      where: { 
        id: body.siteId,
        organisationId: user.organisationId
      }
    })
    
    if (!targetSite) {
      return c.json({ 
        error: 'Site not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    // Get all sites in the organization
    const allSites = await prisma.site.findMany({
      where: {
        organisationId: user.organisationId
      }
    })
    
    // Get existing seasons for the specified year and season
    const existingSeasons = await prisma.season.findMany({
      where: {
        organisationId: user.organisationId,
        year: body.year,
        season: body.season
      },
      select: {
        siteId: true
      }
    })
    
    const sitesWithExistingSeasons = new Set(existingSeasons.map((s: any) => s.siteId))
    
    // Filter sites that don't already have this season
    const sitesToAddSeason = allSites.filter((site: any) => !sitesWithExistingSeasons.has(site.id))
    
    if (sitesToAddSeason.length === 0) {
      return c.json({
        seasons: [],
        created: 0,
        skipped: allSites.length,
        message: `All sites already have a season for ${body.season} ${body.year}`,
        timestamp: new Date().toISOString()
      })
    }
    
    // Create seasons for all eligible sites
    const createdSeasons = await Promise.all(
      sitesToAddSeason.map(site => 
        prisma.season.create({
          data: {
            siteId: site.id,
            organisationId: user.organisationId,
            year: body.year,
            season: body.season,
            notes: body.notes || null
          },
          include: {
            site: true
          }
        })
      )
    )
    
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
seasons.put('/:id', zValidator('json', UpdateSeasonSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = c.req.valid('json')
    const user = c.get('user')

    // Check if season exists and belongs to user's organization
    const existingSeason = await prisma.season.findFirst({
      where: { 
        id,
        organisationId: user.organisationId
      }
    })

    if (!existingSeason) {
      return c.json({ 
        error: 'Season not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // If updating site, verify it belongs to the organization
    if (body.siteId) {
      const site = await prisma.site.findFirst({
        where: { 
          id: body.siteId,
          organisationId: user.organisationId
        }
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
      
      const duplicateSeason = await prisma.season.findFirst({
        where: {
          siteId: targetSiteId,
          organisationId: user.organisationId,
          year: targetYear,
          season: targetSeason,
          id: { not: id } // Exclude the current season being updated
        }
      })
      
      if (duplicateSeason) {
        return c.json({ 
          error: `A season for ${targetSeason} ${targetYear} already exists for this site`,
          timestamp: new Date().toISOString()
        }, 409)
      }
    }

    const season = await prisma.season.update({
      where: { id },
      data: {
        ...(body.siteId !== undefined && { siteId: body.siteId }),
        ...(body.year !== undefined && { year: body.year }),
        ...(body.season !== undefined && { season: body.season }),
        ...(body.notes !== undefined && { notes: body.notes || null })
      },
      include: {
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
seasons.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const user = c.get('user')

    // Check if season exists and belongs to user's organization
    const existingSeason = await prisma.season.findFirst({
      where: { 
        id,
        organisationId: user.organisationId
      }
    })

    if (!existingSeason) {
      return c.json({ 
        error: 'Season not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    await prisma.season.delete({
      where: { id }
    })

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

export default seasons 