import { DomainEvent } from '../../common/domain-event';
import { ApprovalStatus } from '../../common/enums';

export class ApprovalCompletedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.approval.completed.v1';
  constructor(
    aggregateId: string,
    tenantId: string,
    readonly instanceId: string,
    readonly decision: ApprovalStatus,
    readonly decidedBy: string,
    readonly comment?: string,
    readonly stage?: string,
  ) { super(aggregateId, tenantId); }
}

export class ApprovalDelegatedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.approval.delegated.v1';
  constructor(
    aggregateId: string,
    tenantId: string,
    readonly delegatedFrom: string,
    readonly delegatedTo: string,
  ) { super(aggregateId, tenantId); }
}

export class ApprovalExpiredEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.approval.expired.v1';
  constructor(
    aggregateId: string,
    tenantId: string,
    readonly deadlineAt: Date,
  ) { super(aggregateId, tenantId); }
}
