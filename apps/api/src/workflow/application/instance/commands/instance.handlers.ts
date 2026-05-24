import { WorkflowInstanceRepository } from '../../../domain/instance/workflow-instance.repository';
import { WorkflowDefinitionRepository } from '../../../domain/definition/workflow-definition.repository';
import { StageRepository } from '../../../domain/stage/stage.repository';
import { CreateInstanceCommand, ExecuteTransitionCommand, CancelInstanceCommand, ReassignInstanceCommand } from '../../common/commands';
import { InstanceOrchestrationService } from '../../common/services/instance-orchestration.service';
import { WorkflowInstanceResponseDto, WorkflowInstanceDetailDto } from '../../common/dto';
import { FactoryParams } from '../../../domain/common/services/instance-factory.service';

export class CreateInstanceHandler {
  constructor(
    private readonly orchestration: InstanceOrchestrationService,
    private readonly defRepo: WorkflowDefinitionRepository,
    private readonly stageRepo: StageRepository,
  ) {}

  async execute(command: CreateInstanceCommand): Promise<WorkflowInstanceResponseDto> {
    const definition = await this.defRepo.findById(command.workflowDefinitionId);
    if (!definition) throw new Error('Workflow definition not found');

    const initialStage = definition.getInitialStage();

    const params: FactoryParams = {
      tenantId: command.tenantId,
      workflowDefinitionId: command.workflowDefinitionId,
      workflowVersion: definition.version,
      entityType: command.entityType,
      entityId: command.entityId,
      title: command.title,
      initialStage,
      priority: command.priority,
      data: command.data,
      createdBy: command.createdBy,
      assignedTo: command.assignedTo,
    };

    const instance = await this.orchestration.createInstance(params);
    return instanceToDto(instance);
  }
}

export class ExecuteTransitionHandler {
  constructor(private readonly orchestration: InstanceOrchestrationService) {}

  async execute(command: ExecuteTransitionCommand): Promise<WorkflowInstanceResponseDto> {
    const instance = await this.orchestration.executeTransition(
      command.instanceId, command.transitionSlug,
      command.userId, command.tenantId, command.comment,
    );
    return instanceToDto(instance);
  }
}

export class CancelInstanceHandler {
  constructor(private readonly orchestration: InstanceOrchestrationService) {}

  async execute(command: CancelInstanceCommand): Promise<void> {
    await this.orchestration.cancelInstance(
      command.instanceId, command.reason, command.cancelledBy, command.tenantId,
    );
  }
}

export class ReassignInstanceHandler {
  constructor(private readonly orchestration: InstanceOrchestrationService) {}

  async execute(command: ReassignInstanceCommand): Promise<WorkflowInstanceResponseDto> {
    const instance = await this.orchestration.reassignInstance(
      command.instanceId, command.assignedTo, command.tenantId, command.roleSlug,
    );
    return instanceToDto(instance);
  }
}

function instanceToDto(i: any): WorkflowInstanceResponseDto {
  return {
    id: i.id,
    workflowDefinitionId: i.workflowDefinitionId,
    workflowSlug: i.workflowDefinitionId,
    entityType: i.entityType,
    entityId: i.entityId,
    title: i.title,
    status: i.status,
    currentStage: i.currentStageId,
    enteredStageAt: i.enteredStageAt.toISOString(),
    deadlineAt: i.deadlineAt?.toISOString() ?? null,
    priority: i.priority,
    assignedTo: i.assignedTo,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}
