import { randomUUID } from 'crypto';
import { TimelineEntryType } from '../common/enums';

export interface CreateTimelineEntryProps {
  tenantId: string;
  workflowInstanceId: string;
  type: TimelineEntryType;
  title: string;
  description?: string;
  transitionLogId?: string;
  approvalId?: string;
  taskId?: string;
  occurredAt: Date;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

export interface TimelineEntryData {
  id: string;
  tenantId: string;
  workflowInstanceId: string;
  type: TimelineEntryType;
  title: string;
  description: string | null;
  transitionLogId: string | null;
  approvalId: string | null;
  taskId: string | null;
  occurredAt: Date;
  createdBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export class WorkflowTimelineEntryEntity {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly workflowInstanceId: string;
  public readonly type: TimelineEntryType;
  public readonly title: string;
  public readonly description: string | null;
  public readonly transitionLogId: string | null;
  public readonly approvalId: string | null;
  public readonly taskId: string | null;
  public readonly occurredAt: Date;
  public readonly createdBy: string | null;
  public readonly metadata: Record<string, unknown>;
  public readonly createdAt: Date;

  constructor(props: TimelineEntryData) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.workflowInstanceId = props.workflowInstanceId;
    this.type = props.type;
    this.title = props.title;
    this.description = props.description;
    this.transitionLogId = props.transitionLogId;
    this.approvalId = props.approvalId;
    this.taskId = props.taskId;
    this.occurredAt = props.occurredAt;
    this.createdBy = props.createdBy;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
  }

  static create(props: CreateTimelineEntryProps): WorkflowTimelineEntryEntity {
    if (!props.title?.trim()) throw new Error('Timeline entry title is required');
    if (props.type === TimelineEntryType.APPROVED && !props.approvalId) {
      throw new Error('approvalId is required for APPROVED type');
    }
    if (props.type === TimelineEntryType.TRANSITION_EXECUTED && !props.transitionLogId) {
      throw new Error('transitionLogId is required for TRANSITION_EXECUTED type');
    }

    return new WorkflowTimelineEntryEntity({
      id: randomUUID(),
      tenantId: props.tenantId,
      workflowInstanceId: props.workflowInstanceId,
      type: props.type,
      title: props.title.trim(),
      description: props.description ?? null,
      transitionLogId: props.transitionLogId ?? null,
      approvalId: props.approvalId ?? null,
      taskId: props.taskId ?? null,
      occurredAt: props.occurredAt,
      createdBy: props.createdBy ?? null,
      metadata: props.metadata ?? {},
      createdAt: new Date(),
    });
  }

  static restore(data: TimelineEntryData): WorkflowTimelineEntryEntity {
    return new WorkflowTimelineEntryEntity(data);
  }
}
