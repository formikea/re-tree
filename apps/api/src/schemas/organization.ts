import { z } from 'zod'

// Organization schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Name too long')
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Name too long').optional()
})

// Organization user schemas
export const createOrganizationUserSchema = z.object({
  name: z.string().max(255, 'Name too long').optional(),
  email: z.string().email('Invalid email format'),
  role: z.enum(['USER', 'MANAGER', 'SUPER_ADMIN']).optional().default('USER'),
  notes: z.string().max(1000, 'Notes too long').optional()
})

export const updateOrganizationUserSchema = z.object({
  name: z.string().max(255, 'Name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['USER', 'MANAGER', 'SUPER_ADMIN']).optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
})

export type CreateOrganization = z.infer<typeof createOrganizationSchema>
export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>
export type CreateOrganizationUser = z.infer<typeof createOrganizationUserSchema>
export type UpdateOrganizationUser = z.infer<typeof updateOrganizationUserSchema>