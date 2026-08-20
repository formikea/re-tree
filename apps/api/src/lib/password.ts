import bcrypt from 'bcryptjs'

const PBKDF2_ITERATIONS = 100_000
const PBKDF2_PREFIX = 'pbkdf2$sha256$'

function bytesToB64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const byte of arr) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function b64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt.buffer as ArrayBuffer,
      iterations,
    },
    key,
    256,
  )
  return new Uint8Array(bits)
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return diff === 0
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const derived = await pbkdf2(password, salt, PBKDF2_ITERATIONS)
  return `${PBKDF2_PREFIX}${PBKDF2_ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(derived)}`
}

async function verifyPbkdf2(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  const iterations = Number(parts[2])
  const salt = parts[3]
  const hash = parts[4]
  if (!Number.isFinite(iterations) || !salt || !hash) return false
  const derived = await pbkdf2(password, b64ToBytes(salt), iterations)
  return timingSafeEqual(derived, b64ToBytes(hash))
}

export async function verifyPassword(password: string, stored: string): Promise<{ ok: boolean; shouldRehash: boolean }> {
  if (stored.startsWith(PBKDF2_PREFIX)) {
    return { ok: await verifyPbkdf2(password, stored), shouldRehash: false }
  }

  if (stored.startsWith('$2')) {
    const ok = await bcrypt.compare(password, stored)
    return { ok, shouldRehash: ok }
  }

  return { ok: false, shouldRehash: false }
}
