import { z } from 'zod'

// Season enum
const SeasonEnum = z.enum(['spring', 'summer', 'autumn', 'winter'])

// Season schema
export const SeasonSchema = z.object({
  id: z.number().optional(),
  siteId: z.number(),
  organisationId: z.number(),
  year: z.number().int().min(1900).max(2100),
  season: SeasonEnum,
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

// Create season request schema
export const CreateSeasonSchema = SeasonSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

// Update season request schema
export const UpdateSeasonSchema = CreateSeasonSchema.partial()

// Bulk create season request schema
export const BulkCreateSeasonSchema = z.object({
  siteId: z.number(),
  organisationId: z.number(),
  year: z.number().int().min(1900).max(2100),
  season: SeasonEnum,
  notes: z.string().optional(),
  addToAllSites: z.boolean().default(false)
})

// Season response schema
export const SeasonResponseSchema = z.object({
  season: SeasonSchema,
  message: z.string().optional(),
  timestamp: z.string()
})

// Bulk season response schema
export const BulkSeasonResponseSchema = z.object({
  seasons: z.array(SeasonSchema),
  created: z.number(),
  skipped: z.number(),
  message: z.string().optional(),
  timestamp: z.string()
})

// Season list response schema
export const SeasonListResponseSchema = z.object({
  seasons: z.array(SeasonSchema),
  count: z.number(),
  timestamp: z.string()
}) 