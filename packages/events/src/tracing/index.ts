// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/events — Event Tracing (OpenTelemetry)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Span attributes for events.
 */
export interface EventSpanAttributes {
  'event.id': string;
  'event.type': string;
  'event.tenant_id': string;
  'event.aggregate_id': string;
  'event.correlation_id'?: string;
  'messaging.system': 'rabbitmq' | 'kafka';
  'messaging.destination': string;
  'messaging.destination_kind': 'queue' | 'topic';
}

/**
 * Creates span attributes from event data.
 */
export function buildEventSpanAttrs(
  eventId: string,
  type: string,
  tenantId: string,
  aggregateId: string,
  correlationId?: string,
): EventSpanAttributes {
  return {
    'event.id': eventId,
    'event.type': type,
    'event.tenant_id': tenantId,
    'event.aggregate_id': aggregateId,
    'event.correlation_id': correlationId,
    'messaging.system': 'rabbitmq',
    'messaging.destination': type,
    'messaging.destination_kind': 'topic',
  };
}

/**
 * Trace context propagation headers.
 */
export interface TracePropagationHeaders {
  traceparent?: string;
  tracestate?: string;
  ce_correlationid?: string;
  ce_causationid?: string;
}

/**
 * Builds propagation headers from event metadata.
 */
export function buildPropagationHeaders(
  correlationId: string,
  causationId?: string,
  traceparent?: string,
): TracePropagationHeaders {
  const headers: TracePropagationHeaders = {};
  if (traceparent) headers.traceparent = traceparent;
  if (correlationId) headers.ce_correlationid = correlationId;
  if (causationId) headers.ce_causationid = causationId;
  return headers;
}
