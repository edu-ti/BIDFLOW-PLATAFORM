import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ApprovalRepository } from '../../../../domain/approval/approval.repository';
import { ApprovalEntity } from '../../../../domain/approval/approval.entity';
import { ApprovalMapper } from '../../mappers';
import { ApprovalStatus } from '../../../../domain/common/enums';

@Injectable()
export class PrismaApprovalRepository implements ApprovalRepository {
  private readonly logger = new Logger(PrismaApprovalRepository.name);
  private readonly mapper = new ApprovalMapper();

  constructor(private readonly prisma: PrismaService) {}

  async save(approval: ApprovalEntity): Promise<void> {
    const data = this.mapper.toPersistence(approval);
    await this.prisma.workflowApproval.upsert({
      where: { id: approval.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string): Promise<ApprovalEntity | null> {
    const record = await this.prisma.workflowApproval.findUnique({ where: { id } });
    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async findByInstance(instanceId: string): Promise<ApprovalEntity[]> {
    const records = await this.prisma.workflowApproval.findMany({
      where: { workflowInstanceId: instanceId },
      orderBy: { order: 'asc' },
    });
    return records.map(r => this.mapper.toDomain(r));
  }

  async findPendingByUser(userId: string, tenantId: string): Promise<ApprovalEntity[]> {
    const records = await this.prisma.workflowApproval.findMany({
      where: {
        tenantId,
        status: ApprovalStatus.PENDING,
        OR: [
          { assignedTo: userId },
          { delegatedTo: userId },
        ],
      },
      orderBy: { deadlineAt: 'asc' },
    });
    return records.map(r => this.mapper.toDomain(r));
  }

  async findPendingByStage(instanceId: string, stageId: string): Promise<ApprovalEntity[]> {
    const records = await this.prisma.workflowApproval.findMany({
      where: { workflowInstanceId: instanceId, stageId, status: ApprovalStatus.PENDING },
    });
    return records.map(r => this.mapper.toDomain(r));
  }

  async countPendingByInstance(instanceId: string): Promise<number> {
    return this.prisma.workflowApproval.count({
      where: { workflowInstanceId: instanceId, status: ApprovalStatus.PENDING },
    });
  }

  async markExpired(id: string): Promise<void> {
    await this.prisma.workflowApproval.update({
      where: { id },
      data: { status: ApprovalStatus.EXPIRED, updatedAt: new Date() },
    });
    this.logger.warn(`Approval expired: ${id}`);
  }
}
