import { StageEntity } from '../stage/stage.entity';
import { WorkflowInstanceEntity, CreateInstanceProps } from '../instance/workflow-instance.entity';
import { WorkflowAssignmentEntity } from '../assignment/workflow-assignment.entity';
import { ApprovalEntity } from '../approval/approval.entity';
import { WorkflowTaskEntity } from '../task/workflow-task.entity';
import { WorkflowTimelineEntryEntity } from '../timeline/workflow-timeline-entry.entity';
import { ApprovalMode, TaskType, TimelineEntryType, InstancePriority } from '../common/enums';

export interface InstanceFactoryResult {
  instance: WorkflowInstanceEntity;
  assignments: WorkflowAssignmentEntity[];
  approvals: ApprovalEntity[];
  tasks: WorkflowTaskEntity[];
  timeline: WorkflowTimelineEntryEntity[];
}

export interface FactoryParams {
  tenantId: string;
  workflowDefinitionId: string;
  workflowVersion: number;
  entityType: string;
  entityId: string;
  title: string;
  initialStage: StageEntity;
  priority?: InstancePriority;
  data?: Record<string, unknown>;
  createdBy: string;
  assignedTo?: string;
  assignedRole?: string;
  maxConcurrentInstances?: number;
  existingActiveCount?: number;
}

export class WorkflowInstanceFactory {
  create(params: FactoryParams): InstanceFactoryResult {
    const deadlineAt = params.initialStage.deadlineHours
      ? new Date(Date.now() + params.initialStage.deadlineHours * 3600000)
      : undefined;

    const instance = WorkflowInstanceEntity.create({
      tenantId: params.tenantId,
      workflowDefinitionId: params.workflowDefinitionId,
      workflowVersion: params.workflowVersion,
      entityType: params.entityType,
      entityId: params.entityId,
      title: params.title,
      currentStageId: params.initialStage.id,
      priority: params.priority,
      assignedTo: params.assignedTo,
      assignedRole: params.assignedRole,
      data: params.data,
      createdBy: params.createdBy,
      maxConcurrentInstances: params.maxConcurrentInstances,
      existingActiveCount: params.existingActiveCount,
      deadlineAt,
    });

    const assignments: WorkflowAssignmentEntity[] = [];
    const approvals: ApprovalEntity[] = [];
    const tasks: WorkflowTaskEntity[] = [];
    const timeline: WorkflowTimelineEntryEntity[] = [];

    if (params.assignedTo) {
      assignments.push(WorkflowAssignmentEntity.create({
        tenantId: params.tenantId,
        workflowInstanceId: instance.id,
        stageId: params.initialStage.id,
        userId: params.assignedTo,
        roleSlug: params.assignedRole,
        assignedBy: params.createdBy,
      }));
    }

    if (params.initialStage.isApprovalStage() && params.initialStage.approvalConfig) {
      const config = params.initialStage.approvalConfig;
      const assignees = params.assignedTo ? [params.assignedTo] : [];
      for (const assignee of assignees) {
        approvals.push(ApprovalEntity.create({
          tenantId: params.tenantId,
          workflowInstanceId: instance.id,
          stageId: params.initialStage.id,
          approvalMode: config.mode as ApprovalMode,
          assignedTo: assignee,
          assignedRole: params.assignedRole,
          order: 1,
          deadlineAt: config.deadlineHours
            ? new Date(Date.now() + config.deadlineHours * 3600000)
            : undefined,
          allowSelfApproval: config.allowSelfApproval,
          canDelegate: config.canDelegate,
          instanceCreatedBy: params.createdBy,
        }));
      }
    }

    timeline.push(WorkflowTimelineEntryEntity.create({
      tenantId: params.tenantId,
      workflowInstanceId: instance.id,
      type: TimelineEntryType.INSTANCE_CREATED,
      title: `Workflow iniciado: ${params.title}`,
      occurredAt: instance.createdAt,
      createdBy: params.createdBy,
      metadata: {
        workflowDefinitionId: params.workflowDefinitionId,
        initialStage: params.initialStage.slug,
        entityType: params.entityType,
      },
    }));

    return { instance, assignments, approvals, tasks, timeline };
  }
}
