// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW EVENTS — Consumer abstraction
// ═══════════════════════════════════════════════════════════════════════════

import { CloudEventEnvelope } from '../contracts/cloud-event';

/**
 * Consumer handler signature.
 */
export type EventHandler<T = Record<string, unknown>> = (
  event: CloudEventEnvelope<T>,
) => Promise<void>;

/**
 * Consumer configuration.
 */
export interface ConsumerConfig {
  /** Queue name (RabbitMQ) or consumer group (Kafka) */
  queue: string;

  /** Event types this consumer handles */
  eventTypes: string[];

  /** Number of concurrent consumers */
  concurrency?: number;

  /** Dead-letter exchange/topic */
  dlq?: string;

  /** Maximum retry attempts before DLQ */
  maxRetries?: number;

  /** Handler function */
  handler: EventHandler;
}

/**
 * Consumer group — logical grouping of consumers.
 */
export interface ConsumerGroup {
  name: string;
  consumers: ConsumerConfig[];
}

/**
 * Idempotency check result.
 */
export type IdempotencyResult = 'processed' | 'skipped' | 'retry';

/**
 * Idempotency checker interface.
 */
export interface IIdempotencyChecker {
  /** Check if event was already processed */
  isProcessed(eventId: string): Promise<boolean>;

  /** Mark event as processed */
  markProcessed(eventId: string, ttl?: number): Promise<void>;

  /** Get idempotency result */
  check(eventId: string): Promise<IdempotencyResult>;
}
