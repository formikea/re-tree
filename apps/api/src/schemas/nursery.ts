import { z } from 'zod'

// Nursery schema
export const NurserySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Nursery name is required'),
  organisationId: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

// Create nursery request schema
export const CreateNurserySchema = NurserySchema.omit({
  id: true,
  organisationId: true,
  createdAt: true,
  updatedAt: true
})

// Update nursery request schema
export const UpdateNurserySchema = CreateNurserySchema.partial()

// Nursery response schema
export const NurseryResponseSchema = z.object({
  nursery: NurserySchema,
  message: z.string().optional(),
  timestamp: z.string()
})

// Nursery list response schema
export const NurseryListResponseSchema = z.object({
  nurseries: z.array(NurserySchema),
  count: z.number(),
  timestamp: z.string()
}) 