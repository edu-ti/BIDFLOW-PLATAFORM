import { WorkflowDefinitionEntity, WorkflowDefinitionData } from '../../../domain/definition/workflow-definition.entity';
import { StageEntity, StageData } from '../../../domain/stage/stage.entity';
import { TransitionEntity, TransitionData } from '../../../domain/transition/transition.entity';
import { WorkflowInstanceEntity, InstanceData } from '../../../domain/instance/workflow-instance.entity';
import { TransitionLogEntity, TransitionLogData } from '../../../domain/transition-log/transition-log.entity';
import { ApprovalEntity, ApprovalData } from '../../../domain/approval/approval.entity';
import { WorkflowAssignmentEntity, AssignmentData } from '../../../domain/assignment/workflow-assignment.entity';
import { WorkflowTaskEntity, WorkflowTaskData } from '../../../domain/task/workflow-task.entity';
import { WorkflowTimelineEntryEntity, TimelineEntryData } from '../../../domain/timeline/workflow-timeline-entry.entity';
import { StageType, InstanceStatus, InstancePriority, ApprovalMode, ApprovalStatus, AssignmentStatus, TaskType, TaskStatus, TimelineEntryType } from '../../../domain/common/enums';

export class WorkflowDefinitionMapper {
  toDomain(prismaRecord: any): WorkflowDefinitionEntity {
    const stages = (prismaRecord.stages || []).map((s: any) => this.stageToDomain(s));
    const transitions = (prismaRecord.transitions || []).map((t: any) => this.transitionToDomain(t));

    return WorkflowDefinitionEntity.restore({
      id: prismaRecord.id,
      tenantId: prismaRecord.tenantId,
      name: prismaRecord.name,
      slug: prismaRecord.slug,
      description: prismaRecord.description,
      entityType: prismaRecord.entityType,
      icon: prismaRecord.icon,
      color: prismaRecord.color,
      version: prismaRecord.version,
      isActive: prismaRecord.isActive,
      isPublished: prismaRecord.isPublished,
      publishedAt: prismaRecord.publishedAt,
      maxConcurrentInstances: prismaRecord.maxConcurrentInstances,
      metadata: (prismaRecord.metadata ?? {}) as Record<string, unknown>,
      createdBy: prismaRecord.createdBy,
      createdAt: prismaRecord.createdAt,
      updatedAt: prismaRecord.updatedAt,
      stages,
      transitions,
    });
  }

