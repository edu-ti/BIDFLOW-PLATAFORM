// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Domain Exceptions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base domain exception.
 * Todas as exceções de domínio herdam desta classe.
 */
export abstract class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 422,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ── Not Found Exceptions ──
export class NotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND', 404);
  }
}

export class EntityNotFoundException extends NotFoundException {
  constructor(entity: string, id: string) { super(entity, id); }
}

// ── Validation Exceptions ──
export class ValidationException extends DomainException {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message, code, 422);
  }
}

export class InvalidStateException extends ValidationException {
  constructor(entity: string, expected: string, actual: string) {
    super(`Expected ${entity} to be ${expected}, but it is ${actual}`, 'INVALID_STATE');
  }
}

export class DuplicateEntityException extends ValidationException {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} '${value}' already exists`, 'DUPLICATE_ENTITY');
  }
}

// ── Authorization Exceptions ──
export class UnauthorizedException extends DomainException {
  constructor(message = 'Unauthorized') { super(message, 'UNAUTHORIZED', 401); }
}

export class ForbiddenException extends DomainException {
  constructor(message = 'Forbidden') { super(message, 'FORBIDDEN', 403); }
}

export class TenantMismatchException extends ForbiddenException {
  constructor() { super('Tenant mismatch'); }
}

// ── Business Rule Exceptions ──
export class BusinessRuleException extends DomainException {
  constructor(message: string, code: string) {
    super(message, code, 422);
  }
}

export class SelfApprovalException extends BusinessRuleException {
  constructor() { super('Self-approval is not allowed', 'SELF_APPROVAL_DENIED'); }
}

export class MaxRetriesExceededException extends BusinessRuleException {
  constructor() { super('Maximum retries exceeded', 'MAX_RETRIES'); }
}

// ── Rate Limit ──
export class RateLimitException extends DomainException {
  constructor() { super('Too many requests', 'RATE_LIMITED', 429); }
}
