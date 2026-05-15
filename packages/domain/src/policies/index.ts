// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Policies & Rules (Domain Policies)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Policy interface.
 * Policies encapsulam regras de negócio que podem variar por tenant
 * ou por contexto (ex: política de senha, política de aprovação).
 */
export interface Policy<TContext = unknown, TResult = boolean> {
  readonly name: string;
  evaluate(context: TContext): TResult;
}

/**
 * Policy result with reason.
 */
export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Base policy class.
 */
export abstract class BasePolicy<TContext = unknown> implements Policy<TContext, PolicyResult> {
  abstract readonly name: string;
  abstract evaluate(context: TContext): PolicyResult;
}

/**
 * Composite policy — executa múltiplas políticas e combina resultados.
 */
export class CompositePolicy<TContext = unknown> implements Policy<TContext, PolicyResult> {
  constructor(
    private readonly policies: BasePolicy<TContext>[],
    private readonly mode: 'all' | 'any' = 'all',
  ) {}

  get name(): string {
    return `Composite(${this.policies.map(p => p.name).join(', ')})`;
  }

  evaluate(context: TContext): PolicyResult {
    const results = this.policies.map(p => p.evaluate(context));

    if (this.mode === 'all') {
      const denied = results.find(r => !r.allowed);
      if (denied) return denied;
      return { allowed: true };
    }

    const allowed = results.find(r => r.allowed);
    return allowed ?? { allowed: false, reason: 'No policy allowed' };
  }
}
