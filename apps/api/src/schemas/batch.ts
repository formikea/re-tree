import { z } from 'zod'

// Batch stage enum
const BatchStageEnum = z.enum(['seed', 'prick', 'pot', 'plant'])

// Batch schema
export const BatchSchema = z.object({
  id: z.number().optional(),
  speciesId: z.number(),
  nurseryId: z.number(),
  origin: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  stage: BatchStageEnum.optional(),
  isOrder: z.boolean().optional(),
  completedAt: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

// Create batch request schema
export const CreateBatchSchema = BatchSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

// Update batch request schema
export const UpdateBatchSchema = z.object({
  speciesId: z.number().optional(),
  nurseryId: z.number().optional(),
  origin: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  stage: BatchStageEnum.optional(),
  isOrder: z.boolean().optional(),
  completedAt: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  notes: z.string().optional()
})

// Batch response schema
export const BatchResponseSchema = z.object({
  batch: BatchSchema,
  message: z.string().optional(),
  timestamp: z.string()
})

// Batch list response schema
export const BatchListResponseSchema = z.object({
  batches: z.array(BatchSchema),
  count: z.number(),
  timestamp: z.string()
}) 