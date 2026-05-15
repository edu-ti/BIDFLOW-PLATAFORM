// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW EVENTS — Publisher abstraction
// ═══════════════════════════════════════════════════════════════════════════

import { CloudEventEnvelope } from '../contracts/cloud-event';

/**
 * Publisher interface — abstracts over RabbitMQ, Kafka, etc.
 * Modules depend on this interface, never on a specific broker.
 */
export interface IEventPublisher {
  /** Publish a single event */
  publish<T>(envelope: CloudEventEnvelope<T>): Promise<void>;

  /** Publish multiple events atomically (best-effort) */
  publishMany<T>(envelopes: CloudEventEnvelope<T>[]): Promise<void>;

  /** Current broker type */
  readonly brokerType: 'rabbitmq' | 'kafka' | 'in-memory';
}

/**
 * Publisher routing configuration.
 */
export interface PublishOptions {
  /** RabbitMQ routing key or Kafka topic */
  routingKey: string;

  /** Priority (0-9, higher = more urgent) */
  priority?: number;

  /** Message TTL in milliseconds */
  ttl?: number;

  /** Delivery mode: persistent (default) or transient */
  deliveryMode?: 'persistent' | 'transient';
}

/**
 * Publish result.
 */
export interface PublishResult {
  success: boolean;
  eventId: string;
  error?: string;
}
