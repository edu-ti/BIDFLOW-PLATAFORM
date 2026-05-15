// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Tenant Abstractions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tenant context — presente em toda operação do sistema.
 */
export interface TenantContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly role: string;
  readonly permissions: string[];
}

/**
 * Tenant-aware entity mixin.
 * Toda entidade em schema-per-tenant deve ter tenantId.
 */
export interface TenantScoped {
  readonly tenantId: string;
}

/**
 * Tenant-resolved value.
 */
export interface TenantValue<T> {
  value: T;
  tenantId: string;
}

/**
 * Tenant isolation strategy.
 */
export type IsolationStrategy = 'schema-per-tenant' | 'row-level' | 'hybrid';

/**
 * Tenant configuration (desnormalizado para uso no domínio).
 */
export interface TenantConfig {
  tenantId: string;
  locale: string;
  timezone: string;
  currency: string;
  dateFormat: string;
}
