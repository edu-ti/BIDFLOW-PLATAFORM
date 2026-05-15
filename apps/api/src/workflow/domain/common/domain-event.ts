import { randomUUID } from 'crypto';

export abstract class DomainEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly tenantId: string;
  readonly occurredAt: Date;
  abstract readonly type: string;

  constructor(aggregateId: string, tenantId: string) {
    this.eventId = randomUUID();
    this.aggregateId = aggregateId;
    this.tenantId = tenantId;
    this.occurredAt = new Date();
  }
}
