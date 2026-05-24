import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { WorkflowTimelineEntryRepository, TimelineFilter } from '../../../../domain/timeline/workflow-timeline-entry.repository';
import { WorkflowTimelineEntryEntity } from '../../../../domain/timeline/workflow-timeline-entry.entity';
import { TimelineEntryMapper } from '../../mappers';

@Injectable()
export class PrismaWorkflowTimelineEntryRepository implements WorkflowTimelineEntryRepository {
  private readonly logger = new Logger(PrismaWorkflowTimelineEntryRepository.name);
  private readonly mapper = new TimelineEntryMapper();

  constructor(private readonly prisma: PrismaService) {}

  async save(entry: WorkflowTimelineEntryEntity): Promise<void> {
    const data = this.mapper.toPersistence(entry);
    await this.prisma.workflowTimelineEvent.create({ data });
  }

  async findByInstance(instanceId: string, filter: TimelineFilter): Promise<WorkflowTimelineEntryEntity[]> {
    const records = await this.prisma.workflowTimelineEvent.findMany({
      where: { workflowInstanceId: instanceId },
      orderBy: { occurredAt: 'desc' },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });
    return records.map((r: any) => this.mapper.toDomain(r));
  }

  async createMany(entries: WorkflowTimelineEntryEntity[]): Promise<void> {
    const data = entries.map(e => this.mapper.toPersistence(e));
    await this.prisma.workflowTimelineEvent.createMany({ data });
  }
}
