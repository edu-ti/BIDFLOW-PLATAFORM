// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Domain Observability
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Domain event monitor — registra eventos de domínio para observabilidade.
 */
export class DomainEventMonitor {
  private events: Array<{ type: string; aggregateId: string; timestamp: Date }> = [];

  record(type: string, aggregateId: string): void {
    this.events.push({ type, aggregateId, timestamp: new Date() });
  }

  get all(): ReadonlyArray<{ type: string; aggregateId: string; timestamp: Date }> {
    return [...this.events];
  }

  count(): number {
    return this.events.length;
  }

  clear(): void {
    this.events = [];
  }
}

/**
 * Domain metric — contadores e métricas do domínio.
 */
export class DomainMetric {
  private counters = new Map<string, number>();
  private timings = new Map<string, number[]>();

  increment(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  timing(name: string, durationMs: number): void {
    const values = this.timings.get(name) ?? [];
    values.push(durationMs);
    this.timings.set(name, values);
  }

  getCounter(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  getAverageTiming(name: string): number {
    const values = this.timings.get(name);
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  reset(): void {
    this.counters.clear();
    this.timings.clear();
  }
}
