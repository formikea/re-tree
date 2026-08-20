import { z } from 'zod'

// Site schema
export const SiteSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Site name is required'),
  region: z.string().optional(),
  coordinates: z.string().optional(),
  area: z.number().optional(),
  owner: z.string().optional(),
  type: z.string().optional(),
  notes: z.string().optional(),
  organisationId: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

// Create site request schema
export const CreateSiteSchema = SiteSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

// Update site request schema
export const UpdateSiteSchema = CreateSiteSchema.partial()

// Site response schema
export const SiteResponseSchema = z.object({
  site: SiteSchema,
  message: z.string().optional(),
  timestamp: z.string()
})

// Site list response schema
export const SiteListResponseSchema = z.object({
  sites: z.array(SiteSchema),
  count: z.number(),
  timestamp: z.string()
}) 