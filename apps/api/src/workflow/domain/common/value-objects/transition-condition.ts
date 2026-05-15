export interface TransitionConditionProps {
  requiredRole?: string;
  requiresComment: boolean;
  requiresAttachment: boolean;
  validateExpression?: string;
}

export class TransitionCondition {
  readonly requiredRole?: string;
  readonly requiresComment: boolean;
  readonly requiresAttachment: boolean;
  readonly validateExpression?: string;

  constructor(props: TransitionConditionProps) {
    this.requiredRole = props.requiredRole;
    this.requiresComment = props.requiresComment;
    this.requiresAttachment = props.requiresAttachment;
    this.validateExpression = props.validateExpression;
  }
}
