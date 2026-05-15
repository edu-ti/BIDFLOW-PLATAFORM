// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Value Object Base
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base class for all value objects.
 *
 * Value Objects são:
 * - IMUTÁVEIS (nenhum setter público)
 * - DEFINIDOS POR SEUS ATRIBUTOS (comparados por valor, não por identidade)
 * - AUTO-VALIDÁVEIS (invariantes no construtor)
 * - SUBSTITUÍVEIS (nova instância para mudar)
 *
 * Uso:
 *   class Money extends ValueObject {
 *     constructor(readonly amount: number, readonly currency: string) {
 *       super();
 *       if (amount < 0) throw new Error('Amount must be positive');
 *     }
 *   }
 */
export abstract class ValueObject {
  /**
   * Compara dois VOs por valor (deep equality dos atributos).
   * Subclasses podem sobrescrever para performance.
   */
  equals(other: this): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return deepEqual(this, other);
  }
}

function deepEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => {
    const valA = a[key];
    const valB = b[key];
    if (typeof valA === 'object' && typeof valB === 'object' && valA !== null && valB !== null) {
      return deepEqual(valA as Record<string, unknown>, valB as Record<string, unknown>);
    }
    return valA === valB;
  });
}
