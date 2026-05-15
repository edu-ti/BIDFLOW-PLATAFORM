import { Query } from '../../common/interfaces/command';
import { InstanceStatus, InstancePriority } from '../../../domain/common/enums';

export class GetDefinitionQuery extends Query {
  readonly queryName = 'GetDefinitionQuery';
  constructor(readonly id: string, readonly tenantId: string) { super(); }
}

export class ListDefinitionsQuery extends Query {
  readonly queryName = 'ListDefinitionsQuery';
  constructor(
    readonly tenantId: string,
    readonly entityType?: string,
    readonly isActive?: boolean,
    readonly search?: string,
    readonly page: number = 1,
    readonly limit: number = 20,
  ) { super(); }
}

export class ListStagesQuery extends Query {
  readonly queryName = 'ListStagesQuery';
  constructor(readonly definitionId: string, readonly tenantId: string) { super(); }
}

export class ListTransitionsQuery extends Query {
  readonly queryName = 'ListTransitionsQuery';
  constructor(readonly definitionId: string, readonly tenantId: string) { super(); }
}

export class GetInstanceQuery extends Query {
  readonly queryName = 'GetInstanceQuery';
  constructor(readonly id: string, readonly tenantId: string) { super(); }
}

export class ListInstancesQuery extends Query {
  readonly queryName = 'ListInstancesQuery';
  constructor(
    readonly tenantId: string,
    readonly status?: InstanceStatus[],
    readonly workflowDefinitionId?: string,
    readonly entityType?: string,
    readonly entityId?: string,
    readonly assignedTo?: string,
    readonly page: number = 1,
    readonly limit: number = 50,
  ) { super(); }
}

export class GetInstanceTimelineQuery extends Query {
  readonly queryName = 'GetInstanceTimelineQuery';
  constructor(
    readonly instanceId: string,
    readonly tenantId: string,
    readonly limit: number = 50,
    readonly offset: number = 0,
  ) { super(); }
}

export class ListApprovalsQuery extends Query {
  readonly queryName = 'ListApprovalsQuery';
  constructor(readonly instanceId: string, readonly tenantId: string) { super(); }
}

export class ListTasksQuery extends Query {
  readonly queryName = 'ListTasksQuery';
  constructor(
    readonly instanceId: string,
    readonly tenantId: string,
  ) { super(); }
}

export class ListMyPendingTasksQuery extends Query {
  readonly queryName = 'ListMyPendingTasksQuery';
  constructor(
    readonly userId: string,
    readonly tenantId: string,
  ) { super(); }
}

export class GetSummaryQuery extends Query {
  readonly queryName = 'GetSummaryQuery';
  constructor(readonly tenantId: string) { super(); }
}

export class GetMyPendingItemsQuery extends Query {
  readonly queryName = 'GetMyPendingItemsQuery';
  constructor(readonly userId: string, readonly tenantId: string) { super(); }
}

export class GetOverdueInstancesQuery extends Query {
  readonly queryName = 'GetOverdueInstancesQuery';
  constructor(readonly tenantId: string) { super(); }
}
