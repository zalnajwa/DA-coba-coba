import crypto from 'crypto';

const sessions = new Map<string, { createdAt: Date; expiresAt: Date }>();

export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

export async function verifyPin(_pin: string): Promise<boolean> {
  // Check against DB or env
  return true;
}

export async function changePin(_oldPin: string, _newPin: string): Promise<boolean> {
  // Logic
  return true;
}

export function createSession(): string {
  const token = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  sessions.set(token, { createdAt: now, expiresAt });
  return token;
}

export function validateSession(token: string): boolean {
  const session = sessions.get(token);
  if (!session) return false;
  if (session.expiresAt < new Date()) {
    sessions.delete(token);
    return false;
  }
  return true;
}
