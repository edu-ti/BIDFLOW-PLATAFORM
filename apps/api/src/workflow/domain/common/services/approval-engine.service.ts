import { ApprovalEntity } from '../approval/approval.entity';
import { ApprovalMode, ApprovalStatus } from '../common/enums';

export interface ApprovalResolutionResult {
  allResolved: boolean;
  resolved: ApprovalEntity[];
  pending: ApprovalEntity[];
  nextInSequence?: ApprovalEntity;
}

export class ApprovalEngine {
  processDecision(
    approval: ApprovalEntity,
    approvals: ApprovalEntity[],
  ): ApprovalResolutionResult {
    const stageApprovals = approvals.filter(
      a => a.stageId === approval.stageId && a.id !== approval.id,
    );

    const resolved = [...stageApprovals.filter(a => a.isDecided), approval];
    const pending = stageApprovals.filter(a => !a.isDecided);
    const allResolved = pending.length === 0;

    if (approval.approvalMode === ApprovalMode.ALL) {
      const allApproved = resolved.every(a => a.isApproved);
      return {
        allResolved: allApproved,
        resolved,
        pending,
      };
    }

    if (approval.approvalMode === ApprovalMode.ANY) {
      if (approval.isApproved) {
        pending.forEach(a => a.skip());
        return {
          allResolved: true,
          resolved: [...resolved, ...pending],
          pending: [],
        };
      }
      return { allResolved: false, resolved, pending };
    }

    if (approval.approvalMode === ApprovalMode.SEQUENTIAL) {
      const sorted = [...stageApprovals, approval].sort((a, b) => a.order - b.order);
      const currentIndex = sorted.findIndex(a => a.id === approval.id);
      const nextPending = sorted.slice(currentIndex + 1).find(a => !a.isDecided);
      return {
        allResolved: !nextPending,
        resolved: sorted.filter(a => a.isDecided),
        pending: nextPending ? [nextPending] : [],
        nextInSequence: nextPending,
      };
    }

    return { allResolved, resolved, pending };
  }

  canTransition(approvals: ApprovalEntity[], stageId: string): { allowed: boolean; reason?: string } {
    const stageApprovals = approvals.filter(a => a.stageId === stageId);
    if (stageApprovals.length === 0) return { allowed: true };

    const pending = stageApprovals.filter(a => a.status === ApprovalStatus.PENDING);
    if (pending.length > 0) {
      return { allowed: false, reason: `${pending.length} approval(s) still pending` };
    }

    const rejected = stageApprovals.find(a => a.status === ApprovalStatus.REJECTED);
    if (rejected) return { allowed: false, reason: 'Approval was rejected' };

    return { allowed: true };
  }
}
