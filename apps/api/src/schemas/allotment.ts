import { z } from 'zod'

// Allotment schema
export const AllotmentSchema = z.object({
  id: z.number().optional(),
  seasonId: z.number(),
  batchId: z.number(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

// Create allotment request schema
export const CreateAllotmentSchema = AllotmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

// Bulk create allotments request schema
export const BulkCreateAllotmentSchema = z.object({
  allotments: z.array(CreateAllotmentSchema).min(1, 'At least one allotment is required').max(100, 'Maximum 100 allotments per request')
})

// Update allotment request schema
export const UpdateAllotmentSchema = CreateAllotmentSchema.partial()

// Allotment response schema
export const AllotmentResponseSchema = z.object({
  allotment: AllotmentSchema,
  message: z.string().optional(),
  timestamp: z.string()
})

// Bulk allotment response schema
export const BulkAllotmentResponseSchema = z.object({
  allotments: z.array(AllotmentSchema),
  message: z.string().optional(),
  timestamp: z.string()
})

// Allotment list response schema
export const AllotmentListResponseSchema = z.object({
  allotments: z.array(AllotmentSchema),
  count: z.number(),
  timestamp: z.string()
}) 