  toPersistence(entity: WorkflowDefinitionEntity): any {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      entityType: entity.entityType,
      icon: entity.icon,
      color: entity.color,
      version: entity.version,
      isActive: entity.isActive,
      isPublished: entity.isPublished,
      publishedAt: entity.publishedAt,
      maxConcurrentInstances: entity.maxConcurrentInstances,
      metadata: entity.metadata,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  stageToDomain(data: any): StageEntity {
    return StageEntity.restore({
      id: data.id,
      workflowDefinitionId: data.workflowDefinitionId,
      slug: data.slug,
      name: data.name,
      description: data.description,
      order: data.order,
      color: data.color,
      type: data.type as StageType,
      isInitial: data.isInitial,
      isFinal: data.isFinal,
      approvalConfig: (data.approvalConfig ?? null) as Record<string, unknown> | null,
      assignmentConfig: (data.assignmentConfig ?? null) as Record<string, unknown> | null,
      deadlineHours: data.deadlineHours,
      notifyOnEnter: data.notifyOnEnter,
      notifyOnExit: data.notifyOnExit,
      allowRejection: data.allowRejection,
      rejectionTargetStageId: data.rejectionTargetStageId,
      metadata: (data.metadata ?? {}) as Record<string, unknown>,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  stageToPersistence(entity: StageEntity): any {
    return {
      id: entity.id,
      workflowDefinitionId: entity.workflowDefinitionId,
      slug: entity.slug,
      name: entity.name,
      description: entity.description,
      order: entity.order,
      color: entity.color,
      type: entity.type,
      isInitial: entity.isInitial,
      isFinal: entity.isFinal,
      approvalConfig: entity.approvalConfig as any,
      assignmentConfig: entity.assignmentConfig as any,
      deadlineHours: entity.deadlineHours,
      notifyOnEnter: entity.notifyOnEnter,
      notifyOnExit: entity.notifyOnExit,
      allowRejection: entity.allowRejection,
      rejectionTargetStageId: entity.rejectionTargetStageId,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  transitionToDomain(data: any): TransitionEntity {
    return TransitionEntity.restore({
      id: data.id,
      workflowDefinitionId: data.workflowDefinitionId,
      slug: data.slug,
      name: data.name,
      fromStageId: data.fromStageId,
      toStageId: data.toStageId,
      conditions: (data.conditions ?? null) as Record<string, unknown> | null,
      permissions: (data.permissions ?? null) as Record<string, unknown> | null,
      isAutomatic: data.isAutomatic,
      autoTriggerEvent: data.autoTriggerEvent,
      order: data.order,
      metadata: (data.metadata ?? {}) as Record<string, unknown>,
      createdAt: data.createdAt,
    });
  }

  transitionToPersistence(entity: TransitionEntity): any {
    return {
      id: entity.id,
      workflowDefinitionId: entity.workflowDefinitionId,
      slug: entity.slug,
      name: entity.name,
      fromStageId: entity.fromStageId,
      toStageId: entity.toStageId,
      conditions: entity.conditions as any,
      permissions: entity.permissions as any,
      isAutomatic: entity.isAutomatic,
      autoTriggerEvent: entity.autoTriggerEvent,
      order: entity.order,
      metadata: entity.metadata,
    };
  }
}

export class WorkflowInstanceMapper {
  toDomain(data: any): WorkflowInstanceEntity {
    return WorkflowInstanceEntity.restore({
      id: data.id,
      tenantId: data.tenantId,
      workflowDefinitionId: data.workflowDefinitionId,
      workflowVersion: data.workflowVersion,
      entityType: data.entityType,
      entityId: data.entityId,
      title: data.title,
      status: data.status as InstanceStatus,
      currentStageId: data.currentStageId,
      enteredStageAt: data.enteredStageAt,
      deadlineAt: data.deadlineAt,
      priority: data.priority as InstancePriority,
      assignedTo: data.assignedTo,
      assignedRole: data.assignedRole,
      data: (data.data ?? {}) as Record<string, unknown>,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      completedBy: data.completedBy,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  toPersistence(entity: WorkflowInstanceEntity): any {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      workflowDefinitionId: entity.workflowDefinitionId,
      workflowVersion: entity.workflowVersion,
      entityType: entity.entityType,
      entityId: entity.entityId,
      title: entity.title,
      status: entity.status,
      currentStageId: entity.currentStageId,
      enteredStageAt: entity.enteredStageAt,
      deadlineAt: entity.deadlineAt,
      priority: entity.priority,
      assignedTo: entity.assignedTo,
      assignedRole: entity.assignedRole,
      data: entity.data,
      startedAt: entity.startedAt,
      completedAt: entity.completedAt,
      completedBy: entity.completedBy,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class TransitionLogMapper {
  toDomain(data: any): TransitionLogEntity {
    return TransitionLogEntity.restore({
      id: data.id,
      tenantId: data.tenantId,
      workflowInstanceId: data.workflowInstanceId,
      transitionSlug: data.transitionSlug,
      fromStageId: data.fromStageId,
      fromStageName: data.fromStageName,
      toStageId: data.toStageId,
      toStageName: data.toStageName,
      executedBy: data.executedBy,
      executedAt: data.executedAt,
      comment: data.comment,
      metadata: (data.metadata ?? {}) as Record<string, unknown>,
      createdAt: data.createdAt,
    });
  }

  toPersistence(entity: TransitionLogEntity): any {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      workflowInstanceId: entity.workflowInstanceId,
      transitionSlug: entity.transitionSlug,
      fromStageId: entity.fromStageId,
      fromStageName: entity.fromStageName,
      toStageId: entity.toStageId,
      toStageName: entity.toStageName,
      executedBy: entity.executedBy,
      executedAt: entity.executedAt,
      comment: entity.comment,
      metadata: entity.metadata,
    };
  }
}

export class ApprovalMapper {
  toDomain(data: any): ApprovalEntity {
    return ApprovalEntity.restore({
      id: data.id,
      tenantId: data.tenantId,
      workflowInstanceId: data.workflowInstanceId,
      stageId: data.stageId,
      status: data.status as ApprovalStatus,
      approvalMode: data.approvalMode as ApprovalMode,
      assignedTo: data.assignedTo,
      assignedRole: data.assignedRole,
      order: data.order,
      decidedAt: data.decidedAt,
      decision: data.decision,
      comment: data.comment,
      delegatedFrom: data.delegatedFrom,
      delegatedTo: data.delegatedTo,
      deadlineAt: data.deadlineAt,
      remindedAt: data.remindedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  toPersistence(entity: ApprovalEntity): any {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      workflowInstanceId: entity.workflowInstanceId,
      stageId: entity.stageId,
      status: entity.status,
      approvalMode: entity.approvalMode,
      assignedTo: entity.assignedTo,
      assignedRole: entity.assignedRole,
      order: entity.order,
      decidedAt: (entity as any)['_decidedAt'],
      decision: (entity as any)['_decision'],
      comment: (entity as any)['_comment'],
      delegatedFrom: (entity as any)['_delegatedFrom'],
      delegatedTo: (entity as any)['_delegatedTo'],
      deadlineAt: entity.deadlineAt,
      remindedAt: entity.remindedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class AssignmentMapper {
  toDomain(data: any): WorkflowAssignmentEntity {
    return WorkflowAssignmentEntity.restore({
      id: data.id,
      tenantId: data.tenantId,
      workflowInstanceId: data.workflowInstanceId,
      stageId: data.stageId,
      userId: data.userId,
      roleSlug: data.roleSlug,
      status: data.status as AssignmentStatus,
      assignedBy: data.assignedBy,
      assignedAt: data.assignedAt,
      completedAt: data.completedAt,
      delegatedTo: data.delegatedTo,
      createdAt: data.createdAt,
    });
  }

  toPersistence(entity: WorkflowAssignmentEntity): any {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      workflowInstanceId: entity.workflowInstanceId,
      stageId: entity.stageId,
      userId: entity.userId,
      roleSlug: entity.roleSlug,
      status: entity.status,
      assignedBy: entity.assignedBy,
      assignedAt: entity.assignedAt,
      completedAt: (entity as any)['_completedAt'],
      delegatedTo: (entity as any)['_delegatedTo'],
    };
  }
}

export class WorkflowTaskMapper {
  toDomain(data: any): WorkflowTaskEntity {
    return WorkflowTaskEntity.restore({
      id: data.id,
      tenantId: data.tenantId,
      workflowInstanceId: data.workflowInstanceId,
      stageId: data.stageId,
      title: data.title,
      description: data.description,
      type: data.type as TaskType,
      status: data.status as TaskStatus,
      assignedTo: data.assignedTo,
      assignedBy: data.assignedBy,
      isMandatory: data.isMandatory,
      dueDate: data.dueDate,
      completedAt: data.completedAt,
      completedBy: data.completedBy,
      completedData: (data.completedData ?? null) as Record<string, unknown> | null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  toPersistence(entity: WorkflowTaskEntity): any {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      workflowInstanceId: entity.workflowInstanceId,
      stageId: entity.stageId,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      status: entity.status,
      assignedTo: entity.assignedTo,
      assignedBy: entity.assignedBy,
      isMandatory: entity.isMandatory,
      dueDate: entity.dueDate,
      completedAt: (entity as any)['_completedAt'],
      completedBy: (entity as any)['_completedBy'],
      completedData: (entity as any)['_completedData'],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class TimelineEntryMapper {
  toDomain(data: any): WorkflowTimelineEntryEntity {
    return WorkflowTimelineEntryEntity.restore({
      id: data.id,
      tenantId: data.tenantId,
      workflowInstanceId: data.workflowInstanceId,
      type: data.type as TimelineEntryType,
      title: data.title,
      description: data.description,
      transitionLogId: data.transitionLogId,
      approvalId: data.approvalId,
      taskId: data.taskId,
      occurredAt: data.occurredAt,
      createdBy: data.createdBy,
      metadata: (data.metadata ?? {}) as Record<string, unknown>,
      createdAt: data.createdAt,
    });
  }

  toPersistence(entity: WorkflowTimelineEntryEntity): any {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      workflowInstanceId: entity.workflowInstanceId,
      type: entity.type,
      title: entity.title,
      description: entity.description,
      transitionLogId: entity.transitionLogId,
      approvalId: entity.approvalId,
      taskId: entity.taskId,
      occurredAt: entity.occurredAt,
      createdBy: entity.createdBy,
      metadata: entity.metadata,
    };
  }
}
