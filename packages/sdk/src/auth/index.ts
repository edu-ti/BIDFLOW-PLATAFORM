// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW SDK — Auth Helpers
// ═══════════════════════════════════════════════════════════════════════════

import { JwtPayload, TokenPair, TenantContext } from '../types';

/**
 * Decode a JWT token payload without verification.
 * For verification, use the server-side AuthGuard.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now();
}

/**
 * Extract TenantContext from a JWT token.
 */
export function extractTenantContext(token: string): TenantContext | null {
  const payload = decodeJwt(token);
  if (!payload) return null;
  return {
    tenantId: payload.tenantId,
    userId: payload.sub,
    role: payload.roles?.[0] ?? 'USER',
  };
}

/**
 * Extract permissions from JWT.
 */
export function extractPermissions(token: string): string[] {
  const payload = decodeJwt(token);
  return payload?.permissions ?? [];
}

/**
 * Build authorization header value.
 */
export function bearerToken(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Check if user has a specific permission.
 */
export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.some(p => {
    if (p.endsWith('.*')) {
      return required.startsWith(p.slice(0, -1));
    }
    return p === required;
  });
}

/**
 * Refresh token flow helper.
 * Returns true if the token was refreshed successfully.
 */
export async function refreshAccessToken(
  refreshFn: () => Promise<TokenPair>,
  onRefreshed: (pair: TokenPair) => void,
): Promise<boolean> {
  try {
    const pair = await refreshFn();
    onRefreshed(pair);
    return true;
  } catch {
    return false;
  }
}
