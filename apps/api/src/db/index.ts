import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

export * from './schema.js'

type Db = PostgresJsDatabase<typeof schema>

function createDb(url: string): Db {
  if (url.includes('neon.tech')) {
    return drizzleNeon(neon(url), { schema }) as unknown as Db
  }
  return drizzlePostgres(postgres(url, { max: 10 }), { schema })
}

const globalForDb = globalThis as unknown as {
  db?: Db
  dbUrl?: string
}

export function getDb(): Db {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!globalForDb.db || globalForDb.dbUrl !== url) {
    globalForDb.db = createDb(url)
    globalForDb.dbUrl = url
  }
  return globalForDb.db
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})
