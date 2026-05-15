import { WorkflowDefinitionRepository } from '../../../../domain/definition/workflow-definition.repository';
import { PublishDefinitionCommand } from '../../../common/commands';
import { DefinitionPublishingService } from '../../../common/services/definition-orchestration.service';

export class PublishDefinitionHandler {
  constructor(
    private readonly publishingService: DefinitionPublishingService,
  ) {}

  async execute(command: PublishDefinitionCommand): Promise<void> {
    await this.publishingService.publishDefinition(command.id, command.tenantId);
  }
}
