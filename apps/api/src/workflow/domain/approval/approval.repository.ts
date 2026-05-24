import { ApprovalEntity } from './approval.entity';

export abstract class ApprovalRepository {
  abstract save(approval: ApprovalEntity): Promise<void>;
  abstract findById(id: string): Promise<ApprovalEntity | null>;
  abstract findByInstance(instanceId: string): Promise<ApprovalEntity[]>;
  abstract findPendingByUser(userId: string, tenantId: string): Promise<ApprovalEntity[]>;
  abstract findPendingByStage(instanceId: string, stageId: string): Promise<ApprovalEntity[]>;
  abstract countPendingByInstance(instanceId: string): Promise<number>;
  abstract markExpired(id: string): Promise<void>;
}
