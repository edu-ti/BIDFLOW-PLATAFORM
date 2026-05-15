import { randomUUID } from 'crypto';
import { TaskType, TaskStatus } from '../common/enums';
import { AggregateRoot } from '../common/aggregate-root';
import { WorkflowTaskCompletedEvent } from './events';

export interface CreateWorkflowTaskProps {
  tenantId: string;
  workflowInstanceId: string;
  stageId: string;
  title: string;
  description?: string;
  type: TaskType;
  assignedTo?: string;
  assignedBy?: string;
  isMandatory?: boolean;
  dueDate?: Date;
}

export interface WorkflowTaskData {
  id: string;
  tenantId: string;
  workflowInstanceId: string;
  stageId: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  assignedTo: string | null;
  assignedBy: string | null;
  isMandatory: boolean;
  dueDate: Date | null;
  completedAt: Date | null;
  completedBy: string | null;
  completedData: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowTaskEntity extends AggregateRoot {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly workflowInstanceId: string,
    public readonly stageId: string,
    public readonly title: string,
    public description: string | null,
    public readonly type: TaskType,
    private _status: TaskStatus,
    public assignedTo: string | null,
    public assignedBy: string | null,
    public readonly isMandatory: boolean,
    public dueDate: Date | null,
    private _completedAt: Date | null,
    private _completedBy: string | null,
    private _completedData: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) { super(); }

  static create(props: CreateWorkflowTaskProps): WorkflowTaskEntity {
    if (!props.title?.trim()) throw new Error('Task title is required');

    return new WorkflowTaskEntity(
      randomUUID(), props.tenantId, props.workflowInstanceId,
      props.stageId, props.title.trim(), props.description ?? null,
      props.type, TaskStatus.PENDING,
      props.assignedTo ?? null, props.assignedBy ?? null,
      props.isMandatory ?? true, props.dueDate ?? null,
      null, null, null, new Date(), new Date(),
    );
  }

  static restore(data: WorkflowTaskData): WorkflowTaskEntity {
    return new WorkflowTaskEntity(
      data.id, data.tenantId, data.workflowInstanceId,
      data.stageId, data.title, data.description,
      data.type, data.status,
      data.assignedTo, data.assignedBy, data.isMandatory,
      data.dueDate, data.completedAt, data.completedBy,
      data.completedData, data.createdAt, data.updatedAt,
    );
  }

  get status(): TaskStatus { return this._status; }
  get isCompleted(): boolean { return this._status === TaskStatus.COMPLETED; }

  complete(completedBy: string, completedData?: Record<string, unknown>): void {
    if (this._status === TaskStatus.COMPLETED) return;
    if (this._status === TaskStatus.CANCELLED) {
      throw new Error('Cannot complete a cancelled task');
    }
    this._status = TaskStatus.COMPLETED;
    this._completedAt = new Date();
    this._completedBy = completedBy;
    this._completedData = completedData ?? null;
    this.updatedAt = new Date();
    this.addDomainEvent(new WorkflowTaskCompletedEvent(
      this.id, this.tenantId, this.workflowInstanceId,
      this.title, completedBy, completedData,
    ));
  }

  cancel(): void {
    if (this._status === TaskStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed task');
    }
    this._status = TaskStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  startProgress(): void {
    if (this._status === TaskStatus.PENDING) {
      this._status = TaskStatus.IN_PROGRESS;
      this.updatedAt = new Date();
    }
  }
}
