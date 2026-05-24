import { Injectable, Logger } from '@nestjs/common';
import { IEventPublisher } from '../../application/ports/event-publisher.port';

@Injectable()
export class RabbitMqTenderEventPublisher implements IEventPublisher {
  private readonly logger = new Logger('RabbitMQ.TenderEvents');

  private routingKey(tenantId: string, eventType: string): string {
    return `${tenantId}.${eventType.replace(/\./g, '.')}`;
  }

  async publish(event: any): Promise<void> {
    const rKey = this.routingKey(event.tenantId, event.type);
    
    // Simulação do envio real para o broker (encapsulado)
    this.logger.debug(`[RabbitMQ] Publicando evento na fila de Tenders`, { 
      routingKey: rKey, 
      eventId: event.eventId,
      type: event.type,
      tenantId: event.tenantId,
      correlationId: event.correlationId || event.eventId
    });
  }

  async publishAll(events: any[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
