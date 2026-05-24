// @ts-nocheck
import { Command } from '../../../common/interfaces/command';
import { InstancePriority } from '../../../../domain/common/enums';

export class CreateDefinitionCommand extends Command<string> {
  readonly commandName = 'CreateDefinitionCommand';

  constructor(
    readonly tenantId: string,
    readonly name: string,
    readonly slug: string,
    readonly description: string | undefined,
    readonly entityType: string,
    readonly icon: string | undefined,
    readonly color: string | undefined,
    readonly maxConcurrentInstances: number | undefined,
    readonly metadata: Record<string, unknown> | undefined,
    readonly createdBy: string,
  ) { super(); }
}

export class UpdateDefinitionCommand extends Command<void> {
  readonly commandName = 'UpdateDefinitionCommand';
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly name?: string,
    readonly description?: string,
    readonly icon?: string,
    readonly color?: string,
    readonly maxConcurrentInstances?: number,
    readonly isActive?: boolean,
  ) { super(); }
}

export class PublishDefinitionCommand extends Command<void> {
  readonly commandName = 'PublishDefinitionCommand';
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) { super(); }
}

export class CreateDefinitionVersionCommand extends Command<void> {
  readonly commandName = 'CreateDefinitionVersionCommand';
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) { super(); }
}

export class DeleteDefinitionCommand extends Command<void> {
  readonly commandName = 'DeleteDefinitionCommand';
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) { super(); }
}

export class CreateStageCommand extends Command<string> {
  readonly commandName = 'CreateStageCommand';
  constructor(
    readonly workflowDefinitionId: string,
    readonly tenantId: string,
    readonly slug: string,
    readonly name: string,
    readonly description: string | undefined,
    readonly order: number,
    readonly color: string | undefined,
    readonly type: string,
    readonly isInitial: boolean,
    readonly isFinal: boolean,
    readonly approvalConfig: Record<string, unknown> | undefined,
    readonly assignmentConfig: Record<string, unknown> | undefined,
    readonly deadlineHours: number | undefined,
    readonly notifyOnEnter: boolean | undefined,
    readonly notifyOnExit: boolean | undefined,
    readonly allowRejection: boolean | undefined,
    readonly rejectionTargetStageId: string | undefined,
  ) { super(); }
}

export class UpdateStageCommand extends Command<void> {
  readonly commandName = 'UpdateStageCommand';
  constructor(
    readonly id: string,
    readonly name?: string,
    readonly description?: string,
    readonly order?: number,
    readonly deadlineHours?: number,
    readonly color?: string,
  ) { super(); }
}

export class DeleteStageCommand extends Command<void> {
  readonly commandName = 'DeleteStageCommand';
  constructor(
    readonly id: string,
    readonly workflowDefinitionId: string,
    readonly tenantId: string,
  ) { super(); }
}

export class CreateTransitionCommand extends Command<string> {
  readonly commandName = 'CreateTransitionCommand';
  constructor(
    readonly workflowDefinitionId: string,
    readonly tenantId: string,
    readonly slug: string,
    readonly name: string,
    readonly fromStageId: string,
    readonly toStageId: string,
    readonly conditions: Record<string, unknown> | undefined,
    readonly permissions: Record<string, unknown> | undefined,
    readonly isAutomatic: boolean | undefined,
    readonly autoTriggerEvent: string | undefined,
  ) { super(); }
}

export class DeleteTransitionCommand extends Command<void> {
  readonly commandName = 'DeleteTransitionCommand';
  constructor(
    readonly id: string,
    readonly workflowDefinitionId: string,
  ) { super(); }
}

export class CreateInstanceCommand extends Command<string> {
  readonly commandName = 'CreateInstanceCommand';
  constructor(
    readonly tenantId: string,
    readonly workflowDefinitionId: string,
    readonly entityType: string,
    readonly entityId: string,
    readonly title: string,
    readonly priority: InstancePriority | undefined,
    readonly data: Record<string, unknown> | undefined,
    readonly createdBy: string,
    readonly assignedTo: string | undefined,
  ) { super(); }
}

export class ExecuteTransitionCommand extends Command<void> {
  readonly commandName = 'ExecuteTransitionCommand';
  constructor(
    readonly instanceId: string,
    readonly transitionSlug: string,
    readonly userId: string,
    readonly tenantId: string,
    readonly comment: string | undefined,
  ) { super(); }
}

export class CancelInstanceCommand extends Command<void> {
  readonly commandName = 'CancelInstanceCommand';
  constructor(
    readonly instanceId: string,
    readonly reason: string,
    readonly cancelledBy: string,
    readonly tenantId: string,
  ) { super(); }
}

export class ReassignInstanceCommand extends Command<void> {
  readonly commandName = 'ReassignInstanceCommand';
  constructor(
    readonly instanceId: string,
    readonly assignedTo: string,
    readonly tenantId: string,
    readonly roleSlug: string | undefined,
  ) { super(); }
}

export class ApproveCommand extends Command<void> {
  readonly commandName = 'ApproveCommand';
  constructor(
    readonly approvalId: string,
    readonly userId: string,
    readonly tenantId: string,
    readonly comment: string | undefined,
  ) { super(); }
}

export class RejectCommand extends Command<void> {
  readonly commandName = 'RejectCommand';
  constructor(
    readonly approvalId: string,
    readonly userId: string,
    readonly tenantId: string,
    readonly comment: string,
  ) { super(); }
}

export class DelegateApprovalCommand extends Command<void> {
  readonly commandName = 'DelegateApprovalCommand';
  constructor(
    readonly approvalId: string,
    readonly delegatedTo: string,
    readonly userId: string,
    readonly tenantId: string,
  ) { super(); }
}

export class CompleteTaskCommand extends Command<void> {
  readonly commandName = 'CompleteTaskCommand';
  constructor(
    readonly taskId: string,
    readonly userId: string,
    readonly tenantId: string,
    readonly completedData: Record<string, unknown> | undefined,
  ) { super(); }
}
