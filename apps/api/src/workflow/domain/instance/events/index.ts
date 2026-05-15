import { DomainEvent } from '../../common/domain-event';

export class WorkflowInstanceCreatedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.instance.created.v1';
  constructor(
    aggregateId: string,
    tenantId: string,
    readonly workflowSlug: string,
    readonly entityType: string,
    readonly entityId: string,
    readonly currentStage: string,
    readonly assignedTo?: string,
  ) { super(aggregateId, tenantId); }
}

export class WorkflowTransitionExecutedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.transition.executed.v1';
  constructor(
    aggregateId: string,
    tenantId: string,
    readonly transitionSlug: string,
    readonly fromStage: string,
    readonly toStage: string,
    readonly executedBy: string,
  ) { super(aggregateId, tenantId); }
}

export class WorkflowInstanceCompletedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.instance.completed.v1';
  constructor(
    aggregateId: string,
    tenantId: string,
    readonly workflowSlug: string,
    readonly entityType: string,
    readonly entityId: string,
    readonly completedBy: string,
  ) { super(aggregateId, tenantId); }
}

export class WorkflowInstanceCancelledEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.instance.cancelled.v1';
  constructor(
    aggregateId: string,
    tenantId: string,
    readonly reason: string,
    readonly cancelledBy: string,
  ) { super(aggregateId, tenantId); }
}
