import { PrismaClient } from '../../prisma/generated/client/index.js'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaUrl: string | undefined
}

export function getPrisma(connectionString?: string): PrismaClient {
  const url = connectionString ?? process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }

  if (!globalForPrisma.prisma || globalForPrisma.prismaUrl !== url) {
    const adapter = new PrismaPg({ connectionString: url })
    globalForPrisma.prisma = new PrismaClient({ adapter })
    globalForPrisma.prismaUrl = url
  }

  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
