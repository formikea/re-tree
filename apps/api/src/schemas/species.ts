import { z } from 'zod'

// Species schema
export const SpeciesSchema = z.object({
  id: z.number().optional(),
  botanicalName: z.string().optional(),
  commonName: z.string().optional(),
  maoriName: z.string().optional(),
  threatenedSpecies: z.boolean().default(false),
  treesThatCount: z.boolean().default(false),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

// Create species request schema
export const CreateSpeciesSchema = SpeciesSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

// Update species request schema
export const UpdateSpeciesSchema = CreateSpeciesSchema.partial()

// Species response schema
export const SpeciesResponseSchema = z.object({
  species: SpeciesSchema,
  message: z.string().optional(),
  timestamp: z.string()
})

// Species list response schema
export const SpeciesListResponseSchema = z.object({
  species: z.array(SpeciesSchema),
  count: z.number(),
  timestamp: z.string()
}) 