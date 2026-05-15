// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Entity Base
// ═══════════════════════════════════════════════════════════════════════════

import { DomainEvent } from '../events/domain-event';

/**
 * Base class for entities (non-root).
 *
 * Entity possui identidade contínua (id).
 * Diferente de Value Object, pode ser mutável e tem ciclo de vida.
 */
export abstract class Entity<TId = string> {
  public abstract readonly id: TId;
  public abstract readonly tenantId: string;

  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
