// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Shared Value Objects
// ═══════════════════════════════════════════════════════════════════════════

import { ValueObject } from '../abstractions/value-object';

/**
 * Money value object.
 */
export class Money extends ValueObject {
  constructor(
    readonly amount: number,
    readonly currency: string = 'BRL',
  ) {
    super();
    if (amount < 0) throw new Error('Amount must be positive');
    if (!['BRL', 'USD', 'EUR'].includes(currency)) throw new Error(`Invalid currency: ${currency}`);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('Currency mismatch');
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('Currency mismatch');
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }
}

/**
 * Email value object.
 */
export class Email extends ValueObject {
  constructor(readonly value: string) {
    super();
    const normalized = value.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error(`Invalid email: ${value}`);
    this.value = normalized;
  }
}

/**
 * UUID identifier value object.
 */
export class Identifier extends ValueObject {
  constructor(readonly value: string) {
    super();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      throw new Error(`Invalid UUID: ${value}`);
    }
  }
}

/**
 * Percentage value object.
 */
export class Percentage extends ValueObject {
  constructor(readonly value: number) {
    super();
    if (value < 0 || value > 100) throw new Error('Percentage must be between 0 and 100');
  }
}

/**
 * Date range value object.
 */
export class DateRange extends ValueObject {
  constructor(
    readonly start: Date,
    readonly end: Date,
  ) {
    super();
    if (start >= end) throw new Error('Start date must be before end date');
  }

  contains(date: Date): boolean {
    return date >= this.start && date <= this.end;
  }
}

/**
 * Address value object.
 */
export class Address extends ValueObject {
  constructor(
    readonly street: string,
    readonly number: string,
    readonly complement: string | null,
    readonly neighborhood: string,
    readonly city: string,
    readonly state: string,
    readonly zipCode: string,
    readonly country: string = 'BR',
  ) { super(); }
}
