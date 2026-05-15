import { WorkflowDefinitionRepository } from '../../../../domain/definition/workflow-definition.repository';
import { WorkflowDefinitionEntity } from '../../../../domain/definition/workflow-definition.entity';
import { CreateDefinitionCommand } from '../../../common/commands';
import { WorkflowDefinitionResponseDto } from '../../../common/dto';

export class CreateDefinitionHandler {
  constructor(private readonly defRepo: WorkflowDefinitionRepository) {}

  async execute(command: CreateDefinitionCommand): Promise<WorkflowDefinitionResponseDto> {
    const existing = await this.defRepo.findBySlug(command.slug, command.tenantId);
    if (existing) throw new Error(`Slug '${command.slug}' already exists for this tenant`);

    const definition = WorkflowDefinitionEntity.create({
      tenantId: command.tenantId,
      name: command.name,
      slug: command.slug,
      description: command.description,
      entityType: command.entityType,
      icon: command.icon,
      color: command.color,
      maxConcurrentInstances: command.maxConcurrentInstances,
      metadata: command.metadata,
      createdBy: command.createdBy,
    });

    await this.defRepo.save(definition);
    return this.toDto(definition);
  }

  private toDto(d: WorkflowDefinitionEntity): WorkflowDefinitionResponseDto {
    return {
      id: d.id, name: d.name, slug: d.slug,
      description: d.description, entityType: d.entityType,
      version: d.version, isPublished: d.isPublished,
      isActive: d.isActive, publishedAt: d.publishedAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString(),
    };
  }
}
