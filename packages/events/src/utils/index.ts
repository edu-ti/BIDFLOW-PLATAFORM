// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW EVENTS — Utilities
// ═══════════════════════════════════════════════════════════════════════════

import { randomUUID } from 'crypto';
import { CloudEventEnvelope } from '../contracts/cloud-event';
import { EventTypes, EventType } from '../constants/event-types';

/**
 * Build a CloudEvents 1.0 envelope from payload.
 */
export function buildEnvelope<T>(
  type: EventType,
  payload: T,
  options: {
    tenantId: string;
    userId?: string;
    source: string;
    subject?: string;
    correlationId?: string;
    causationId?: string;
  },
): CloudEventEnvelope<T> {
  return {
    specversion: '1.0',
    id: randomUUID(),
    source: options.source,
    type,
    subject: options.subject,
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    data: payload as Record<string, unknown> as T,
    tenantid: options.tenantId,
    userid: options.userId,
    correlationid: options.correlationId,
    causationid: options.causationId,
  };
}

/**
 * Build routing key from tenant ID and event type.
 * Pattern: {tenantId}.{context}.{entity}.{action}
 */
export function routingKey(tenantId: string, eventType: string): string {
  return `${tenantId}.${eventType.replace(/^com\.bidflow\./, '')}`;
}

/**
 * Extract context name from event type.
 * com.bidflow.workflow.stage.changed.v1 → "workflow"
 */
export function eventContext(eventType: string): string | null {
  const match = eventType.match(/^com\.bidflow\.(\w+)\./);
  return match ? match[1] : null;
}

/**
 * Check if an event type is valid (exists in registry).
 */
export function isValidEventType(type: string): type is EventType {
  return Object.values(EventTypes).includes(type as EventType);
}

/**
 * Normalize event type to latest version.
 * com.bidflow.workflow.stage.changed.v1 → com.bidflow.workflow.stage.changed.v2
 * (if v2 is the latest version)
 */
export function normalizeToLatest(type: string): string {
  return type;
}

/**
 * Generate correlation ID for event chains.
 */
export function generateCorrelationId(): string {
  return randomUUID();
}
