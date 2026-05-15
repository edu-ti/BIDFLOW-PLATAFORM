import { DomainError } from './domain-error';

export class WorkflowDefinitionNotFoundError extends DomainError {
  readonly code = 'WF_DEF_NOT_FOUND';
  readonly statusCode = 404;
  constructor(id: string) { super(`Workflow definition not found: ${id}`); }
}

export class WorkflowInstanceNotFoundError extends DomainError {
  readonly code = 'WF_INST_NOT_FOUND';
  readonly statusCode = 404;
  constructor(id: string) { super(`Workflow instance not found: ${id}`); }
}

export class StageNotFoundError extends DomainError {
  readonly code = 'WF_STAGE_NOT_FOUND';
  readonly statusCode = 404;
  constructor(slug: string) { super(`Stage not found: ${slug}`); }
}

export class TransitionNotFoundError extends DomainError {
  readonly code = 'WF_TRANS_NOT_FOUND';
  readonly statusCode = 404;
  constructor(slug: string) { super(`Transition not found: ${slug}`); }
}

export class ApprovalNotFoundError extends DomainError {
  readonly code = 'WF_APPR_NOT_FOUND';
  readonly statusCode = 404;
  constructor(id: string) { super(`Approval not found: ${id}`); }
}

export class InvalidTransitionError extends DomainError {
  readonly code = 'WF_INVALID_TRANSITION';
  readonly statusCode = 422;
  constructor(reason: string) { super(`Invalid transition: ${reason}`); }
}

export class TransitionNotAllowedError extends DomainError {
  readonly code = 'WF_TRANSITION_NOT_ALLOWED';
  readonly statusCode = 403;
  constructor() { super('Transition not allowed for current user'); }
}

export class ApprovalPendingError extends DomainError {
  readonly code = 'WF_APPROVALS_PENDING';
  readonly statusCode = 422;
  constructor() { super('Approvals are pending for current stage'); }
}

export class MandatoryTasksPendingError extends DomainError {
  readonly code = 'WF_MANDATORY_TASKS_PENDING';
  readonly statusCode = 422;
  constructor() { super('Mandatory tasks must be completed before transition'); }
}

export class SelfApprovalDeniedError extends DomainError {
  readonly code = 'WF_SELF_APPROVAL_DENIED';
  readonly statusCode = 403;
  constructor() { super('Self-approval is not allowed'); }
}

export class WorkflowCycleDetectedError extends DomainError {
  readonly code = 'WF_CYCLE_DETECTED';
  readonly statusCode = 422;
  constructor() { super('Workflow definition contains a cycle'); }
}

export class PublishedWorkflowImmutableError extends DomainError {
  readonly code = 'WF_PUBLISHED_IMMUTABLE';
  readonly statusCode = 422;
  constructor() { super('Published workflow definition cannot be modified'); }
}

export class DuplicateWorkflowInstanceError extends DomainError {
  readonly code = 'WF_DUPLICATE_INSTANCE';
  readonly statusCode = 409;
  constructor(entityType: string, entityId: string) {
    super(`Active workflow instance already exists for ${entityType}:${entityId}`);
  }
}

export class MaxDelegationExceededError extends DomainError {
  readonly code = 'WF_MAX_DELEGATION';
  readonly statusCode = 422;
  constructor() { super('Approval can only be delegated once'); }
}

export class ApprovalAlreadyDecidedError extends DomainError {
  readonly code = 'WF_ALREADY_DECIDED';
  readonly statusCode = 422;
  constructor() { super('Approval has already been decided'); }
}

export class InstanceAlreadyCompletedError extends DomainError {
  readonly code = 'WF_ALREADY_COMPLETED';
  readonly statusCode = 422;
  constructor() { super('Workflow instance is already completed'); }
}

export class MaxConcurrentInstancesError extends DomainError {
  readonly code = 'WF_MAX_CONCURRENT_INSTANCES';
  readonly statusCode = 429;
  constructor(limit: number) { super(`Maximum concurrent instances (${limit}) reached`); }
}

export class NoInitialStageError extends DomainError {
  readonly code = 'WF_NO_INITIAL_STAGE';
  readonly statusCode = 422;
  constructor() { super('Workflow must have exactly one initial stage'); }
}

export class NoFinalStageError extends DomainError {
  readonly code = 'WF_NO_FINAL_STAGE';
  readonly statusCode = 422;
  constructor() { super('Workflow must have at least one final stage'); }
}

export class StageSlugAlreadyExistsError extends DomainError {
  readonly code = 'WF_STAGE_SLUG_DUPLICATE';
  readonly statusCode = 422;
  constructor(slug: string) { super(`Stage slug already exists: ${slug}`); }
}

export class TransitionSlugAlreadyExistsError extends DomainError {
  readonly code = 'WF_TRANSITION_SLUG_DUPLICATE';
  readonly statusCode = 422;
  constructor(slug: string) { super(`Transition slug already exists: ${slug}`); }
}
