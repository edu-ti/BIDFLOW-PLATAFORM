import { WorkflowDefinitionRepository } from '../../../../domain/definition/workflow-definition.repository';
import { WorkflowInstanceRepository } from '../../../../domain/instance/workflow-instance.repository';
import { DeleteDefinitionCommand } from '../../../common/commands';

export class DeleteDefinitionHandler {
  constructor(
    private readonly defRepo: WorkflowDefinitionRepository,
    private readonly instanceRepo: WorkflowInstanceRepository,
  ) {}

  async execute(command: DeleteDefinitionCommand): Promise<void> {
    const def = await this.defRepo.findById(command.id);
    if (!def) throw new Error('Workflow definition not found');
    if (def.tenantId !== command.tenantId) throw new Error('Tenant mismatch');

    const active = await this.instanceRepo.countActiveByDefinition(command.id, command.tenantId);
    if (active > 0) throw new Error('Cannot delete definition with active instances');

    await this.defRepo.delete(command.id);
  }
}
