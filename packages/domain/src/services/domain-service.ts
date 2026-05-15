// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Domain Service Base
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Domain Service base class.
 * Serviços de domínio operam sobre múltiplos aggregates ou coordena
 * regras que não pertencem a uma única entidade.
 *
 * Domain Services são:
 * - STATELESS (sem estado interno mutável)
 * - PARTE DO DOMÍNIO (linguagem ubíqua)
 * - COORDENADORES (orquestram entidades, não contêm lógica de infra)
 */
export abstract class DomainService {
  protected validate(condition: boolean, message: string): void {
    if (!condition) throw new Error(`Domain invariant violated: ${message}`);
  }
}
