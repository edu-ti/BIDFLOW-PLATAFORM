import { ApprovalRepository } from '../../../../domain/approval/approval.repository';
import { ListApprovalsQuery } from '../../../common/queries';
import { ApproveCommand, RejectCommand, DelegateApprovalCommand } from '../../../common/commands';
import { ApprovalOrchestrationService } from '../../../common/services/approval-orchestration.service';
import { ApprovalResponseDto } from '../../../common/dto';

export class ListApprovalsHandler {
  constructor(private readonly approvalRepo: ApprovalRepository) {}

  async execute(query: ListApprovalsQuery): Promise<ApprovalResponseDto[]> {
    const approvals = await this.approvalRepo.findByInstance(query.instanceId);
    return approvals.map(a => ({
      id: a.id, status: a.status, approvalMode: a.approvalMode,
      assignedTo: a.assignedTo, assignedRole: a.assignedRole,
      order: a.order, decidedAt: (a as any)['_decidedAt']?.toISOString() ?? null,
      decision: (a as any)['_decision'], comment: (a as any)['_comment'],
      delegatedTo: (a as any)['_delegatedTo'],
      deadlineAt: a.deadlineAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    }));
  }
}

export class ApproveHandler {
  constructor(private readonly orchestration: ApprovalOrchestrationService) {}

  async execute(command: ApproveCommand): Promise<ApprovalResponseDto> {
    const approval = await this.orchestration.approve(
      command.approvalId, command.userId, command.tenantId, command.comment,
    );
    return {
      id: approval.id, status: approval.status, approvalMode: approval.approvalMode,
      assignedTo: approval.assignedTo, assignedRole: approval.assignedRole,
      order: approval.order,
      decidedAt: (approval as any)['_decidedAt']?.toISOString() ?? null,
      decision: (approval as any)['_decision'],
      comment: (approval as any)['_comment'],
      delegatedTo: (approval as any)['_delegatedTo'],
      deadlineAt: approval.deadlineAt?.toISOString() ?? null,
      createdAt: approval.createdAt.toISOString(),
    };
  }
}

export class RejectHandler {
  constructor(private readonly orchestration: ApprovalOrchestrationService) {}

  async execute(command: RejectCommand): Promise<ApprovalResponseDto> {
    const approval = await this.orchestration.reject(
      command.approvalId, command.userId, command.tenantId, command.comment,
    );
    return {
      id: approval.id, status: approval.status, approvalMode: approval.approvalMode,
      assignedTo: approval.assignedTo, assignedRole: approval.assignedRole,
      order: approval.order,
      decidedAt: (approval as any)['_decidedAt']?.toISOString() ?? null,
      decision: (approval as any)['_decision'],
      comment: (approval as any)['_comment'],
      delegatedTo: (approval as any)['_delegatedTo'],
      deadlineAt: approval.deadlineAt?.toISOString() ?? null,
      createdAt: approval.createdAt.toISOString(),
    };
  }
}

export class DelegateApprovalHandler {
  constructor(private readonly orchestration: ApprovalOrchestrationService) {}

  async execute(command: DelegateApprovalCommand): Promise<ApprovalResponseDto> {
    const approval = await this.orchestration.delegate(
      command.approvalId, command.delegatedTo, command.userId, command.tenantId,
    );
    return {
      id: approval.id, status: approval.status, approvalMode: approval.approvalMode,
      assignedTo: approval.assignedTo, assignedRole: approval.assignedRole,
      order: approval.order,
      decidedAt: (approval as any)['_decidedAt']?.toISOString() ?? null,
      decision: (approval as any)['_decision'],
      comment: (approval as any)['_comment'],
      delegatedTo: (approval as any)['_delegatedTo'],
      deadlineAt: approval.deadlineAt?.toISOString() ?? null,
      createdAt: approval.createdAt.toISOString(),
    };
  }
}
