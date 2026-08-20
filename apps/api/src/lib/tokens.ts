import crypto from 'crypto';

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateInvitationToken(): string {
  return generateSecureToken(32);
}

export function generatePasswordResetToken(): string {
  return generateSecureToken(32);
}

export function getTokenExpiryDate(days: number = 7): Date {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

export function isTokenExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true;
  return new Date() > expiryDate;
}
