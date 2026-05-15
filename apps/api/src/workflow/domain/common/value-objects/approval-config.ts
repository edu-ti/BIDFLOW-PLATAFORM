import { ApprovalMode } from '../enums';

export interface ApprovalConfigProps {
  mode: ApprovalMode;
  requiredApprovals: number;
  allowSelfApproval: boolean;
  deadlineHours?: number;
  canDelegate: boolean;
}

export class ApprovalConfig {
  readonly mode: ApprovalMode;
  readonly requiredApprovals: number;
  readonly allowSelfApproval: boolean;
  readonly deadlineHours?: number;
  readonly canDelegate: boolean;

  constructor(props: ApprovalConfigProps) {
    if (props.requiredApprovals < 1) throw new Error('requiredApprovals must be >= 1');
    if (props.deadlineHours !== undefined && props.deadlineHours < 1) {
      throw new Error('deadlineHours must be >= 1');
    }
    this.mode = props.mode;
    this.requiredApprovals = props.requiredApprovals;
    this.allowSelfApproval = props.allowSelfApproval;
    this.deadlineHours = props.deadlineHours;
    this.canDelegate = props.canDelegate;
  }

  equals(other: ApprovalConfig): boolean {
    return this.mode === other.mode
      && this.requiredApprovals === other.requiredApprovals
      && this.allowSelfApproval === other.allowSelfApproval;
  }
}
