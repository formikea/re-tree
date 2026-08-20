import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { sites } from '../db/schema.js'
import {
  CreateSiteSchema,
  UpdateSiteSchema
} from '../schemas/site.js'
import { authenticate } from '../middleware/auth.js'
import { requireReadOwnOrg, requireManageOwnOrganization } from '../middleware/roles.js'

const routes = new Hono()

routes.use('*', authenticate)

routes.get('/', requireReadOwnOrg, async (c) => {
  try {
    const user = c.get('user')

    const siteRows = await db.query.sites.findMany({
      where: eq(sites.organisationId, user.organisationId),
      orderBy: desc(sites.createdAt),
    })

    return c.json({
      sites: siteRows,
      count: siteRows.length,
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

routes.get('/:id', requireReadOwnOrg, async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const user = c.get('user')

    const site = await db.query.sites.findFirst({
      where: and(eq(sites.id, id), eq(sites.organisationId, user.organisationId)),
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

routes.post('/', requireManageOwnOrganization, zValidator('json', CreateSiteSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')

    const [site] = await db.insert(sites).values({
      name: body.name,
      type: body.type ?? null,
      notes: body.notes ?? null,
      region: body.region ?? null,
      coordinates: body.coordinates ?? null,
      area: body.area != null ? String(body.area) : null,
      owner: body.owner ?? null,
      organisationId: user.organisationId,
    }).returning()

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

routes.put('/:id', requireManageOwnOrganization, zValidator('json', UpdateSiteSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const body = c.req.valid('json')
    const user = c.get('user')

    const existingSite = await db.query.sites.findFirst({
      where: and(eq(sites.id, id), eq(sites.organisationId, user.organisationId)),
    })

    if (!existingSite) {
      return c.json({
        error: 'Site not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const updateData: Partial<typeof sites.$inferInsert> = { updatedAt: new Date() }
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.region !== undefined) updateData.region = body.region
    if (body.coordinates !== undefined) updateData.coordinates = body.coordinates
    if (body.area !== undefined) updateData.area = body.area != null ? String(body.area) : null
    if (body.owner !== undefined) updateData.owner = body.owner

    const [site] = await db.update(sites).set(updateData).where(eq(sites.id, id)).returning()

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

routes.delete('/:id', requireManageOwnOrganization, async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const user = c.get('user')

    const existingSite = await db.query.sites.findFirst({
      where: and(eq(sites.id, id), eq(sites.organisationId, user.organisationId)),
    })

    if (!existingSite) {
      return c.json({
        error: 'Site not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    await db.delete(sites).where(eq(sites.id, id))

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

export default routes
