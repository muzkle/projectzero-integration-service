export function encodeToken(token: string): string {
  return Buffer.from(token, 'utf8').toString('base64');
}

export function decodeToken(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf8');
}

import { createHash } from 'crypto';

export function hashCode(code: string): string {
  return createHash('sha256').update(code.trim().toLowerCase()).digest('hex');
}

export function encodeOAuthState(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeOAuthState<T>(state: string): T {
  return JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as T;
}
