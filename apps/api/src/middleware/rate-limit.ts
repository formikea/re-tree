import type { Context, MiddlewareHandler } from 'hono'

export type RateLimitBinding = {
  limit: (options: { key: string }) => Promise<{ success: boolean }>
}

type EnvWithRateLimit = {
  AUTH_RATE_LIMITER?: RateLimitBinding
}

/** Local Node fallback (per-process). Worker uses the Cloudflare binding. */
const localHits = new Map<string, { count: number; resetAt: number }>()

const LOCAL_LIMIT = 15
const LOCAL_PERIOD_SEC = 60

async function localLimit(key: string): Promise<boolean> {
  const now = Date.now()
  const entry = localHits.get(key)
  if (!entry || entry.resetAt <= now) {
    localHits.set(key, { count: 1, resetAt: now + LOCAL_PERIOD_SEC * 1000 })
    return true
  }
  if (entry.count >= LOCAL_LIMIT) return false
  entry.count += 1
  return true
}

function clientIp(c: Context): string {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-real-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

/**
 * Abuse protection for unauthenticated auth flows.
 * Production: Cloudflare Rate Limiting binding (15 / 60s per colo, keyed by IP+path).
 * Local Node: in-memory window with the same numbers.
 */
export const authRateLimit: MiddlewareHandler = async (c, next) => {
  const path = new URL(c.req.url).pathname
  const key = `auth:${clientIp(c)}:${path}`
  const binding = (c.env as EnvWithRateLimit | undefined)?.AUTH_RATE_LIMITER

  const success = binding
    ? (await binding.limit({ key })).success
    : await localLimit(key)

  if (!success) {
    c.header('Retry-After', String(LOCAL_PERIOD_SEC))
    return c.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again shortly.',
        timestamp: new Date().toISOString(),
      },
      429,
    )
  }

  await next()
  return
}
