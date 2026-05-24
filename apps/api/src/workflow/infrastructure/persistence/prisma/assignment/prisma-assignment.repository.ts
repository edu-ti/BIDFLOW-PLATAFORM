import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { WorkflowAssignmentRepository } from '../../../../domain/assignment/workflow-assignment.repository';
import { WorkflowAssignmentEntity } from '../../../../domain/assignment/workflow-assignment.entity';
import { AssignmentMapper } from '../../mappers';

@Injectable()
export class PrismaWorkflowAssignmentRepository implements WorkflowAssignmentRepository {
  private readonly mapper = new AssignmentMapper();

  constructor(private readonly prisma: PrismaService) {}

  async save(assignment: WorkflowAssignmentEntity): Promise<void> {
    const data = this.mapper.toPersistence(assignment);
    await this.prisma.workflowAssignment.upsert({
      where: { id: assignment.id },
      create: data,
      update: data,
    });
  }

  async findByInstance(instanceId: string): Promise<WorkflowAssignmentEntity[]> {
    const records = await this.prisma.workflowAssignment.findMany({
      where: { workflowInstanceId: instanceId },
    });
    return records.map((r: any) => this.mapper.toDomain(r));
  }

  async findActiveByUser(userId: string, tenantId: string): Promise<WorkflowAssignmentEntity[]> {
    const records = await this.prisma.workflowAssignment.findMany({
      where: { userId, tenantId, status: 'ACTIVE' },
    });
    return records.map((r: any) => this.mapper.toDomain(r));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workflowAssignment.delete({ where: { id } });
  }
}
