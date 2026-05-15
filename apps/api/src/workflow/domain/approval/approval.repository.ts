import { ApprovalEntity } from './approval.entity';

export interface ApprovalRepository {
  save(approval: ApprovalEntity): Promise<void>;
  findById(id: string): Promise<ApprovalEntity | null>;
  findByInstance(instanceId: string): Promise<ApprovalEntity[]>;
  findPendingByUser(userId: string, tenantId: string): Promise<ApprovalEntity[]>;
  findPendingByStage(instanceId: string, stageId: string): Promise<ApprovalEntity[]>;
  countPendingByInstance(instanceId: string): Promise<number>;
  markExpired(id: string): Promise<void>;
}
