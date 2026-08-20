import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, desc, count } from 'drizzle-orm'
import { db } from '../db/index.js'
import { nurseries, batches } from '../db/schema.js'
import {
  CreateNurserySchema,
  UpdateNurserySchema
} from '../schemas/nursery.js'
import { authenticate } from '../middleware/auth.js'

const routes = new Hono()

routes.use('*', authenticate)

routes.get('/', async (c) => {
  try {
    const user = c.get('user')

    const nurseryRows = await db.query.nurseries.findMany({
      where: eq(nurseries.organisationId, user.organisationId),
      orderBy: desc(nurseries.createdAt),
    })

    return c.json({
      nurseries: nurseryRows,
      count: nurseryRows.length,
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

routes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const user = c.get('user')

    const nursery = await db.query.nurseries.findFirst({
      where: and(eq(nurseries.id, id), eq(nurseries.organisationId, user.organisationId)),
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

routes.post('/', zValidator('json', CreateNurserySchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')

    const [nursery] = await db.insert(nurseries).values({
      name: body.name,
      organisationId: user.organisationId,
    }).returning()

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

routes.put('/:id', zValidator('json', UpdateNurserySchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const body = c.req.valid('json')
    const user = c.get('user')

    const existingNursery = await db.query.nurseries.findFirst({
      where: and(eq(nurseries.id, id), eq(nurseries.organisationId, user.organisationId)),
    })

    if (!existingNursery) {
      return c.json({
        error: 'Nursery not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const updateData: Partial<typeof nurseries.$inferInsert> = { updatedAt: new Date() }
    if (body.name !== undefined) {
      updateData.name = body.name
    }

    const [nursery] = await db.update(nurseries).set(updateData).where(eq(nurseries.id, id)).returning()

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

routes.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') ?? '', 10)
    const user = c.get('user')

    const existingNursery = await db.query.nurseries.findFirst({
      where: and(eq(nurseries.id, id), eq(nurseries.organisationId, user.organisationId)),
    })

    if (!existingNursery) {
      return c.json({
        error: 'Nursery not found',
        timestamp: new Date().toISOString()
      }, 404)
    }

    const [batchRow] = await db.select({ value: count() }).from(batches).where(eq(batches.nurseryId, id))
    const batchesCount = Number(batchRow?.value ?? 0)

    if (batchesCount > 0) {
      return c.json({
        error: 'Cannot delete nursery with existing batches',
        timestamp: new Date().toISOString()
      }, 400)
    }

    await db.delete(nurseries).where(eq(nurseries.id, id))

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

export default routes
