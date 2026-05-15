import { DomainEvent } from '../../domain/common/domain-event';

export class WorkflowStartedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.instance.started.v1';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly workflowDefinitionId: string,
    readonly workflowSlug: string,
    readonly workflowVersion: number,
    readonly entityType: string,
    readonly entityId: string,
    readonly title: string,
    readonly initialStage: string,
    readonly assignedTo: string | null,
    readonly priority: string,
    readonly data: Record<string, unknown>,
    readonly startedBy: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class StageChangedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.stage.changed.v1';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly workflowDefinitionId: string,
    readonly instanceId: string,
    readonly fromStage: string,
    readonly fromStageName: string,
    readonly toStage: string,
    readonly toStageName: string,
    readonly transitionSlug: string,
    readonly transitionName: string,
    readonly isAutomatic: boolean,
    readonly comment: string | null,
    readonly executedBy: string,
    readonly deadlineAt: string | null,
    readonly isRejection: boolean,
  ) {
    super(aggregateId, tenantId);
  }
}

export class ApprovalRequestedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.approval.requested.v1';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly approvalId: string,
    readonly workflowInstanceId: string,
    readonly workflowDefinitionId: string,
    readonly stageId: string,
    readonly stageName: string,
    readonly approvalMode: string,
    readonly assignedTo: string,
    readonly assignedRole: string | null,
    readonly order: number,
    readonly deadlineAt: string | null,
    readonly instanceTitle: string,
    readonly entityType: string,
    readonly entityId: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class ApprovalGrantedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.approval.granted.v1';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly approvalId: string,
    readonly workflowInstanceId: string,
    readonly workflowDefinitionId: string,
    readonly stageId: string,
    readonly decision: 'APPROVED' | 'REJECTED',
    readonly decidedBy: string,
    readonly comment: string | null,
    readonly approvalMode: string,
    readonly remainingApprovals: number,
    readonly delegatedFrom: string | null,
  ) {
    super(aggregateId, tenantId);
  }
}

export class WorkflowCompletedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.instance.completed.v1';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly workflowDefinitionId: string,
    readonly workflowSlug: string,
    readonly workflowVersion: number,
    readonly entityType: string,
    readonly entityId: string,
    readonly title: string,
    readonly finalStage: string,
    readonly totalTransitions: number,
    readonly totalElapsedMs: number,
    readonly completedBy: string,
    readonly result: 'COMPLETED' | 'REJECTED' | 'CANCELLED',
    readonly reason: string | null,
  ) {
    super(aggregateId, tenantId);
  }
}

export class TaskAssignedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.task.assigned.v1';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly taskId: string,
    readonly workflowInstanceId: string,
    readonly workflowDefinitionId: string,
    readonly stageId: string,
    readonly stageName: string,
    readonly title: string,
    readonly description: string | null,
    readonly taskType: string,
    readonly assignedTo: string,
    readonly assignedBy: string,
    readonly isMandatory: boolean,
    readonly dueDate: string | null,
    readonly instanceTitle: string,
    readonly entityType: string,
    readonly entityId: string,
  ) {
    super(aggregateId, tenantId);
  }
}
