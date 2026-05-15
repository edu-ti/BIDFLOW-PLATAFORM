// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/events — Observability
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Event metrics labels.
 */
export interface EventMetricLabels {
  event_type: string;
  tenant_id: string;
  status: 'published' | 'consumed' | 'failed' | 'dlq';
}

/**
 * Build metric labels from event data.
 */
export function eventMetricLabels(
  eventType: string,
  tenantId: string,
  status: EventMetricLabels['status'],
): EventMetricLabels {
  return { event_type: eventType, tenant_id: tenantId, status };
}

/**
 * Event processing result.
 */
export type EventProcessingResult = 'success' | 'skipped' | 'retry' | 'failed';

/**
 * Event observability entry.
 */
export interface EventObservabilityEntry {
  eventId: string;
  type: string;
  tenantId: string;
  aggregateId: string;
  result: EventProcessingResult;
  durationMs: number;
  attempt: number;
  error?: string;
  correlationId?: string;
  timestamp: string;
}

/**
 * Creates an observability entry for an event.
 */
export function buildEventObsEntry(
  eventId: string,
  type: string,
  tenantId: string,
  aggregateId: string,
  result: EventProcessingResult,
  durationMs: number,
  attempt: number,
  error?: string,
  correlationId?: string,
): EventObservabilityEntry {
  return {
    eventId,
    type,
    tenantId,
    aggregateId,
    result,
    durationMs,
    attempt,
    error,
    correlationId,
    timestamp: new Date().toISOString(),
  };
}
