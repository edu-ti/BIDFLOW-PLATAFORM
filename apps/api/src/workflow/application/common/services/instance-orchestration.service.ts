import {
  WorkflowInstanceEntity,
  CreateInstanceProps,
} from '../../../domain/instance/workflow-instance.entity';
import { WorkflowDefinitionRepository } from '../../../domain/definition/workflow-definition.repository';
import { WorkflowInstanceRepository } from '../../../domain/instance/workflow-instance.repository';
import { WorkflowAssignmentRepository } from '../../../domain/assignment/workflow-assignment.repository';
import { ApprovalRepository } from '../../../domain/approval/approval.repository';
import { WorkflowTaskRepository } from '../../../domain/task/workflow-task.repository';
import { WorkflowTimelineEntryRepository } from '../../../domain/timeline/workflow-timeline-entry.repository';
import { StageRepository } from '../../../domain/stage/stage.repository';
import { TransitionRepository } from '../../../domain/transition/transition.repository';
import { TransitionLogRepository } from '../../../domain/transition-log/transition-log.repository';
import { WorkflowInstanceFactory, FactoryParams } from '../../../domain/common/services/instance-factory.service';
import { TransitionValidator } from '../../../domain/common/services/transition-validator.service';
import { ApprovalEngine } from '../../../domain/common/services/approval-engine.service';
import { TransitionLogEntity } from '../../../domain/transition-log/transition-log.entity';
import { WorkflowTimelineEntryEntity } from '../../../domain/timeline/workflow-timeline-entry.entity';
import { TimelineEntryType } from '../../../domain/common/enums';
import {
  DuplicateWorkflowInstanceError, InstanceAlreadyCompletedError,
  InvalidTransitionError, ApprovalPendingError, MandatoryTasksPendingError,
} from '../../../domain/common/errors';

export interface IInstanceOrchestrationService {
  createInstance(params: FactoryParams): Promise<WorkflowInstanceEntity>;
  executeTransition(
    instanceId: string, transitionSlug: string, userId: string,
    tenantId: string, comment?: string,
  ): Promise<WorkflowInstanceEntity>;
  cancelInstance(instanceId: string, reason: string, cancelledBy: string, tenantId: string): Promise<void>;
  reassignInstance(instanceId: string, assignedTo: string, tenantId: string, roleSlug?: string): Promise<WorkflowInstanceEntity>;
}

export class InstanceOrchestrationService implements IInstanceOrchestrationService {
  constructor(
    private readonly defRepo: WorkflowDefinitionRepository,
    private readonly instanceRepo: WorkflowInstanceRepository,
    private readonly stageRepo: StageRepository,
    private readonly transitionRepo: TransitionRepository,
    private readonly logRepo: TransitionLogRepository,
    private readonly approvalRepo: ApprovalRepository,
    private readonly assignmentRepo: WorkflowAssignmentRepository,
    private readonly taskRepo: WorkflowTaskRepository,
    private readonly timelineRepo: WorkflowTimelineEntryRepository,
    private readonly instanceFactory: WorkflowInstanceFactory,
    private readonly transitionValidator: TransitionValidator,
    private readonly approvalEngine: ApprovalEngine,
  ) {}

  async createInstance(params: FactoryParams): Promise<WorkflowInstanceEntity> {
    const existing = await this.instanceRepo.findByEntity(params.entityType, params.entityId, params.tenantId);
    if (existing && existing.isActive) {
      throw new DuplicateWorkflowInstanceError(params.entityType, params.entityId);
    }

    const definition = await this.defRepo.findById(params.workflowDefinitionId);
    if (!definition) throw new Error('Workflow definition not found');
    if (definition.tenantId !== params.tenantId) throw new Error('Tenant mismatch');
    if (!definition.isActive) throw new Error('Workflow definition is not active');

    const activeCount = await this.instanceRepo.countActiveByDefinition(params.workflowDefinitionId, params.tenantId);

    const result = this.instanceFactory.create({
      ...params,
      maxConcurrentInstances: definition.maxConcurrentInstances ?? undefined,
      existingActiveCount: activeCount,
    });

    await this.instanceRepo.save(result.instance);
    for (const a of result.assignments) await this.assignmentRepo.save(a);
    for (const a of result.approvals) await this.approvalRepo.save(a);
    for (const t of result.tasks) await this.taskRepo.save(t);
    for (const tl of result.timeline) await this.timelineRepo.save(tl);

    return result.instance;
  }

