import { randomUUID } from 'crypto';
import { AggregateRoot } from '../common/aggregate-root';
import { InstanceStatus, InstancePriority } from '../common/enums';
import { WorkflowInstanceCreatedEvent, WorkflowTransitionExecutedEvent, WorkflowInstanceCompletedEvent, WorkflowInstanceCancelledEvent } from './events';
import { InvalidTransitionError, InstanceAlreadyCompletedError, MaxConcurrentInstancesError } from '../common/errors';

export interface CreateInstanceProps {
  tenantId: string;
  workflowDefinitionId: string;
  workflowVersion: number;
  entityType: string;
  entityId: string;
  title: string;
  currentStageId: string;
  priority?: InstancePriority;
  assignedTo?: string;
  assignedRole?: string;
  data?: Record<string, unknown>;
  createdBy: string;
  maxConcurrentInstances?: number;
  existingActiveCount?: number;
  deadlineAt?: Date;
}

export interface InstanceData {
  id: string;
  tenantId: string;
  workflowDefinitionId: string;
  workflowVersion: number;
  entityType: string;
  entityId: string;
  title: string;
  status: InstanceStatus;
  currentStageId: string;
  enteredStageAt: Date;
  deadlineAt: Date | null;
  priority: InstancePriority;
  assignedTo: string | null;
  assignedRole: string | null;
  data: Record<string, unknown>;
  startedAt: Date;
  completedAt: Date | null;
  completedBy: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowInstanceEntity extends AggregateRoot {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly workflowDefinitionId: string,
    public readonly workflowVersion: number,
    public readonly entityType: string,
    public readonly entityId: string,
    public title: string,
    private _status: InstanceStatus,
    private _currentStageId: string,
    public enteredStageAt: Date,
    public deadlineAt: Date | null,
    public priority: InstancePriority,
    public assignedTo: string | null,
    public assignedRole: string | null,
    public data: Record<string, unknown>,
    public readonly startedAt: Date,
    public completedAt: Date | null,
    public completedBy: string | null,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) { super(); }

  static create(props: CreateInstanceProps): WorkflowInstanceEntity {
    if (!props.title?.trim()) throw new Error('Title is required');
    if (!props.entityType) throw new Error('EntityType is required');
    if (!props.entityId) throw new Error('EntityId is required');
    if (!props.currentStageId) throw new Error('CurrentStageId is required');

    if (props.maxConcurrentInstances !== undefined && props.maxConcurrentInstances > 0) {
      if ((props.existingActiveCount ?? 0) >= props.maxConcurrentInstances) {
        throw new MaxConcurrentInstancesError(props.maxConcurrentInstances);
      }
    }

    const now = new Date();
    const instance = new WorkflowInstanceEntity(
      randomUUID(), props.tenantId, props.workflowDefinitionId,
      props.workflowVersion, props.entityType, props.entityId,
      props.title.trim(), InstanceStatus.ACTIVE, props.currentStageId,
      now, props.deadlineAt ?? null,
      props.priority ?? InstancePriority.NORMAL,
      props.assignedTo ?? null, props.assignedRole ?? null,
      props.data ?? {}, now, null, null,
      props.createdBy, now, now,
    );

    instance.addDomainEvent(new WorkflowInstanceCreatedEvent(
      instance.id, props.tenantId, props.workflowDefinitionId,
      props.entityType, props.entityId, props.currentStageId,
      props.assignedTo,
    ));
    return instance;
  }

  static restore(data: InstanceData): WorkflowInstanceEntity {
    return new WorkflowInstanceEntity(
      data.id, data.tenantId, data.workflowDefinitionId,
      data.workflowVersion, data.entityType, data.entityId,
      data.title, data.status, data.currentStageId,
      data.enteredStageAt, data.deadlineAt, data.priority,
      data.assignedTo, data.assignedRole, data.data,
      data.startedAt, data.completedAt, data.completedBy,
      data.createdBy, data.createdAt, data.updatedAt,
    );
  }

  get status(): InstanceStatus { return this._status; }
  get currentStageId(): string { return this._currentStageId; }
  get isActive(): boolean { return this._status === InstanceStatus.ACTIVE; }
  get isCompleted(): boolean { return this._status === InstanceStatus.COMPLETED; }
  get isCancelled(): boolean { return this._status === InstanceStatus.CANCELLED; }

  moveToStage(stageId: string, deadlineAt?: Date): void {
    if (this._status !== InstanceStatus.ACTIVE) {
      throw new InstanceAlreadyCompletedError();
    }
    this._currentStageId = stageId;
    this.enteredStageAt = new Date();
    this.deadlineAt = deadlineAt ?? null;
    this.updatedAt = new Date();
  }

  complete(completedBy: string): void {
    if (this._status !== InstanceStatus.ACTIVE) {
      throw new InstanceAlreadyCompletedError();
    }
    this._status = InstanceStatus.COMPLETED;
    this.completedAt = new Date();
    this.completedBy = completedBy;
    this.updatedAt = new Date();
  }

  cancel(reason: string, cancelledBy: string): void {
    if (this._status === InstanceStatus.COMPLETED) {
      throw new InstanceAlreadyCompletedError();
    }
    this._status = InstanceStatus.CANCELLED;
    this.completedAt = new Date();
    this.completedBy = cancelledBy;
    this.updatedAt = new Date();
    this.addDomainEvent(new WorkflowInstanceCancelledEvent(this.id, this.tenantId, reason, cancelledBy));
  }

  reject(rejectedBy: string): void {
    this._status = InstanceStatus.REJECTED;
    this.completedAt = new Date();
    this.completedBy = rejectedBy;
    this.updatedAt = new Date();
  }

  updateDeadline(deadlineAt: Date): void {
    this.deadlineAt = deadlineAt;
    this.updatedAt = new Date();
  }

  reassign(assignedTo: string, roleSlug?: string): void {
    this.assignedTo = assignedTo;
    this.assignedRole = roleSlug ?? null;
    this.updatedAt = new Date();
  }

  setPriority(priority: InstancePriority): void {
    this.priority = priority;
    this.updatedAt = new Date();
  }

  publishTransitionExecuted(transitionSlug: string, fromStage: string, toStage: string, executedBy: string): void {
    if (this._status !== InstanceStatus.ACTIVE) return;
    this.addDomainEvent(new WorkflowTransitionExecutedEvent(
      this.id, this.tenantId, transitionSlug, fromStage, toStage, executedBy,
    ));
  }

  publishCompleted(workflowSlug: string, completedBy: string): void {
    this.addDomainEvent(new WorkflowInstanceCompletedEvent(
      this.id, this.tenantId, workflowSlug, this.entityType, this.entityId, completedBy,
    ));
  }
}
