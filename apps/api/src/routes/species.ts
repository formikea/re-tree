import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '#prisma'
import {
  CreateSpeciesSchema,
  UpdateSpeciesSchema
} from '../schemas/species.js'
import { authenticate } from '../middleware/auth.js'

const species = new Hono()

// Apply authentication middleware to all species routes
species.use('*', authenticate)

// Get all species (global - not organization specific)
species.get('/', async (c) => {
  try {
    const species = await prisma.species.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return c.json({
      species,
      count: species.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching species:', error)
    return c.json({ 
      error: 'Failed to fetch species',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get species for a specific organisation
species.get('/organisation/:organisationId', async (c) => {
  try {
    const organisationId = parseInt(c.req.param('organisationId'))
    
    const organisationSpecies = await prisma.organisationSpecies.findMany({
      where: { organisationId },
      include: {
        species: true
      },
      orderBy: {
        species: {
          createdAt: 'desc'
        }
      }
    })

    const species = organisationSpecies.map((os: any) => os.species)

    return c.json({
      species,
      count: species.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching organisation species:', error)
    return c.json({ 
      error: 'Failed to fetch organisation species',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Add species to organisation
species.post('/organisation/:organisationId', async (c) => {
  try {
    const organisationId = parseInt(c.req.param('organisationId'))
    const body = await c.req.json()
    const { speciesId } = body

    if (!speciesId) {
      return c.json({ 
        error: 'Species ID is required',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Check if organisation exists
    const organisation = await prisma.organisation.findUnique({
      where: { id: organisationId }
    })

    if (!organisation) {
      return c.json({ 
        error: 'Organisation not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Check if species exists
    const species = await prisma.species.findUnique({
      where: { id: speciesId }
    })

    if (!species) {
      return c.json({ 
        error: 'Species not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Check if mapping already exists
    const existingMapping = await prisma.organisationSpecies.findUnique({
      where: {
        organisationId_speciesId: {
          organisationId,
          speciesId
        }
      }
    })

    if (existingMapping) {
      return c.json({ 
        error: 'Species is already mapped to this organisation',
        timestamp: new Date().toISOString()
      }, 409)
    }

    const organisationSpecies = await prisma.organisationSpecies.create({
      data: {
        organisationId,
        speciesId
      },
      include: {
        species: true
      }
    })

    return c.json({
      organisationSpecies,
      message: 'Species added to organisation successfully',
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    console.error('Error adding species to organisation:', error)
    return c.json({ 
      error: 'Failed to add species to organisation',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Remove species from organisation
species.delete('/organisation/:organisationId/:speciesId', async (c) => {
  try {
    const organisationId = parseInt(c.req.param('organisationId'))
    const speciesId = parseInt(c.req.param('speciesId'))

    // Check if mapping exists
    const existingMapping = await prisma.organisationSpecies.findUnique({
      where: {
        organisationId_speciesId: {
          organisationId,
          speciesId
        }
      }
    })

    if (!existingMapping) {
      return c.json({ 
        error: 'Species mapping not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    await prisma.organisationSpecies.delete({
      where: {
        organisationId_speciesId: {
          organisationId,
          speciesId
        }
      }
    })

    return c.json({
      message: 'Species removed from organisation successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error removing species from organisation:', error)
    return c.json({ 
      error: 'Failed to remove species from organisation',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get species by ID
species.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    const species = await prisma.species.findUnique({
      where: { id }
    })

    if (!species) {
      return c.json({ 
        error: 'Species not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    return c.json({
      species,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching species:', error)
    return c.json({ 
      error: 'Failed to fetch species',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Create new species
species.post('/', zValidator('json', CreateSpeciesSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    
    const species = await prisma.species.create({
      data: {
        botanicalName: body.botanicalName || null,
        commonName: body.commonName || null,
        maoriName: body.maoriName || null,
        threatenedSpecies: body.threatenedSpecies,
        treesThatCount: body.treesThatCount,
        notes: body.notes || null
      }
    })

    return c.json({
      species,
      message: 'Species created successfully',
      timestamp: new Date().toISOString()
    }, 201)
  } catch (error) {
    console.error('Error creating species:', error)
    return c.json({ 
      error: 'Failed to create species',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Update species
species.put('/:id', zValidator('json', UpdateSpeciesSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = c.req.valid('json')

    // Check if species exists
    const existingSpecies = await prisma.species.findUnique({
      where: { id }
    })

    if (!existingSpecies) {
      return c.json({ 
        error: 'Species not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const species = await prisma.species.update({
      where: { id },
      data: {
        ...(body.botanicalName !== undefined && { botanicalName: body.botanicalName || null }),
        ...(body.commonName !== undefined && { commonName: body.commonName || null }),
        ...(body.maoriName !== undefined && { maoriName: body.maoriName || null }),
        ...(body.threatenedSpecies !== undefined && { threatenedSpecies: body.threatenedSpecies }),
        ...(body.treesThatCount !== undefined && { treesThatCount: body.treesThatCount }),
        ...(body.notes !== undefined && { notes: body.notes || null })
      }
    })

    return c.json({
      species,
      message: 'Species updated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating species:', error)
    return c.json({ 
      error: 'Failed to update species',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Delete species
species.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    // Check if species exists
    const existingSpecies = await prisma.species.findUnique({
      where: { id }
    })

    if (!existingSpecies) {
      return c.json({ 
        error: 'Species not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    await prisma.species.delete({
      where: { id }
    })

    return c.json({
      message: 'Species deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting species:', error)
    return c.json({ 
      error: 'Failed to delete species',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default species 