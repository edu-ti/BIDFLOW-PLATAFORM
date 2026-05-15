import { DomainEvent } from '../../common/domain-event';
import { TaskStatus } from '../../common/enums';

export class WorkflowTaskCompletedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.task.completed.v1';
  constructor(
    aggregateId: string,
    tenantId: string,
    readonly instanceId: string,
    readonly title: string,
    readonly completedBy: string,
    readonly completedData?: Record<string, unknown>,
  ) { super(aggregateId, tenantId); }
}
