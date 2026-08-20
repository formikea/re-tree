import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma.js'
import {
  CreateAllotmentSchema,
  UpdateAllotmentSchema,
  BulkCreateAllotmentSchema
} from '../schemas/allotment.js'
import { authenticate } from '../middleware/auth.js'

const allotments = new Hono()

// Apply authentication middleware to all allotment routes
allotments.use('*', authenticate)

// Get all allotments for the authenticated user's organization
allotments.get('/', async (c) => {
  try {
    const user = c.get('user')
    
    const allotments = await prisma.allotment.findMany({
      where: {
        season: {
          organisationId: user.organisationId
        }
      },
      include: {
        season: {
          include: {
            site: true
          }
        },
        batch: {
          include: {
            species: true,
            nursery: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return c.json({
      allotments,
      count: allotments.length,
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
allotments.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const user = c.get('user')
    
    const allotment = await prisma.allotment.findFirst({
      where: { 
        id,
        season: {
          organisationId: user.organisationId
        }
      },
      include: {
        season: {
          include: {
            site: true
          }
        },
        batch: {
          include: {
            species: true,
            nursery: true
          }
        }
      }
    })

    if (!allotment) {
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
allotments.post('/', zValidator('json', CreateAllotmentSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    // Verify that season belongs to the user's organization
    const season = await prisma.season.findFirst({
      where: { 
        id: body.seasonId,
        organisationId: user.organisationId
      }
    })
    
    if (!season) {
      return c.json({ 
        error: 'Season not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Verify that batch belongs to the user's organization
    const batch = await prisma.batch.findFirst({
      where: { 
        id: body.batchId,
        nursery: {
          organisationId: user.organisationId
        }
      }
    })
    
    if (!batch) {
      return c.json({ 
        error: 'Batch not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    const allotment = await prisma.allotment.create({
      data: {
        seasonId: body.seasonId,
        batchId: body.batchId,
        quantity: body.quantity
      },
      include: {
        season: {
          include: {
            site: true
          }
        },
        batch: {
          include: {
            species: true,
            nursery: true
          }
        }
      }
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
allotments.post('/bulk', zValidator('json', BulkCreateAllotmentSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')
    
    // Validate all seasons and batches belong to the user's organization
    const seasonIds = [...new Set(body.allotments.map(a => a.seasonId))]
    const batchIds = [...new Set(body.allotments.map(a => a.batchId))]
    
    // Verify all seasons belong to the user's organization
    const seasons = await prisma.season.findMany({
      where: { 
        id: { in: seasonIds },
        organisationId: user.organisationId
      }
    })
    
    if (seasons.length !== seasonIds.length) {
      return c.json({ 
        error: 'One or more seasons not found or do not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Verify all batches belong to the user's organization
    const batches = await prisma.batch.findMany({
      where: { 
        id: { in: batchIds },
        nursery: {
          organisationId: user.organisationId
        }
      }
    })
    
    if (batches.length !== batchIds.length) {
      return c.json({ 
        error: 'One or more batches not found or do not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }
    
    // Create all allotments in a transaction
    const createdAllotments = await prisma.$transaction(
      body.allotments.map(allotment => 
        prisma.allotment.create({
          data: {
            seasonId: allotment.seasonId,
            batchId: allotment.batchId,
            quantity: allotment.quantity
          },
          include: {
            season: {
              include: {
                site: true
              }
            },
            batch: {
              include: {
                species: true,
                nursery: true
              }
            }
          }
        })
      )
    )

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
allotments.put('/:id', zValidator('json', UpdateAllotmentSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = c.req.valid('json')
    const user = c.get('user')

    // Check if allotment exists and belongs to user's organization
    const existingAllotment = await prisma.allotment.findFirst({
      where: { 
        id,
        season: {
          organisationId: user.organisationId
        }
      }
    })

    if (!existingAllotment) {
      return c.json({ 
        error: 'Allotment not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // If updating season, verify it belongs to the organization
    if (body.seasonId) {
      const season = await prisma.season.findFirst({
        where: { 
          id: body.seasonId,
          organisationId: user.organisationId
        }
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
      const batch = await prisma.batch.findFirst({
        where: { 
          id: body.batchId,
          nursery: {
            organisationId: user.organisationId
          }
        }
      })
      
      if (!batch) {
        return c.json({ 
          error: 'Batch not found or does not belong to your organization',
          timestamp: new Date().toISOString()
        }, 404)
      }
    }

    const allotment = await prisma.allotment.update({
      where: { id },
      data: {
        ...(body.seasonId !== undefined && { seasonId: body.seasonId }),
        ...(body.batchId !== undefined && { batchId: body.batchId }),
        ...(body.quantity !== undefined && { quantity: body.quantity })
      },
      include: {
        season: {
          include: {
            site: true
          }
        },
        batch: {
          include: {
            species: true,
            nursery: true
          }
        }
      }
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
allotments.get('/season/:seasonId', async (c) => {
  try {
    const seasonId = parseInt(c.req.param('seasonId'))
    const user = c.get('user')
    
    // Verify that season belongs to the user's organization
    const season = await prisma.season.findFirst({
      where: { 
        id: seasonId,
        organisationId: user.organisationId
      },
      include: {
        site: true
      }
    })
    
    if (!season) {
      return c.json({ 
        error: 'Season not found or does not belong to your organization',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const allotments = await prisma.allotment.findMany({
      where: {
        seasonId: seasonId
      },
      include: {
        season: {
          include: {
            site: true
          }
        },
        batch: {
          include: {
            species: true,
            nursery: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return c.json({
      allotments,
      count: allotments.length,
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
allotments.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const user = c.get('user')

    // Check if allotment exists and belongs to user's organization
    const existingAllotment = await prisma.allotment.findFirst({
      where: { 
        id,
        season: {
          organisationId: user.organisationId
        }
      }
    })

    if (!existingAllotment) {
      return c.json({ 
        error: 'Allotment not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    await prisma.allotment.delete({
      where: { id }
    })

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

export default allotments 