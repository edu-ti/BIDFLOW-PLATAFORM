import { TransitionEntity } from '../transition/transition.entity';
import { WorkflowInstanceEntity } from '../instance/workflow-instance.entity';
import { StageEntity } from '../stage/stage.entity';
import { WorkflowTaskEntity } from '../task/workflow-task.entity';
import { ApprovalEntity } from '../approval/approval.entity';
import { InstanceStatus, TaskStatus, ApprovalStatus } from '../common/enums';
import { InvalidTransitionError, TransitionNotAllowedError, ApprovalPendingError, MandatoryTasksPendingError } from '../common/errors';

export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
}

export class TransitionValidator {
  validate(
    instance: WorkflowInstanceEntity,
    transition: TransitionEntity,
    userId: string,
    currentStage: StageEntity,
    tasks: WorkflowTaskEntity[],
    approvals: ApprovalEntity[],
    comment?: string,
  ): TransitionValidationResult {
    if (instance.status !== InstanceStatus.ACTIVE) {
      return { valid: false, reason: 'Instance is not active' };
    }

    if (transition.fromStageId !== instance.currentStageId) {
      return { valid: false, reason: 'Transition is not available from current stage' };
    }

    const mandatoryPending = tasks.filter(
      t => t.isMandatory && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.SKIPPED,
    );
    if (mandatoryPending.length > 0) {
      return { valid: false, reason: `${mandatoryPending.length} mandatory task(s) pending` };
    }

    if (currentStage.isApprovalStage()) {
      const approvalsAllowed = this.validateApprovals(approvals, currentStage.id);
      if (!approvalsAllowed.valid) return approvalsAllowed;
    }

    if (currentStage.allowRejection) {
      if (transition.toStageId === currentStage.rejectionTargetStageId && !comment) {
        return { valid: false, reason: 'Comment required for rejection' };
      }
    }

    if (transition.conditions) {
      const cond = transition.conditions;
      if (cond.requiresComment && !comment) {
        return { valid: false, reason: 'Comment is required for this transition' };
      }
      if (cond.requiredRole) {
        return { valid: false, reason: 'Role validation not implemented at domain level' };
      }
    }

    return { valid: true };
  }

  private validateApprovals(
    approvals: ApprovalEntity[],
    stageId: string,
  ): TransitionValidationResult {
    const stageApprovals = approvals.filter(a => a.stageId === stageId);
    if (stageApprovals.length === 0) return { valid: true };

    const pending = stageApprovals.filter(a => a.status === ApprovalStatus.PENDING);
    if (pending.length > 0) {
      return { valid: false, reason: `${pending.length} approval(s) still pending` };
    }

    const rejected = stageApprovals.find(a => a.status === ApprovalStatus.REJECTED);
    if (rejected) return { valid: false, reason: 'Approval was rejected' };

    return { valid: true };
  }
}
