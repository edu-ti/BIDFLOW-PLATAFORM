import { WorkflowInstanceRepository } from '../../../domain/instance/workflow-instance.repository';
import { ApprovalRepository } from '../../../domain/approval/approval.repository';
import { WorkflowTaskRepository } from '../../../domain/task/workflow-task.repository';
import { WorkflowTimelineEntryRepository } from '../../../domain/timeline/workflow-timeline-entry.repository';
import { GetInstanceQuery, ListInstancesQuery, GetInstanceTimelineQuery } from '../../common/queries';
import { WorkflowInstanceDetailDto, TimelineEntryDto } from '../../common/dto';
import { PaginatedResponse } from '../../common/dto/common.dto';
import { InstanceStatus } from '../../../domain/common/enums';

export class GetInstanceHandler {
  constructor(
    private readonly instanceRepo: WorkflowInstanceRepository,
    private readonly approvalRepo: ApprovalRepository,
    private readonly taskRepo: WorkflowTaskRepository,
  ) {}

  async execute(query: GetInstanceQuery): Promise<WorkflowInstanceDetailDto> {
    const instance = await this.instanceRepo.findById(query.id);
    if (!instance || instance.tenantId !== query.tenantId) {
      throw new Error('Workflow instance not found');
    }

    const approvals = await this.approvalRepo.findByInstance(query.id);
    const tasks = await this.taskRepo.findByInstance(query.id);

    return {
      id: instance.id,
      workflowDefinitionId: instance.workflowDefinitionId,
      workflowSlug: instance.workflowDefinitionId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      title: instance.title,
      status: instance.status,
      currentStage: instance.currentStageId,
      enteredStageAt: instance.enteredStageAt.toISOString(),
      deadlineAt: instance.deadlineAt?.toISOString() ?? null,
      priority: instance.priority,
      assignedTo: instance.assignedTo,
      workflowVersion: instance.workflowVersion,
      assignedRole: instance.assignedRole,
      data: instance.data,
      startedAt: instance.startedAt.toISOString(),
      completedAt: instance.completedAt?.toISOString() ?? null,
      completedBy: instance.completedBy,
      createdAt: instance.createdAt.toISOString(),
      updatedAt: instance.updatedAt.toISOString(),
      approvals: approvals.map(a => ({
        id: a.id, status: a.status, approvalMode: a.approvalMode,
        assignedTo: a.assignedTo, assignedRole: a.assignedRole,
        order: a.order, decidedAt: a['_decidedAt']?.toISOString() ?? null,
        decision: a['_decision'], comment: a['_comment'],
        delegatedTo: a['_delegatedTo'], deadlineAt: a.deadlineAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
      tasks: tasks.map(t => ({
        id: t.id, title: t.title, description: t.description,
        type: t.type, status: t.status, assignedTo: t.assignedTo,
        isMandatory: t.isMandatory, dueDate: t.dueDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      })),
      transitionCount: 0,
    };
  }
}

export class ListInstancesHandler {
  constructor(private readonly instanceRepo: WorkflowInstanceRepository) {}

  async execute(query: ListInstancesQuery): Promise<PaginatedResponse<WorkflowInstanceDetailDto>> {
    const [items, total] = await Promise.all([
      this.instanceRepo.findMany({
        tenantId: query.tenantId,
        status: query.status as InstanceStatus[],
        workflowDefinitionId: query.workflowDefinitionId,
        entityType: query.entityType,
        entityId: query.entityId,
        assignedTo: query.assignedTo,
        page: query.page, limit: query.limit,
      }),
      this.instanceRepo.count({
        tenantId: query.tenantId,
        status: query.status as InstanceStatus[],
        workflowDefinitionId: query.workflowDefinitionId,
        entityType: query.entityType,
        entityId: query.entityId,
        assignedTo: query.assignedTo,
      }),
    ]);

    return new PaginatedResponse(
      items.map(i => ({
        id: i.id, workflowDefinitionId: i.workflowDefinitionId,
        workflowSlug: i.workflowDefinitionId,
        entityType: i.entityType, entityId: i.entityId,
        title: i.title, status: i.status,
        currentStage: i.currentStageId,
        enteredStageAt: i.enteredStageAt.toISOString(),
        deadlineAt: i.deadlineAt?.toISOString() ?? null,
        priority: i.priority, assignedTo: i.assignedTo,
        workflowVersion: i.workflowVersion, assignedRole: i.assignedRole,
        data: i.data, startedAt: i.startedAt.toISOString(),
        completedAt: i.completedAt?.toISOString() ?? null,
        completedBy: i.completedBy,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
        approvals: [], tasks: [], transitionCount: 0,
      })),
      total, query.page, query.limit,
    );
  }
}

export class GetInstanceTimelineHandler {
  constructor(private readonly timelineRepo: WorkflowTimelineEntryRepository) {}

  async execute(query: GetInstanceTimelineQuery): Promise<TimelineEntryDto[]> {
    const entries = await this.timelineRepo.findByInstance(query.instanceId, {
      workflowInstanceId: query.instanceId,
      limit: query.limit, offset: query.offset,
    });

    return entries.map(e => ({
      id: e.id, type: e.type, title: e.title,
      description: e.description,
      occurredAt: e.occurredAt.toISOString(),
      createdBy: e.createdBy, metadata: e.metadata,
    }));
  }
}
