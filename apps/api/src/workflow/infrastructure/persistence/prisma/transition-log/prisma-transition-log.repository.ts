import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TransitionLogRepository } from '../../../../domain/transition-log/transition-log.repository';
import { TransitionLogEntity } from '../../../../domain/transition-log/transition-log.entity';
import { TransitionLogMapper } from '../../mappers';

@Injectable()
export class PrismaTransitionLogRepository implements TransitionLogRepository {
  private readonly logger = new Logger(PrismaTransitionLogRepository.name);
  private readonly mapper = new TransitionLogMapper();

  constructor(private readonly prisma: PrismaService) {}

  async save(log: TransitionLogEntity): Promise<void> {
    const data = this.mapper.toPersistence(log);
    await this.prisma.workflowTransitionLog.create({ data });
    this.logger.log(`Transition executed: ${log.transitionSlug} (${log.fromStageName} → ${log.toStageName}) by ${log.executedBy}`);
  }

  async findByInstance(instanceId: string): Promise<TransitionLogEntity[]> {
    const records = await this.prisma.workflowTransitionLog.findMany({
      where: { workflowInstanceId: instanceId },
      orderBy: { executedAt: 'asc' },
    });
    return records.map(r => this.mapper.toDomain(r));
  }

  async countByInstance(instanceId: string): Promise<number> {
    return this.prisma.workflowTransitionLog.count({ where: { workflowInstanceId: instanceId } });
  }
}
