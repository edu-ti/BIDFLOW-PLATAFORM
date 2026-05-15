// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Audit Abstractions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Audit info — presente em toda entidade.
 */
export interface AuditInfo {
  readonly createdAt: Date;
  readonly createdBy: string;
  readonly updatedAt: Date;
  readonly updatedBy?: string;
}

/**
 * Soft-delete audit.
 */
export interface SoftDeletable {
  readonly deletedAt: Date | null;
  readonly deletedBy: string | null;
  readonly deletedReason: string | null;
}

/**
 * Versionable entity.
 */
export interface Versionable {
  readonly version: number;
}

/**
 * Audit event types.
 */
export type AuditEventType =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'SOFT_DELETED'
  | 'RESTORED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'ACTION_EXECUTED';

/**
 * Audit log entry.
 */
export interface AuditEntry {
  eventId: string;
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  tenantId: string;
  userId: string;
  timestamp: Date;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
}
