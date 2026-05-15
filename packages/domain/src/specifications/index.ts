// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Specification Pattern
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Specification pattern — encapsula regras de negócio reutilizáveis.
 *
 * Uso:
 *   const isActiveTender = new TenderIsActiveSpec();
 *   const isHighValue = new TenderMinValueSpec(500000);
 *   const eligible = isActiveTender.and(isHighValue);
 *
 *   if (eligible.isSatisfiedBy(tender)) { ... }
 */
export abstract class Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

export class AndSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>,
  ) { super(); }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

export class OrSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>,
  ) { super(); }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

export class NotSpecification<T> extends Specification<T> {
  constructor(private readonly spec: Specification<T>) { super(); }
  isSatisfiedBy(candidate: T): boolean { return !this.spec.isSatisfiedBy(candidate); }
}
