export type AssignmentMode = 'ROLE' | 'USER' | 'MANAGER' | 'QUEUE' | 'ROUND_ROBIN';

export interface AssignmentConfigProps {
  mode: AssignmentMode;
  roleSlug?: string;
  userId?: string;
}

export class AssignmentConfig {
  readonly mode: AssignmentMode;
  readonly roleSlug?: string;
  readonly userId?: string;

  constructor(props: AssignmentConfigProps) {
    if (props.mode === 'ROLE' && !props.roleSlug) throw new Error('roleSlug required for ROLE mode');
    if (props.mode === 'USER' && !props.userId) throw new Error('userId required for USER mode');
    this.mode = props.mode;
    this.roleSlug = props.roleSlug;
    this.userId = props.userId;
  }
}
