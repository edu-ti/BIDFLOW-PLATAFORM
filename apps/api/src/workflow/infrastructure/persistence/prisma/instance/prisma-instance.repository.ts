import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowInstanceRepository, InstanceFilter } from '../../../../domain/instance/workflow-instance.repository';
import { WorkflowInstanceEntity } from '../../../../domain/instance/workflow-instance.entity';
import { WorkflowInstanceMapper } from '../../mappers';
import { InstanceStatus } from '../../../../domain/common/enums';

@Injectable()
export class PrismaWorkflowInstanceRepository implements WorkflowInstanceRepository {
  private readonly logger = new Logger(PrismaWorkflowInstanceRepository.name);
  private readonly mapper = new WorkflowInstanceMapper();

  constructor(private readonly prisma: PrismaService) {}

  async save(instance: WorkflowInstanceEntity): Promise<void> {
    const data = this.mapper.toPersistence(instance);
    await this.prisma.workflowInstance.upsert({
      where: { id: instance.id },
      create: data,
      update: data,
    });
    this.logger.log(`Instance ${instance.id} → ${instance.status} (stage: ${instance.currentStageId})`);
  }

  async findById(id: string): Promise<WorkflowInstanceEntity | null> {
    const record = await this.prisma.workflowInstance.findUnique({ where: { id } });
    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async findMany(filter: InstanceFilter): Promise<WorkflowInstanceEntity[]> {
    const where: any = { tenantId: filter.tenantId };
    if (filter.status?.length) where.status = { in: filter.status };
    if (filter.workflowDefinitionId) where.workflowDefinitionId = filter.workflowDefinitionId;
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.assignedTo) where.assignedTo = filter.assignedTo;

    const records = await this.prisma.workflowInstance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: ((filter.page ?? 1) - 1) * (filter.limit ?? 50),
      take: filter.limit ?? 50,
    });
    return records.map(r => this.mapper.toDomain(r));
  }

  async count(filter: InstanceFilter): Promise<number> {
    const where: any = { tenantId: filter.tenantId };
    if (filter.status?.length) where.status = { in: filter.status };
    if (filter.workflowDefinitionId) where.workflowDefinitionId = filter.workflowDefinitionId;
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.assignedTo) where.assignedTo = filter.assignedTo;
    return this.prisma.workflowInstance.count({ where });
  }

  async findByEntity(entityType: string, entityId: string, tenantId: string): Promise<WorkflowInstanceEntity | null> {
    const record = await this.prisma.workflowInstance.findFirst({
      where: {
        workflowDefinitionId: { not: undefined },
        entityType, entityId, tenantId,
        status: { not: InstanceStatus.ARCHIVED },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async findOverdue(tenantId: string): Promise<WorkflowInstanceEntity[]> {
    const records = await this.prisma.workflowInstance.findMany({
      where: {
        tenantId,
        status: InstanceStatus.ACTIVE,
        deadlineAt: { lte: new Date(), not: null },
      },
      orderBy: { deadlineAt: 'asc' },
    });
    return records.map(r => this.mapper.toDomain(r));
  }

  async findActiveByDefinition(definitionId: string, tenantId: string): Promise<WorkflowInstanceEntity[]> {
    const records = await this.prisma.workflowInstance.findMany({
      where: { workflowDefinitionId: definitionId, tenantId, status: InstanceStatus.ACTIVE },
    });
    return records.map(r => this.mapper.toDomain(r));
  }

  async countActiveByDefinition(definitionId: string, tenantId: string): Promise<number> {
    return this.prisma.workflowInstance.count({
      where: { workflowDefinitionId: definitionId, tenantId, status: InstanceStatus.ACTIVE },
    });
  }

  async findByAssignedUser(userId: string, tenantId: string): Promise<WorkflowInstanceEntity[]> {
    const records = await this.prisma.workflowInstance.findMany({
      where: { assignedTo: userId, tenantId, status: InstanceStatus.ACTIVE },
    });
    return records.map(r => this.mapper.toDomain(r));
  }
}
