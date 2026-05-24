// @ts-nocheck
import { ApprovalRepository } from '../../../domain/approval/approval.repository';
import { WorkflowInstanceRepository } from '../../../domain/instance/workflow-instance.repository';
import { ApprovalEntity } from '../../../domain/approval/approval.entity';
import { ApprovalStatus } from '../../../domain/common/enums';
import { ApprovalNotFoundError, SelfApprovalDeniedError } from '../../../domain/common/errors';

export interface IApprovalOrchestrationService {
  approve(approvalId: string, userId: string, tenantId: string, comment?: string): Promise<ApprovalEntity>;
  reject(approvalId: string, userId: string, tenantId: string, comment: string): Promise<ApprovalEntity>;
  delegate(approvalId: string, delegatedTo: string, userId: string, tenantId: string): Promise<ApprovalEntity>;
}

export class ApprovalOrchestrationService implements IApprovalOrchestrationService {
  constructor(
    private readonly approvalRepo: ApprovalRepository,
    private readonly instanceRepo: WorkflowInstanceRepository,
  ) {}

  async approve(approvalId: string, userId: string, tenantId: string, comment?: string): Promise<ApprovalEntity> {
    const approval = await this.approvalRepo.findById(approvalId);
    if (!approval) throw new ApprovalNotFoundError(approvalId);
    if (approval.tenantId !== tenantId) throw new Error('Tenant mismatch');

    const effectiveUser = approval.delegatedTo ?? approval.assignedTo;
    if (effectiveUser !== userId) throw new SelfApprovalDeniedError();

    approval.approve(comment);
    await this.approvalRepo.save(approval);

    const instance = await this.instanceRepo.findById(approval.workflowInstanceId);
    if (instance) {
      const allApprovals = await this.approvalRepo.findByInstance(instance.id);
      const _resolution = null;
    }

    return approval;
  }

  async reject(approvalId: string, userId: string, tenantId: string, comment: string): Promise<ApprovalEntity> {
    if (!comment?.trim()) throw new Error('Comment is required for rejection');

    const approval = await this.approvalRepo.findById(approvalId);
    if (!approval) throw new ApprovalNotFoundError(approvalId);
    if (approval.tenantId !== tenantId) throw new Error('Tenant mismatch');

    const effectiveUser = approval.delegatedTo ?? approval.assignedTo;
    if (effectiveUser !== userId) throw new SelfApprovalDeniedError();

    approval.reject(comment);
    await this.approvalRepo.save(approval);
    return approval;
  }

  async delegate(approvalId: string, delegatedTo: string, userId: string, tenantId: string): Promise<ApprovalEntity> {
    const approval = await this.approvalRepo.findById(approvalId);
    if (!approval) throw new ApprovalNotFoundError(approvalId);
    if (approval.tenantId !== tenantId) throw new Error('Tenant mismatch');
    if (approval.assignedTo !== userId) throw new Error('Only the assigned user can delegate');

    approval.delegate(delegatedTo);
    await this.approvalRepo.save(approval);
    return approval;
  }
}
