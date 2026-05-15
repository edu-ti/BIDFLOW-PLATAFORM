// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW EVENTS — CloudEvents Envelope
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CloudEvents 1.0 compliant event envelope.
 * Todo evento publicado segue este formato.
 */
export interface CloudEventEnvelope<T = Record<string, unknown>> {
  /** CloudEvents specification version */
  specversion: '1.0';

  /** Unique event identifier (UUID v4) — used for idempotency */
  id: string;

  /** Event producer URI (e.g. "/api/v1/workflow/instances") */
  source: string;

  /** Event type following the pattern: com.bidflow.{context}.{entity}.{action}.v{version} */
  type: string;

  /** ID of the subject/aggregate that generated the event */
  subject?: string;

  /** ISO 8601 timestamp */
  time: string;

  /** Content type of data */
  datacontenttype: 'application/json';

  /** Schema reference (URL) */
  dataschema?: string;

  /** Event payload */
  data: T;

  /** ── Extension attributes ── */
  /** Tenant isolation — always present */
  tenantid: string;

  /** User that triggered the event */
  userid?: string;

  /** Trace correlation ID */
  correlationid?: string;

  /** ID of the event that caused this event (causation chain) */
  causationid?: string;
}

/**
 * Base event payload interface.
 * All event payloads extend this.
 */
export interface BaseEventPayload {
  /** Human-readable summary of the event */
  summary?: string;
}
