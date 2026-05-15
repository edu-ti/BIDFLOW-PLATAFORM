import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkflowTaskRepository } from '../../../../domain/task/workflow-task.repository';
import { WorkflowTaskEntity } from '../../../../domain/task/workflow-task.entity';
import { WorkflowTaskMapper } from '../../mappers';
import { TaskStatus } from '../../../../domain/common/enums';

@Injectable()
export class PrismaWorkflowTaskRepository implements WorkflowTaskRepository {
  private readonly logger = new Logger(PrismaWorkflowTaskRepository.name);
  private readonly mapper = new WorkflowTaskMapper();

  constructor(private readonly prisma: PrismaService) {}

  async save(task: WorkflowTaskEntity): Promise<void> {
    const data = this.mapper.toPersistence(task);
    await this.prisma.workflowTask.upsert({
      where: { id: task.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string): Promise<WorkflowTaskEntity | null> {
    const record = await this.prisma.workflowTask.findUnique({ where: { id } });
    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async findByInstance(instanceId: string): Promise<WorkflowTaskEntity[]> {
    const records = await this.prisma.workflowTask.findMany({
      where: { workflowInstanceId: instanceId },
    });
    return records.map(r => this.mapper.toDomain(r));
  }

  async findPendingByUser(userId: string, tenantId: string): Promise<WorkflowTaskEntity[]> {
    const records = await this.prisma.workflowTask.findMany({
      where: { assignedTo: userId, tenantId, status: TaskStatus.PENDING },
      orderBy: { dueDate: 'asc' },
    });
    return records.map(r => this.mapper.toDomain(r));
  }

  async countMandatoryPending(instanceId: string): Promise<number> {
    return this.prisma.workflowTask.count({
      where: {
        workflowInstanceId: instanceId,
        isMandatory: true,
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.SKIPPED] },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workflowTask.delete({ where: { id } });
  }
}
