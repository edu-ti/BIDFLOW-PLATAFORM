import { ValueObject } from '../abstractions/value-object';
import { BusinessRuleException } from '../exceptions';

export class BidAmount extends ValueObject {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'BRL'
  ) {
    super();
    if (amount < 0) {
      throw new BusinessRuleException('Amount cannot be negative', 'INVALID_AMOUNT');
    }
  }

  isLessThan(other: BidAmount): boolean {
    if (this.currency !== other.currency) {
      throw new BusinessRuleException('Cannot compare different currencies', 'CURRENCY_MISMATCH');
    }
    return this.amount < other.amount;
  }

  isLessThanOrEqual(other: BidAmount): boolean {
    if (this.currency !== other.currency) {
      throw new BusinessRuleException('Cannot compare different currencies', 'CURRENCY_MISMATCH');
    }
    return this.amount <= other.amount;
  }

  subtract(other: BidAmount): BidAmount {
    if (this.currency !== other.currency) {
      throw new BusinessRuleException('Cannot subtract different currencies', 'CURRENCY_MISMATCH');
    }
    return new BidAmount(this.amount - other.amount, this.currency);
  }

  hasMinimumDecrement(previousAmount: BidAmount, minDecrement: BidAmount): boolean {
    if (this.currency !== previousAmount.currency || this.currency !== minDecrement.currency) {
      throw new BusinessRuleException('Cannot calculate decrement with different currencies', 'CURRENCY_MISMATCH');
    }
    return this.amount <= (previousAmount.amount - minDecrement.amount);
  }
}
