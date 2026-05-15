import { DomainEvent } from '../../common/domain-event';

export class WorkflowDefinitionCreatedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.definition.created.v1';
  constructor(
    aggregateId: string,
    tenantId: string,
    readonly name: string,
    readonly slug: string,
    readonly entityType: string,
    readonly version: number,
  ) { super(aggregateId, tenantId); }
}

export class WorkflowDefinitionPublishedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.definition.published.v1';
  constructor(
    aggregateId: string,
    tenantId: string,
    readonly version: number,
  ) { super(aggregateId, tenantId); }
}

export class WorkflowDefinitionVersionedEvent extends DomainEvent {
  readonly type = 'com.bidflow.workflow.definition.versioned.v1';
  constructor(
    aggregateId: string,
    tenantId: string,
    readonly oldVersion: number,
    readonly newVersion: number,
  ) { super(aggregateId, tenantId); }
}
