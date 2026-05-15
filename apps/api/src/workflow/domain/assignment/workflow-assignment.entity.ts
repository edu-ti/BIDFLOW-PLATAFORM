import { randomUUID } from 'crypto';
import { AssignmentStatus } from '../common/enums';

export interface CreateAssignmentProps {
  tenantId: string;
  workflowInstanceId: string;
  stageId: string;
  userId: string;
  roleSlug?: string;
  assignedBy: string;
}

export interface AssignmentData {
  id: string;
  tenantId: string;
  workflowInstanceId: string;
  stageId: string;
  userId: string;
  roleSlug: string | null;
  status: AssignmentStatus;
  assignedBy: string;
  assignedAt: Date;
  completedAt: Date | null;
  delegatedTo: string | null;
  createdAt: Date;
}

export class WorkflowAssignmentEntity {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly workflowInstanceId: string;
  public readonly stageId: string;
  public readonly userId: string;
  public readonly roleSlug: string | null;
  private _status: AssignmentStatus;
  public readonly assignedBy: string;
  public readonly assignedAt: Date;
  private _completedAt: Date | null;
  private _delegatedTo: string | null;
  public readonly createdAt: Date;

  constructor(props: AssignmentData) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.workflowInstanceId = props.workflowInstanceId;
    this.stageId = props.stageId;
    this.userId = props.userId;
    this.roleSlug = props.roleSlug;
    this._status = props.status;
    this.assignedBy = props.assignedBy;
    this.assignedAt = props.assignedAt;
    this._completedAt = props.completedAt;
    this._delegatedTo = props.delegatedTo;
    this.createdAt = props.createdAt;
  }

  static create(props: CreateAssignmentProps): WorkflowAssignmentEntity {
    if (!props.userId) throw new Error('userId is required');
    return new WorkflowAssignmentEntity({
      id: randomUUID(),
      tenantId: props.tenantId,
      workflowInstanceId: props.workflowInstanceId,
      stageId: props.stageId,
      userId: props.userId,
      roleSlug: props.roleSlug ?? null,
      status: AssignmentStatus.ACTIVE,
      assignedBy: props.assignedBy,
      assignedAt: new Date(),
      completedAt: null,
      delegatedTo: null,
      createdAt: new Date(),
    });
  }

  static restore(data: AssignmentData): WorkflowAssignmentEntity {
    return new WorkflowAssignmentEntity(data);
  }

  get status(): AssignmentStatus { return this._status; }

  complete(): void {
    this._status = AssignmentStatus.COMPLETED;
    this._completedAt = new Date();
  }

  delegate(delegatedTo: string): void {
    this._delegatedTo = delegatedTo;
    this._status = AssignmentStatus.DELEGATED;
  }

  revoke(): void {
    this._status = AssignmentStatus.REVOKED;
  }
}
