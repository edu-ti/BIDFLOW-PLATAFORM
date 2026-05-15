import { DomainEvent } from '../../common/domain-event';

export class WorkflowStartedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.instance.started.v1';
  constructor(
    aggregateId: string, tenantId: string,
    readonly workflowDefinitionId: string,
    readonly workflowSlug: string,
    readonly workflowVersion: number,
    readonly entityType: string,
    readonly entityId: string,
    readonly title: string,
    readonly initialStage: string,
    readonly assignedTo: string | null,
    readonly priority: string,
    readonly startedBy: string,
  ) { super(aggregateId, tenantId); }
}

export class StageChangedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.stage.changed.v1';
  constructor(
    aggregateId: string, tenantId: string,
    readonly instanceId: string,
    readonly fromStage: string,
    readonly fromStageName: string,
    readonly toStage: string,
    readonly toStageName: string,
    readonly transitionSlug: string,
    readonly executedBy: string,
    readonly isAutomatic: boolean,
    readonly comment: string | null,
  ) { super(aggregateId, tenantId); }
}

export class ApprovalRequestedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.approval.requested.v1';
  constructor(
    aggregateId: string, tenantId: string,
    readonly approvalId: string,
    readonly workflowInstanceId: string,
    readonly stageSlug: string,
    readonly approvalMode: string,
    readonly assignedTo: string,
    readonly deadlineAt: Date | null,
    readonly order: number,
  ) { super(aggregateId, tenantId); }
}

export class ApprovalGrantedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.approval.granted.v1';
  constructor(
    aggregateId: string, tenantId: string,
    readonly approvalId: string,
    readonly workflowInstanceId: string,
    readonly decidedBy: string,
    readonly comment: string | null,
    readonly remainingApprovals: number,
  ) { super(aggregateId, tenantId); }
}

export class ApprovalRejectedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.approval.rejected.v1';
  constructor(
    aggregateId: string, tenantId: string,
    readonly approvalId: string,
    readonly workflowInstanceId: string,
    readonly decidedBy: string,
    readonly comment: string,
  ) { super(aggregateId, tenantId); }
}

export class TaskAssignedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.task.assigned.v1';
  constructor(
    aggregateId: string, tenantId: string,
    readonly taskId: string,
    readonly workflowInstanceId: string,
    readonly title: string,
    readonly taskType: string,
    readonly assignedTo: string,
    readonly assignedBy: string,
    readonly isMandatory: boolean,
    readonly dueDate: Date | null,
  ) { super(aggregateId, tenantId); }
}

export class TaskCompletedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.task.completed.v1';
  constructor(
    aggregateId: string, tenantId: string,
    readonly taskId: string,
    readonly workflowInstanceId: string,
    readonly completedBy: string,
    readonly completedData: Record<string, unknown> | null,
  ) { super(aggregateId, tenantId); }
}

export class WorkflowCompletedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.instance.completed.v1';
  constructor(
    aggregateId: string, tenantId: string,
    readonly workflowDefinitionId: string,
    readonly workflowSlug: string,
    readonly entityType: string,
    readonly entityId: string,
    readonly title: string,
    readonly finalStage: string,
    readonly completedBy: string,
    readonly result: 'COMPLETED' | 'REJECTED' | 'CANCELLED',
  ) { super(aggregateId, tenantId); }
}
