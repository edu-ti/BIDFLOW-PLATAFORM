import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from '../../../domain/common/domain-event';

export interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
}

@Injectable()
export class WorkflowEventPublisher implements IEventPublisher {
  private readonly logger = new Logger(WorkflowEventPublisher.name);

  async publish(event: DomainEvent): Promise<void> {
    this.logger.log(`Event published: ${event.type} [${event.eventId}]`, {
      eventId: event.eventId,
      type: event.type,
      aggregateId: event.aggregateId,
      tenantId: event.tenantId,
    });
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}

@Injectable()
export class RabbitMqEventPublisher implements IEventPublisher {
  private readonly logger = new Logger(RabbitMqEventPublisher.name);

  constructor() {}

  async publish(event: DomainEvent): Promise<void> {
    const routingKey = `${event.tenantId}.${event.type.replace(/\./g, '.')}`;
    this.logger.log(`RabbitMQ publish: ${routingKey}`, {
      routingKey,
      eventId: event.eventId,
      type: event.type,
    });
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
