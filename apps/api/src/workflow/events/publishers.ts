import { Injectable, Logger } from '@nestjs/common';
import {
  WorkflowStartedEvent, StageChangedEvent, ApprovalRequestedEvent,
  ApprovalGrantedEvent, WorkflowCompletedEvent, TaskAssignedEvent,
} from './domain-events';

export interface IWorkflowEventPublisher {
  publishWorkflowStarted(event: WorkflowStartedEvent): Promise<void>;
  publishStageChanged(event: StageChangedEvent): Promise<void>;
  publishApprovalRequested(event: ApprovalRequestedEvent): Promise<void>;
  publishApprovalGranted(event: ApprovalGrantedEvent): Promise<void>;
  publishWorkflowCompleted(event: WorkflowCompletedEvent): Promise<void>;
  publishTaskAssigned(event: TaskAssignedEvent): Promise<void>;
}

@Injectable()
export class ConsoleWorkflowEventPublisher implements IWorkflowEventPublisher {
  private readonly logger = new Logger('WorkflowEvents');

  async publishWorkflowStarted(event: WorkflowStartedEvent): Promise<void> {
    this.logger.log(`[${event.type}] Workflow iniciado: ${event.title}`, {
      eventId: event.eventId, tenantId: event.tenantId,
      workflow: event.workflowSlug, entity: `${event.entityType}:${event.entityId}`,
    });
  }

  async publishStageChanged(event: StageChangedEvent): Promise<void> {
    this.logger.log(`[${event.type}] ${event.fromStageName} → ${event.toStageName}`, {
      eventId: event.eventId, instanceId: event.instanceId,
      transition: event.transitionSlug, automatic: event.isAutomatic,
    });
  }

  async publishApprovalRequested(event: ApprovalRequestedEvent): Promise<void> {
    this.logger.log(`[${event.type}] Aprovação solicitada para ${event.assignedTo}`, {
      eventId: event.eventId, approvalId: event.approvalId,
      mode: event.approvalMode, deadline: event.deadlineAt,
    });
  }

  async publishApprovalGranted(event: ApprovalGrantedEvent): Promise<void> {
    this.logger.log(`[${event.type}] ${event.decision} por ${event.decidedBy}`, {
      eventId: event.eventId, approvalId: event.approvalId,
      decision: event.decision, remaining: event.remainingApprovals,
    });
  }

  async publishWorkflowCompleted(event: WorkflowCompletedEvent): Promise<void> {
    this.logger.log(`[${event.type}] Workflow concluído: ${event.result}`, {
      eventId: event.eventId, workflow: event.workflowSlug,
      result: event.result, transitions: event.totalTransitions,
      durationMs: event.totalElapsedMs,
    });
  }

  async publishTaskAssigned(event: TaskAssignedEvent): Promise<void> {
    this.logger.log(`[${event.type}] Tarefa atribuída: ${event.title} → ${event.assignedTo}`, {
      eventId: event.eventId, taskId: event.taskId,
      mandatory: event.isMandatory, dueDate: event.dueDate,
    });
  }
}
