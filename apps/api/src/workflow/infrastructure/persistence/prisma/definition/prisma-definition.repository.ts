import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowDefinitionRepository, DefinitionFilter } from '../../../domain/definition/workflow-definition.repository';
import { WorkflowDefinitionEntity } from '../../../domain/definition/workflow-definition.entity';
import { WorkflowDefinitionMapper } from '../../mappers';
import { WorkflowDefinitionNotFoundError } from '../../../domain/common/errors';

@Injectable()
export class PrismaWorkflowDefinitionRepository implements WorkflowDefinitionRepository {
  private readonly logger = new Logger(PrismaWorkflowDefinitionRepository.name);
  private readonly mapper = new WorkflowDefinitionMapper();

  constructor(private readonly prisma: PrismaService) {}

  async save(definition: WorkflowDefinitionEntity): Promise<void> {
    const data = this.mapper.toPersistence(definition);
    await this.prisma.workflowDefinition.upsert({
      where: { id: definition.id },
      create: data,
      update: data,
    });
    this.logger.log(`Definition saved: ${definition.id} v${definition.version}`);
  }

  async findById(id: string): Promise<WorkflowDefinitionEntity | null> {
    const record = await this.prisma.workflowDefinition.findUnique({
      where: { id },
      include: { stages: true, transitions: true },
    });
    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async findBySlug(slug: string, tenantId: string): Promise<WorkflowDefinitionEntity | null> {
    const record = await this.prisma.workflowDefinition.findFirst({
      where: { slug, tenantId },
      include: { stages: true, transitions: true },
    });
    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async findMany(filter: DefinitionFilter): Promise<WorkflowDefinitionEntity[]> {
    const where: any = { tenantId: filter.tenantId };
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { slug: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const records = await this.prisma.workflowDefinition.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: ((filter.page ?? 1) - 1) * (filter.limit ?? 20),
      take: filter.limit ?? 20,
    });
    return records.map(r => this.mapper.toDomain({ ...r, stages: [], transitions: [] }));
  }

  async findByEntityType(entityType: string, tenantId: string): Promise<WorkflowDefinitionEntity[]> {
    const records = await this.prisma.workflowDefinition.findMany({
      where: { entityType, tenantId, isActive: true },
    });
    return records.map(r => this.mapper.toDomain({ ...r, stages: [], transitions: [] }));
  }

  async count(filter: DefinitionFilter): Promise<number> {
    const where: any = { tenantId: filter.tenantId };
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    return this.prisma.workflowDefinition.count({ where });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workflowDefinition.delete({ where: { id } });
    this.logger.warn(`Definition deleted: ${id}`);
  }
}
