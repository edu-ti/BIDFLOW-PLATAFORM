// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW SDK — Tenant Context Helpers
// ═══════════════════════════════════════════════════════════════════════════

import { TenantContext } from '../types';

/**
 * Tenant context provider interface.
 * Can be implemented with AsyncLocalStorage, request-scoped DI, etc.
 */
export interface TenantContextProvider {
  getCurrent(): TenantContext | null;
  set(context: TenantContext): void;
  clear(): void;
}

/**
 * In-memory tenant context provider (for testing / single-tenant).
 */
export class InMemoryTenantProvider implements TenantContextProvider {
  private context: TenantContext | null = null;

  getCurrent(): TenantContext | null {
    return this.context;
  }

  set(context: TenantContext): void {
    this.context = context;
  }

  clear(): void {
    this.context = null;
  }
}

/**
 * Builds tenant-aware headers for API requests.
 */
export function tenantHeaders(context: TenantContext): Record<string, string> {
  return {
    'X-Tenant-Id': context.tenantId,
    'X-User-Id': context.userId,
  };
}

/**
 * Builds a tenant-prefixed cache key.
 */
export function tenantCacheKey(tenantId: string, key: string): string {
  return `${tenantId}:${key}`;
}

/**
 * Builds a tenant-prefixed routing key for events.
 */
export function tenantRoutingKey(tenantId: string, eventType: string): string {
  return `${tenantId}.${eventType}`;
}

/**
 * Validate that a tenant ID matches the expected tenant.
 * Throws if mismatch.
 */
export function assertTenantMatch(actual: string, expected: string): void {
  if (actual !== expected) {
    throw new Error(`Tenant mismatch: expected ${expected}, got ${actual}`);
  }
}
