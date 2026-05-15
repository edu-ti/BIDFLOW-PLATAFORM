// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Aggregate Root Base
// ═══════════════════════════════════════════════════════════════════════════

import { DomainEvent } from '../events/domain-event';

/**
 * Base class for all aggregate roots.
 * Provides domain event tracking, tenant isolation, and audit fields.
 *
 * Cada aggregate root DEVE:
 * 1. Estender AggregateRoot
 * 2. Definir seus invariantes no construtor/factory
 * 3. Publicar domain events via addDomainEvent()
 * 4. Garantir tenant isolation via tenantId
 */
export abstract class AggregateRoot<TId = string> {
  public abstract readonly id: TId;
  public abstract readonly tenantId: string;
  public abstract readonly createdAt: Date;
  public abstract readonly updatedAt: Date;

  private _domainEvents: DomainEvent[] = [];

  /** Lista de domain events não publicados */
  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /** Adiciona um domain event à fila interna */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /** Adiciona múltiplos events */
  protected addDomainEvents(events: DomainEvent[]): void {
    this._domainEvents.push(...events);
  }

  /** Limpa eventos após publicação (chamado pelo handler) */
  clearEvents(): void {
    this._domainEvents = [];
  }
}
