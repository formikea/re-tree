import { z } from 'zod'

// Login request schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

// Refresh token request schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

// Reset password request schema
export const resetPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Organization schema
export const organisationSchema = z.object({
  id: z.number(),
  name: z.string()
})

// Login response schema
export const loginResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string().nullable(),
    organisationId: z.number(),
    role: z.enum(['USER', 'MANAGER', 'SUPER_ADMIN']),
    organisationName: z.string(),
    createdAt: z.string()
  }),
  message: z.string(),
  timestamp: z.string()
})

// Refresh token response schema
export const refreshTokenResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  message: z.string(),
  timestamp: z.string()
})

// Error response schema
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  timestamp: z.string()
})

export type LoginRequest = z.infer<typeof loginSchema>
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema> 