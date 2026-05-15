import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { StageRepository } from '../../../../domain/stage/stage.repository';
import { StageEntity } from '../../../../domain/stage/stage.entity';
import { WorkflowDefinitionMapper } from '../../mappers';

@Injectable()
export class PrismaStageRepository implements StageRepository {
  private readonly logger = new Logger(PrismaStageRepository.name);
  private readonly mapper = new WorkflowDefinitionMapper();

  constructor(private readonly prisma: PrismaService) {}

  async save(stage: StageEntity): Promise<void> {
    const data = this.mapper.stageToPersistence(stage);
    await this.prisma.workflowStage.upsert({
      where: { id: stage.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string): Promise<StageEntity | null> {
    const record = await this.prisma.workflowStage.findUnique({ where: { id } });
    if (!record) return null;
    return this.mapper.stageToDomain(record);
  }

  async findByDefinition(definitionId: string): Promise<StageEntity[]> {
    const records = await this.prisma.workflowStage.findMany({
      where: { workflowDefinitionId: definitionId },
      orderBy: { order: 'asc' },
    });
    return records.map(r => this.mapper.stageToDomain(r));
  }

  async findInitialStage(definitionId: string): Promise<StageEntity | null> {
    const record = await this.prisma.workflowStage.findFirst({
      where: { workflowDefinitionId: definitionId, isInitial: true },
    });
    if (!record) return null;
    return this.mapper.stageToDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workflowStage.delete({ where: { id } });
    this.logger.warn(`Stage deleted: ${id}`);
  }
}
