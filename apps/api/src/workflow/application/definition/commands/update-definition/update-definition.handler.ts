import { WorkflowDefinitionRepository } from '../../../../domain/definition/workflow-definition.repository';
import { UpdateDefinitionCommand } from '../../../common/commands';

export class UpdateDefinitionHandler {
  constructor(private readonly defRepo: WorkflowDefinitionRepository) {}

  async execute(command: UpdateDefinitionCommand): Promise<void> {
    const def = await this.defRepo.findById(command.id);
    if (!def) throw new Error('Workflow definition not found');
    if (def.tenantId !== command.tenantId) throw new Error('Tenant mismatch');
    if (def.isPublished) throw new Error('Cannot update a published definition');

    if (command.name !== undefined) def.name = command.name;
    if (command.description !== undefined) def.description = command.description ?? null;
    if (command.icon !== undefined) def.icon = command.icon ?? null;
    if (command.color !== undefined) def.color = command.color ?? null;
    if (command.isActive !== undefined) def.isActive = command.isActive;
    if (command.maxConcurrentInstances !== undefined) def.maxConcurrentInstances = command.maxConcurrentInstances;
    def.updatedAt = new Date();

    await this.defRepo.save(def);
  }
}
