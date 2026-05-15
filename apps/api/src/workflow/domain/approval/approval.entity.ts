import { randomUUID } from 'crypto';
import { AggregateRoot } from '../common/aggregate-root';
import { ApprovalMode, ApprovalStatus } from '../common/enums';
import { ApprovalGrantedEvent, ApprovalRejectedEvent, ApprovalDelegatedEvent } from '../../domain/events';
import { ApprovalRequestedEvent } from '../../domain/events';
import {
  ApprovalAlreadyDecidedError, MaxDelegationExceededError, SelfApprovalDeniedError,
} from '../common/errors';

export interface CreateApprovalProps {
  tenantId: string;
  workflowInstanceId: string;
  stageId: string;
  approvalMode: ApprovalMode;
  assignedTo: string;
  assignedRole?: string;
  order?: number;
  deadlineAt?: Date;
  allowSelfApproval: boolean;
  canDelegate: boolean;
  instanceCreatedBy: string;
}

export interface ApprovalData {
  id: string;
  tenantId: string;
  workflowInstanceId: string;
  stageId: string;
  status: ApprovalStatus;
  approvalMode: ApprovalMode;
  assignedTo: string;
  assignedRole: string | null;
  order: number;
  decidedAt: Date | null;
  decision: string | null;
  comment: string | null;
  delegatedFrom: string | null;
  delegatedTo: string | null;
  deadlineAt: Date | null;
  remindedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ApprovalEntity extends AggregateRoot {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly workflowInstanceId: string,
    public readonly stageId: string,
    private _status: ApprovalStatus,
    public readonly approvalMode: ApprovalMode,
    public readonly assignedTo: string,
    public readonly assignedRole: string | null,
    public readonly order: number,
    private _decidedAt: Date | null,
    private _decision: string | null,
    private _comment: string | null,
    private _delegatedFrom: string | null,
    private _delegatedTo: string | null,
    public deadlineAt: Date | null,
    public remindedAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) { super(); }

  static create(props: CreateApprovalProps): ApprovalEntity {
    if (!props.assignedTo) throw new Error('assignedTo is required');
    if (!props.allowSelfApproval && props.assignedTo === props.instanceCreatedBy) {
      throw new SelfApprovalDeniedError();
    }

    return new ApprovalEntity(
      randomUUID(), props.tenantId, props.workflowInstanceId,
      props.stageId, ApprovalStatus.PENDING, props.approvalMode,
      props.assignedTo, props.assignedRole ?? null, props.order ?? 1,
      null, null, null, null, null,
      props.deadlineAt ?? null, null,
      new Date(), new Date(),
    );
  }

  static restore(data: ApprovalData): ApprovalEntity {
    return new ApprovalEntity(
      data.id, data.tenantId, data.workflowInstanceId,
      data.stageId, data.status, data.approvalMode,
      data.assignedTo, data.assignedRole, data.order,
      data.decidedAt, data.decision, data.comment,
      data.delegatedFrom, data.delegatedTo, data.deadlineAt,
      data.remindedAt, data.createdAt, data.updatedAt,
    );
  }

  get status(): ApprovalStatus { return this._status; }
  get decision(): string | null { return this._decision; }
  get isDecided(): boolean { return this._status !== ApprovalStatus.PENDING; }
  get isApproved(): boolean { return this._status === ApprovalStatus.APPROVED; }

  approve(comment?: string): void {
    if (this.isDecided) throw new ApprovalAlreadyDecidedError();
    this._status = ApprovalStatus.APPROVED;
    this._decision = 'APPROVED';
    this._comment = comment ?? null;
    this._decidedAt = new Date();
    this.updatedAt = new Date();
    this.addDomainEvent(new ApprovalGrantedEvent(
      this.id, this.tenantId, this.id, this.workflowInstanceId,
      this.assignedTo, comment, 0,
    ));
  }

  reject(comment: string): void {
    if (this.isDecided) throw new ApprovalAlreadyDecidedError();
    if (!comment?.trim()) throw new Error('Comment is required for rejection');
    this._status = ApprovalStatus.REJECTED;
    this._decision = 'REJECTED';
    this._comment = comment;
    this._decidedAt = new Date();
    this.updatedAt = new Date();
    this.addDomainEvent(new ApprovalRejectedEvent(
      this.id, this.tenantId, this.id, this.workflowInstanceId,
      this.assignedTo, comment,
    ));
  }

  delegate(delegatedTo: string): void {
    if (this.isDecided) throw new ApprovalAlreadyDecidedError();
    if (this._delegatedFrom !== null) throw new MaxDelegationExceededError();
    if (delegatedTo === this.assignedTo) throw new Error('Cannot delegate to yourself');

    this._delegatedFrom = this.assignedTo;
    this._delegatedTo = delegatedTo;
    this.updatedAt = new Date();
    this.addDomainEvent(new ApprovalDelegatedEvent(this.id, this.tenantId, this.assignedTo, delegatedTo));
  }

  markExpired(): void {
    if (!this.isDecided) {
      this._status = ApprovalStatus.EXPIRED;
      this.updatedAt = new Date();
    }
  }

  skip(): void {
    if (!this.isDecided) {
      this._status = ApprovalStatus.SKIPPED;
      this.updatedAt = new Date();
    }
  }
}
