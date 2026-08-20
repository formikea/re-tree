import { PrismaPg } from '@prisma/adapter-pg'

type PrismaClientCtor = new (args: { adapter: PrismaPg }) => {
  $disconnect: () => Promise<void>
  [key: string]: unknown
}

export function createPrisma(PrismaClient: PrismaClientCtor) {
  const globalForPrisma = globalThis as unknown as {
    prisma: InstanceType<PrismaClientCtor> | undefined
    prismaUrl: string | undefined
  }

  function getPrisma(connectionString?: string) {
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

  const prisma = new Proxy({} as InstanceType<PrismaClientCtor>, {
    get(_target, prop, receiver) {
      const client = getPrisma()
      const value = Reflect.get(client as object, prop, receiver)
      return typeof value === 'function'
        ? (value as (...args: unknown[]) => unknown).bind(client)
        : value
    },
  })

  return { prisma, getPrisma }
}
