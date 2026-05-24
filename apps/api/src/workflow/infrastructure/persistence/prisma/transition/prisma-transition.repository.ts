import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { TransitionRepository } from '../../../../domain/transition/transition.repository';
import { TransitionEntity } from '../../../../domain/transition/transition.entity';
import { WorkflowDefinitionMapper } from '../../mappers';

@Injectable()
export class PrismaTransitionRepository implements TransitionRepository {
  private readonly logger = new Logger(PrismaTransitionRepository.name);
  private readonly mapper = new WorkflowDefinitionMapper();

  constructor(private readonly prisma: PrismaService) {}

  async save(transition: TransitionEntity): Promise<void> {
    const data = this.mapper.transitionToPersistence(transition);
    await this.prisma.workflowTransition.upsert({
      where: { id: transition.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string): Promise<TransitionEntity | null> {
    const record = await this.prisma.workflowTransition.findUnique({ where: { id } });
    if (!record) return null;
    return this.mapper.transitionToDomain(record);
  }

  async findByDefinition(definitionId: string): Promise<TransitionEntity[]> {
    const records = await this.prisma.workflowTransition.findMany({
      where: { workflowDefinitionId: definitionId },
    });
    return records.map((r: any) => this.mapper.transitionToDomain(r));
  }

  async findAvailable(fromStageId: string): Promise<TransitionEntity[]> {
    const records = await this.prisma.workflowTransition.findMany({
      where: { fromStageId },
    });
    return records.map((r: any) => this.mapper.transitionToDomain(r));
  }

  async findByAutoTriggerEvent(eventType: string, definitionId: string): Promise<TransitionEntity | null> {
    const record = await this.prisma.workflowTransition.findFirst({
      where: { workflowDefinitionId: definitionId, isAutomatic: true, autoTriggerEvent: eventType },
    });
    if (!record) return null;
    return this.mapper.transitionToDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workflowTransition.delete({ where: { id } });
    this.logger.warn(`Transition deleted: ${id}`);
  }
}
