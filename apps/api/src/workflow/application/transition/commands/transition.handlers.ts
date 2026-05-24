// @ts-nocheck
import { TransitionRepository } from '../../../domain/transition/transition.repository';
import { CreateTransitionCommand, DeleteTransitionCommand } from '../../common/commands';
import { DefinitionTransitionService } from '../../common/services/definition-orchestration.service';
import { TransitionResponseDto } from '../../common/dto';

export class CreateTransitionHandler {
  constructor(private readonly transitionService: DefinitionTransitionService) {}

  async execute(command: CreateTransitionCommand): Promise<TransitionResponseDto> {
    const transition = await this.transitionService.addTransitionToDefinition(
      command.workflowDefinitionId, command.tenantId, {
        workflowDefinitionId: command.workflowDefinitionId,
        slug: command.slug, name: command.name,
        fromStageId: command.fromStageId, toStageId: command.toStageId,
        conditions: command.conditions as any,
        permissions: command.permissions as any,
        isAutomatic: command.isAutomatic,
        autoTriggerEvent: command.autoTriggerEvent,
      },
    );

    return {
      id: transition.id, slug: transition.slug, name: transition.name,
      fromStageId: transition.fromStageId, toStageId: transition.toStageId,
      conditions: transition.conditions as Record<string, unknown>,
      isAutomatic: transition.isAutomatic, autoTriggerEvent: transition.autoTriggerEvent,
    };
  }
}

export class DeleteTransitionHandler {
  constructor(private readonly transitionService: DefinitionTransitionService) {}

  async execute(command: DeleteTransitionCommand): Promise<void> {
    await this.transitionService.removeTransitionFromDefinition(
      command.id, command.workflowDefinitionId,
    );
  }
}
