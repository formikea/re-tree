import app from './index.js'

type Env = {
  DATABASE_URL?: string
  JWT_SECRET?: string
  REFRESH_TOKEN_SECRET?: string
  INVITATION_SECRET?: string
  FRONTEND_URL?: string
  NODE_ENV?: string
  RESEND_API_KEY?: string
  RESET_PASSWORD_SECRET?: string
  SMTP_FROM?: string
  SMTP_FROM_NAME?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
}

function applyEnv(env: Env) {
  if (env.DATABASE_URL) {
    process.env.DATABASE_URL = env.DATABASE_URL
  }

  const stringKeys = [
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'INVITATION_SECRET',
    'FRONTEND_URL',
    'NODE_ENV',
    'RESEND_API_KEY',
    'RESET_PASSWORD_SECRET',
    'SMTP_FROM',
    'SMTP_FROM_NAME',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ] as const

  for (const key of stringKeys) {
    const value = env[key]
    if (typeof value === 'string' && value.length > 0) {
      process.env[key] = value
    }
  }
}

export default {
  fetch(request: Request, env: Env) {
    applyEnv(env)
    return app.fetch(request, env)
  },
}
