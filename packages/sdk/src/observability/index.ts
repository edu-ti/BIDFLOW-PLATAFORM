// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW SDK — Observability Helpers
// ═══════════════════════════════════════════════════════════════════════════

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  tenantId?: string;
  userId?: string;
  correlationId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

/**
 * Logger interface — abstraction over pino / NestJS Logger / console.
 */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}

/**
 * Console logger (development default).
 */
export class ConsoleLogger implements Logger {
  private toEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };
  }

  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(JSON.stringify(this.toEntry('debug', message, context)));
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.info(JSON.stringify(this.toEntry('info', message, context)));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(JSON.stringify(this.toEntry('warn', message, context)));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    console.error(JSON.stringify({
      ...this.toEntry('error', message, context),
      error: error ? { message: error.message, stack: error.stack } : undefined,
    }));
  }
}

/**
 * Metrics helper.
 */
export interface MetricLabels {
  [key: string]: string;
}

export interface MetricsCollector {
  increment(name: string, value?: number, labels?: MetricLabels): void;
  gauge(name: string, value: number, labels?: MetricLabels): void;
  histogram(name: string, value: number, labels?: MetricLabels): void;
  timing<T>(name: string, fn: () => Promise<T>, labels?: MetricLabels): Promise<T>;
}

/**
 * No-op metrics collector (default).
 */
export class NoopMetrics implements MetricsCollector {
  increment(_name: string, _value?: number, _labels?: MetricLabels): void {}
  gauge(_name: string, _value: number, _labels?: MetricLabels): void {}
  histogram(_name: string, _value: number, _labels?: MetricLabels): void {}
  async timing<T>(_name: string, fn: () => Promise<T>, _labels?: MetricLabels): Promise<T> {
    return fn();
  }
}
