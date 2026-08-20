import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { species, organisations, organisationSpecies } from '../db/schema.js'
import {
  CreateSpeciesSchema,
  UpdateSpeciesSchema
} from '../schemas/species.js'
import { authenticate } from '../middleware/auth.js'

const routes = new Hono()

// Apply authentication middleware to all species routes
routes.use('*', authenticate)

// Get all species (global - not organization specific)
routes.get('/', async (c) => {
  try {
    const speciesList = await db.query.species.findMany({
      orderBy: desc(species.createdAt)
    })

    return c.json({
      species: speciesList,
      count: speciesList.length,
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
routes.get('/organisation/:organisationId', async (c) => {
  try {
    const organisationId = parseInt(c.req.param('organisationId') ?? '', 10)
    
    const mappings = await db.query.organisationSpecies.findMany({
      where: eq(organisationSpecies.organisationId, organisationId),
      with: {
        species: true
      }
    })

    const speciesList = mappings
      .map((os) => os.species)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return c.json({
      species: speciesList,
      count: speciesList.length,
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
routes.post('/organisation/:organisationId', async (c) => {
  try {
    const organisationId = parseInt(c.req.param('organisationId') ?? '', 10)
    const body = await c.req.json()
    const { speciesId } = body

    if (!speciesId) {
      return c.json({ 
        error: 'Species ID is required',
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Check if organisation exists
    const organisation = await db.query.organisations.findFirst({
      where: eq(organisations.id, organisationId)
    })

    if (!organisation) {
      return c.json({ 
        error: 'Organisation not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Check if species exists
    const speciesRow = await db.query.species.findFirst({
      where: eq(species.id, speciesId)
    })

    if (!speciesRow) {
      return c.json({ 
        error: 'Species not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    // Check if mapping already exists
    const existingMapping = await db.query.organisationSpecies.findFirst({
      where: and(
        eq(organisationSpecies.organisationId, organisationId),
        eq(organisationSpecies.speciesId, speciesId)
      )
    })

    if (existingMapping) {
      return c.json({ 
        error: 'Species is already mapped to this organisation',
        timestamp: new Date().toISOString()
      }, 409)
    }

    const [inserted] = await db.insert(organisationSpecies).values({
      organisationId,
      speciesId
    }).returning()

    if (!inserted) {
      throw new Error('Failed to create species mapping')
    }

    const mapping = await db.query.organisationSpecies.findFirst({
      where: eq(organisationSpecies.id, inserted.id),
      with: {
        species: true
      }
    })

    return c.json({
      organisationSpecies: mapping,
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
routes.delete('/organisation/:organisationId/:speciesId', async (c) => {
  try {
    const organisationId = parseInt(c.req.param('organisationId') ?? '', 10)
    const speciesId = parseInt(c.req.param('speciesId') ?? '', 10)

    // Check if mapping exists
    const existingMapping = await db.query.organisationSpecies.findFirst({
      where: and(
        eq(organisationSpecies.organisationId, organisationId),
        eq(organisationSpecies.speciesId, speciesId)
      )
    })

    if (!existingMapping) {
      return c.json({ 
        error: 'Species mapping not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    await db.delete(organisationSpecies).where(
      and(
        eq(organisationSpecies.organisationId, organisationId),
        eq(organisationSpecies.speciesId, speciesId)
      )
    )

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
routes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    
    const speciesRow = await db.query.species.findFirst({
      where: eq(species.id, id)
    })

    if (!speciesRow) {
      return c.json({ 
        error: 'Species not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    return c.json({
      species: speciesRow,
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
routes.post('/', zValidator('json', CreateSpeciesSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    
    const [speciesRow] = await db.insert(species).values({
      botanicalName: body.botanicalName || null,
      commonName: body.commonName || null,
      maoriName: body.maoriName || null,
      threatenedSpecies: body.threatenedSpecies,
      treesThatCount: body.treesThatCount,
      notes: body.notes || null
    }).returning()

    return c.json({
      species: speciesRow,
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
routes.put('/:id', zValidator('json', UpdateSpeciesSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const body = c.req.valid('json')

    // Check if species exists
    const existingSpecies = await db.query.species.findFirst({
      where: eq(species.id, id)
    })

    if (!existingSpecies) {
      return c.json({ 
        error: 'Species not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const [speciesRow] = await db.update(species).set({
      ...(body.botanicalName !== undefined && { botanicalName: body.botanicalName || null }),
      ...(body.commonName !== undefined && { commonName: body.commonName || null }),
      ...(body.maoriName !== undefined && { maoriName: body.maoriName || null }),
      ...(body.threatenedSpecies !== undefined && { threatenedSpecies: body.threatenedSpecies }),
      ...(body.treesThatCount !== undefined && { treesThatCount: body.treesThatCount }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
      updatedAt: new Date()
    }).where(eq(species.id, id)).returning()

    return c.json({
      species: speciesRow,
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
routes.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)

    // Check if species exists
    const existingSpecies = await db.query.species.findFirst({
      where: eq(species.id, id)
    })

    if (!existingSpecies) {
      return c.json({ 
        error: 'Species not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    await db.delete(species).where(eq(species.id, id))

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

export default routes
