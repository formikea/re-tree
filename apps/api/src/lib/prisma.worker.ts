import { PrismaClient } from '../../prisma/generated/client/wasm.js'
import { createPrisma } from './prisma-factory.js'

export const { prisma, getPrisma } = createPrisma(
  PrismaClient as ConstructorParameters<typeof createPrisma>[0],
)
