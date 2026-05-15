// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Domain Event Base
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base class for all domain events.
 *
 * Domain Events representam FATOS que aconteceram no domínio.
 * São IMUTÁVEIS e nomeados no PASSADO (ex: TenderCaptured, LeadConverted).
 *
 * Props:
 * - eventId: UUID único → idempotência
 * - aggregateId: ID do aggregate que gerou o evento
 * - tenantId: tenant isolation
 * - occurredAt: timestamp de ocorrência
 * - type: CloudEvents type string
 */
export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public abstract readonly type: string;

  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    eventId?: string,
    occurredAt?: Date,
  ) {
    this.eventId = eventId ?? crypto.randomUUID();
    this.occurredAt = occurredAt ?? new Date();
  }

  /** CloudEvents source (origem do evento) */
  get source(): string {
    return `/api/v1/${this.type.split('.').slice(2, -2).join('/')}`;
  }

  /** CloudEvents subject (agreggate ID) */
  get subject(): string {
    return this.aggregateId;
  }

  /** Tenant isolation routing key */
  get routingKey(): string {
    return `${this.tenantId}.${this.type.replace(/\.v\d+$/, '')}`;
  }
}

// Polyfill para ambientes sem crypto
import crypto from 'crypto';
