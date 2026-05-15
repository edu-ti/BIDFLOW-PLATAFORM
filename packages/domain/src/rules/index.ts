// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Business Rules Engine
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Business Rule interface.
 * Cada regra encapsula UMA condição de negócio.
 */
export interface BusinessRule {
  readonly code: string;
  readonly description: string;
  readonly errorMessage: string;
  isSatisfied(): boolean;
}

/**
 * Rule set — grupo de regras avaliadas em conjunto.
 */
export class RuleSet {
  private rules: BusinessRule[] = [];

  add(rule: BusinessRule): void {
    this.rules.push(rule);
  }

  addAll(rules: BusinessRule[]): void {
    this.rules.push(...rules);
  }

  checkAll(): RuleValidationResult {
    const violations: BusinessRule[] = [];
    for (const rule of this.rules) {
      if (!rule.isSatisfied()) {
        violations.push(rule);
      }
    }
    return {
      valid: violations.length === 0,
      violations,
      messages: violations.map(v => `[${v.code}] ${v.errorMessage}`),
    };
  }

  checkFirst(): BusinessRule | null {
    for (const rule of this.rules) {
      if (!rule.isSatisfied()) return rule;
    }
    return null;
  }

  get count(): number {
    return this.rules.length;
  }
}

export interface RuleValidationResult {
  valid: boolean;
  violations: BusinessRule[];
  messages: string[];
}

/**
 * Simple rule — regra de negócio baseada em condição.
 */
export class SimpleRule implements BusinessRule {
  constructor(
    readonly code: string,
    readonly description: string,
    readonly errorMessage: string,
    private readonly condition: () => boolean,
  ) {}

  isSatisfied(): boolean {
    return this.condition();
  }
}

/**
 * Guard rule — valida pré-condição e lança exceção se violada.
 */
export class GuardRule implements BusinessRule {
  constructor(
    readonly code: string,
    readonly description: string,
    readonly errorMessage: string,
    private readonly condition: () => boolean,
  ) {}

  isSatisfied(): boolean {
    const satisfied = this.condition();
    if (!satisfied) {
      throw new Error(this.errorMessage);
    }
    return satisfied;
  }
}
