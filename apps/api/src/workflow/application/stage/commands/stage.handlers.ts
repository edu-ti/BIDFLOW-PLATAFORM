// @ts-nocheck
import { StageRepository } from '../../../domain/stage/stage.repository';
import { StageEntity, CreateStageProps } from '../../../domain/stage/stage.entity';
import { StageType } from '../../../domain/common/enums';
import { CreateStageCommand, UpdateStageCommand, DeleteStageCommand } from '../../common/commands';
import { DefinitionStageService } from '../../common/services/definition-orchestration.service';
import { StageResponseDto } from '../../common/dto';

export class CreateStageHandler {
  constructor(private readonly stageService: DefinitionStageService) {}

  async execute(command: CreateStageCommand): Promise<StageResponseDto> {
    const props: CreateStageProps = {
      workflowDefinitionId: command.workflowDefinitionId,
      slug: command.slug, name: command.name,
      description: command.description, order: command.order,
      color: command.color, type: command.type as StageType,
      isInitial: command.isInitial, isFinal: command.isFinal,
      approvalConfig: command.approvalConfig as any,
      assignmentConfig: command.assignmentConfig as any,
      deadlineHours: command.deadlineHours,
      notifyOnEnter: command.notifyOnEnter,
      notifyOnExit: command.notifyOnExit,
      allowRejection: command.allowRejection,
      rejectionTargetStageId: command.rejectionTargetStageId,
    };

    const stage = await this.stageService.addStageToDefinition(
      command.workflowDefinitionId, command.tenantId, props,
    );

    return stageToDto(stage);
  }
}

export class UpdateStageHandler {
  constructor(private readonly stageService: DefinitionStageService) {}

  async execute(command: UpdateStageCommand): Promise<StageResponseDto> {
    const stage = await this.stageService.updateStage(command.id, command);
    return stageToDto(stage);
  }
}

export class DeleteStageHandler {
  constructor(private readonly stageService: DefinitionStageService) {}

  async execute(command: DeleteStageCommand): Promise<void> {
    await this.stageService.removeStageFromDefinition(
      command.id, command.workflowDefinitionId, command.tenantId,
    );
  }
}

function stageToDto(s: StageEntity): StageResponseDto {
  return {
    id: s.id, slug: s.slug, name: s.name, description: s.description,
    order: s.order, color: s.color, type: s.type,
    isInitial: s.isInitial, isFinal: s.isFinal,
    deadlineHours: s.deadlineHours,
    approvalConfig: s.approvalConfig as Record<string, unknown>,
    assignmentConfig: s.assignmentConfig as Record<string, unknown>,
    createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(),
  };
}
