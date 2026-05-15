// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW SDK — Tracing (OpenTelemetry abstraction)
// ═══════════════════════════════════════════════════════════════════════════

import { randomUUID } from 'crypto';

/**
 * Span attributes.
 */
export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Tracing span interface.
 */
export interface Span {
  setAttributes(attrs: SpanAttributes): void;
  setAttribute(key: string, value: string | number | boolean): void;
  addEvent(name: string, attrs?: SpanAttributes): void;
  setStatus(status: 'ok' | 'error', description?: string): void;
  end(): void;
}

/**
 * Tracer interface — abstraction over OpenTelemetry.
 */
export interface Tracer {
  startSpan(name: string, attrs?: SpanAttributes): Span;
  withSpan<T>(name: string, fn: () => Promise<T>, attrs?: SpanAttributes): Promise<T>;
}

class NoopSpan implements Span {
  setAttributes(_attrs: SpanAttributes): void {}
  setAttribute(_key: string, _value: string | number | boolean): void {}
  addEvent(_name: string, _attrs?: SpanAttributes): void {}
  setStatus(_status: 'ok' | 'error', _description?: string): void {}
  end(): void {}
}

/**
 * No-op tracer (no tracing enabled).
 */
export class NoopTracer implements Tracer {
  startSpan(_name: string, _attrs?: SpanAttributes): Span {
    return new NoopSpan();
  }

  async withSpan<T>(_name: string, fn: () => Promise<T>, _attrs?: SpanAttributes): Promise<T> {
    return fn();
  }
}

/**
 * Correlation ID helpers.
 */
export function generateTraceId(): string {
  return randomUUID();
}

export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * W3C Trace Context headers.
 */
export interface TraceHeaders {
  traceparent: string;
  tracestate?: string;
}

/**
 * Build W3C traceparent header.
 */
export function buildTraceparent(traceId: string, spanId: string): string {
  return `00-${traceId}-${spanId}-01`;
}

/**
 * Extract trace ID from traceparent.
 */
export function extractTraceId(traceparent: string): string | null {
  const match = traceparent.match(/^00-([a-f0-9]{32})-/);
  return match ? match[1] : null;
}
