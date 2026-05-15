import { WorkflowDefinitionRepository } from '../../../../domain/definition/workflow-definition.repository';
import { CreateDefinitionVersionCommand } from '../../../common/commands';

export class CreateDefinitionVersionHandler {
  constructor(private readonly defRepo: WorkflowDefinitionRepository) {}

  async execute(command: CreateDefinitionVersionCommand): Promise<void> {
    const def = await this.defRepo.findById(command.id);
    if (!def) throw new Error('Workflow definition not found');
    if (def.tenantId !== command.tenantId) throw new Error('Tenant mismatch');

    def.createNewVersion();
    await this.defRepo.save(def);
  }
}