  async executeTransition(
    instanceId: string, transitionSlug: string, userId: string,
    tenantId: string, comment?: string,
  ): Promise<WorkflowInstanceEntity> {
    const instance = await this.instanceRepo.findById(instanceId);
    if (!instance) throw new Error('Workflow instance not found');
    if (instance.tenantId !== tenantId) throw new Error('Tenant mismatch');

    const definition = await this.defRepo.findById(instance.workflowDefinitionId);
    if (!definition) throw new Error('Workflow definition not found');

    const currentStage = await this.stageRepo.findById(instance.currentStageId);
    if (!currentStage) throw new Error('Current stage not found');

    const transition = definition.getTransition(transitionSlug, instance.currentStageId);
    if (!transition) throw new InvalidTransitionError(`Transition '${transitionSlug}' not available from current stage`);

    const tasks = await this.taskRepo.findByInstance(instanceId);
    const approvals = await this.approvalRepo.findByInstance(instanceId);

    const validation = this.transitionValidator.validate(
      instance, transition, userId, currentStage, tasks, approvals, comment,
    );
    if (!validation.valid) {
      if (validation.reason?.includes('approval')) throw new ApprovalPendingError();
      if (validation.reason?.includes('task')) throw new MandatoryTasksPendingError();
      throw new InvalidTransitionError(validation.reason ?? 'Transition validation failed');
    }

    const nextStage = await this.stageRepo.findById(transition.toStageId);
    if (!nextStage) throw new Error('Destination stage not found');

    const deadlineAt = nextStage.deadlineHours
      ? new Date(Date.now() + nextStage.deadlineHours * 3600000)
      : undefined;

    const log = TransitionLogEntity.create({
      tenantId, workflowInstanceId: instanceId,
      transitionSlug, fromStageId: currentStage.id,
      fromStageName: currentStage.name,
      toStageId: nextStage.id, toStageName: nextStage.name,
      executedBy: userId, comment,
    });

    instance.moveToStage(nextStage.id, deadlineAt);

    if (currentStage.isApprovalStage() && transition.toStageId === currentStage.rejectionTargetStageId) {
      instance.reject(userId);
    }

    if (nextStage.isFinal) {
      instance.complete(userId);
    }

    const timelineEntry = WorkflowTimelineEntryEntity.create({
      tenantId, workflowInstanceId: instanceId,
      type: TimelineEntryType.TRANSITION_EXECUTED,
      title: `${transition.name}: ${currentStage.name} → ${nextStage.name}`,
      transitionLogId: log.id,
      occurredAt: log.executedAt,
      createdBy: userId,
      metadata: { fromStage: currentStage.slug, toStage: nextStage.slug, autoTriggered: false },
    });

    await this.logRepo.save(log);
    await this.instanceRepo.save(instance);
    await this.timelineRepo.save(timelineEntry);

    if (nextStage.isApprovalStage() && nextStage.approvalConfig && instance.assignedTo) {
      const config = nextStage.approvalConfig;
      const approval = await this.approvalRepo.findPendingByStage(instanceId, nextStage.id);
      if (approval.length === 0 && config) {
        throw new Error('Approval creation during transition not yet implemented');
      }
    }

    instance.publishTransitionExecuted(transitionSlug, currentStage.slug, nextStage.slug, userId);
    if (nextStage.isFinal) {
      instance.publishCompleted(definition.slug, userId);
    }

    return instance;
  }

  async cancelInstance(instanceId: string, reason: string, cancelledBy: string, tenantId: string): Promise<void> {
    const instance = await this.instanceRepo.findById(instanceId);
    if (!instance) throw new Error('Workflow instance not found');
    if (instance.tenantId !== tenantId) throw new Error('Tenant mismatch');
    if (!instance.isActive) throw new InstanceAlreadyCompletedError();

    instance.cancel(reason, cancelledBy);

    const pendingApprovals = await this.approvalRepo.findPendingByStage(instanceId, instance.currentStageId);
    for (const a of pendingApprovals) {
      a.skip();
      await this.approvalRepo.save(a);
    }

    const timelineEntry = WorkflowTimelineEntryEntity.create({
      tenantId, workflowInstanceId: instanceId,
      type: TimelineEntryType.INSTANCE_CANCELLED,
      title: `Workflow cancelado: ${reason}`,
      occurredAt: new Date(),
      createdBy: cancelledBy,
      metadata: { reason },
    });

    await this.instanceRepo.save(instance);
    await this.timelineRepo.save(timelineEntry);
  }

  async reassignInstance(instanceId: string, assignedTo: string, tenantId: string, roleSlug?: string): Promise<WorkflowInstanceEntity> {
    const instance = await this.instanceRepo.findById(instanceId);
    if (!instance) throw new Error('Workflow instance not found');
    if (instance.tenantId !== tenantId) throw new Error('Tenant mismatch');

    instance.reassign(assignedTo, roleSlug);

    const timelineEntry = WorkflowTimelineEntryEntity.create({
      tenantId, workflowInstanceId: instanceId,
      type: TimelineEntryType.REASSIGNED,
      title: `Reatribuído para ${assignedTo}`,
      occurredAt: new Date(),
      createdBy: assignedTo,
    });

    await this.instanceRepo.save(instance);
    await this.timelineRepo.save(timelineEntry);
    return instance;
  }
}
