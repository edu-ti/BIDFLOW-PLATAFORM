// ═══════════════════════════════════════════════════════════════════════════
// BIDFLOW SDK — Retry Helpers
// ═══════════════════════════════════════════════════════════════════════════

export interface RetryConfig {
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  backoffMultiplier: number;
  retryableStatuses?: number[];
  retryableErrors?: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialBackoffMs: 1000,
  maxBackoffMs: 30000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate backoff delay for a given attempt.
 * Uses exponential backoff with jitter.
 */
export function calculateBackoff(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = Math.min(
    config.initialBackoffMs * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxBackoffMs,
  );
  const jitter = Math.random() * delay * 0.1;
  return delay + jitter;
}

/**
 * Check if an error is retryable.
 */
export function isRetryable(error: unknown, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  if (error instanceof ResponseError) {
    return config.retryableStatuses?.includes(error.status) ?? false;
  }
  if (error instanceof Error) {
    return config.retryableErrors?.some(e => error.message.includes(e)) ?? false;
  }
  return false;
}

/**
 * Retry wrapper — executes a function with retry logic.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < config.maxAttempts && isRetryable(error, config)) {
        const delay = calculateBackoff(attempt, config);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Response error with HTTP status code.
 */
export class ResponseError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ResponseError';
  }
}
