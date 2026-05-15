// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Shared Types
// ═══════════════════════════════════════════════════════════════════════════

export type UUID = string;
export type TenantId = UUID;
export type UserId = UUID;
export type EntityId = UUID;

export type Status =
  | 'PENDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

export type Language = 'pt-BR' | 'en-US' | 'es-ES';

/**
 * Result pattern — functional error handling.
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly success = true as const;
  constructor(readonly value: T) {}
}

export class Failure<E = Error> {
  readonly success = false as const;
  constructor(readonly error: E) {}
}

/**
 * Guard clause helpers.
 */
export class Guard {
  static againstEmptyString(value: string, field: string): void {
    if (value.trim().length === 0) {
      throw new Error(`${field} must not be empty`);
    }
  }

  static againstNegative(value: number, field: string): void {
    if (value < 0) throw new Error(`${field} must not be negative`);
  }

  static againstNull(value: unknown, field: string): void {
    if (value === null || value === undefined) {
      throw new Error(`${field} must not be null`);
    }
  }
}
