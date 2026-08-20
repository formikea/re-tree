import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './index.js'

const port = parseInt(process.env.PORT || '5000', 10)

console.log(`Re-Tree API is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
