import { WorkflowInstanceRepository } from '../../../../domain/instance/workflow-instance.repository';
import { ApprovalRepository } from '../../../../domain/approval/approval.repository';
import { WorkflowTaskRepository } from '../../../../domain/task/workflow-task.repository';
import { GetSummaryQuery, GetMyPendingItemsQuery, GetOverdueInstancesQuery } from '../../../common/queries';
import { WorkflowSummaryDto, PendingItemsDto, WorkflowInstanceResponseDto } from '../../../common/dto';
import { InstanceStatus } from '../../../../domain/common/enums';

export class GetSummaryHandler {
  constructor(
    private readonly instanceRepo: WorkflowInstanceRepository,
    private readonly approvalRepo: ApprovalRepository,
    private readonly taskRepo: WorkflowTaskRepository,
  ) {}

  async execute(query: GetSummaryQuery): Promise<WorkflowSummaryDto> {
    const [active, allInstances, overdue, pendingApprovals, pendingTasks] = await Promise.all([
      this.instanceRepo.count({ tenantId: query.tenantId, status: [InstanceStatus.ACTIVE] }),
      this.instanceRepo.findMany({ tenantId: query.tenantId, page: 1, limit: 1000 }),
      this.instanceRepo.findOverdue(query.tenantId),
      this.countAllPendingApprovals(query.tenantId),
      this.countAllPendingTasks(query.tenantId),
    ]);

    const completed = allInstances.filter(i => i.status === InstanceStatus.COMPLETED).length;

    return {
      totalActive: active,
      totalCompleted: completed,
      totalOverdue: overdue.length,
      pendingApprovals,
      pendingTasks,
      byWorkflow: [],
    };
  }

  private async countAllPendingApprovals(tenantId: string): Promise<number> {
    return 0;
  }

  private async countAllPendingTasks(tenantId: string): Promise<number> {
    return 0;
  }
}

export class GetMyPendingItemsHandler {
  constructor(
    private readonly approvalRepo: ApprovalRepository,
    private readonly taskRepo: WorkflowTaskRepository,
    private readonly instanceRepo: WorkflowInstanceRepository,
  ) {}

  async execute(query: GetMyPendingItemsQuery): Promise<PendingItemsDto> {
    const [approvals, tasks, overdue] = await Promise.all([
      this.approvalRepo.findPendingByUser(query.userId, query.tenantId),
      this.taskRepo.findPendingByUser(query.userId, query.tenantId),
      this.instanceRepo.findOverdue(query.tenantId),
    ]);

    return {
      approvals: approvals.map(a => ({
        id: a.id, status: a.status, approvalMode: a.approvalMode,
        assignedTo: a.assignedTo, assignedRole: a.assignedRole,
        order: a.order,
        decidedAt: (a as any)['_decidedAt']?.toISOString() ?? null,
        decision: (a as any)['_decision'], comment: (a as any)['_comment'],
        delegatedTo: (a as any)['_delegatedTo'],
        deadlineAt: a.deadlineAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
      tasks: tasks.map(t => ({
        id: t.id, title: t.title, description: t.description,
        type: t.type, status: t.status, assignedTo: t.assignedTo,
        isMandatory: t.isMandatory,
        dueDate: t.dueDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      })),
      overdueInstances: overdue.map(i => ({
        id: i.id, workflowDefinitionId: i.workflowDefinitionId,
        workflowSlug: i.workflowDefinitionId,
        entityType: i.entityType, entityId: i.entityId,
        title: i.title, status: i.status,
        currentStage: i.currentStageId,
        enteredStageAt: i.enteredStageAt.toISOString(),
        deadlineAt: i.deadlineAt?.toISOString() ?? null,
        priority: i.priority, assignedTo: i.assignedTo,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
    };
  }
}

export class GetOverdueInstancesHandler {
  constructor(private readonly instanceRepo: WorkflowInstanceRepository) {}

  async execute(query: GetOverdueInstancesQuery): Promise<WorkflowInstanceResponseDto[]> {
    const instances = await this.instanceRepo.findOverdue(query.tenantId);
    return instances.map(i => ({
      id: i.id, workflowDefinitionId: i.workflowDefinitionId,
      workflowSlug: i.workflowDefinitionId,
      entityType: i.entityType, entityId: i.entityId,
      title: i.title, status: i.status,
      currentStage: i.currentStageId,
      enteredStageAt: i.enteredStageAt.toISOString(),
      deadlineAt: i.deadlineAt?.toISOString() ?? null,
      priority: i.priority, assignedTo: i.assignedTo,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    }));
  }
}
