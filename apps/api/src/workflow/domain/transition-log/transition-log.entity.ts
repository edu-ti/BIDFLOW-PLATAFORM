import { randomUUID } from 'crypto';

export interface CreateTransitionLogProps {
  tenantId: string;
  workflowInstanceId: string;
  transitionSlug: string;
  fromStageId: string;
  fromStageName: string;
  toStageId: string;
  toStageName: string;
  executedBy: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}

export interface TransitionLogData {
  id: string;
  tenantId: string;
  workflowInstanceId: string;
  transitionSlug: string;
  fromStageId: string;
  fromStageName: string;
  toStageId: string;
  toStageName: string;
  executedBy: string;
  executedAt: Date;
  comment: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export class TransitionLogEntity {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly workflowInstanceId: string;
  public readonly transitionSlug: string;
  public readonly fromStageId: string;
  public readonly fromStageName: string;
  public readonly toStageId: string;
  public readonly toStageName: string;
  public readonly executedBy: string;
  public readonly executedAt: Date;
  public readonly comment: string | null;
  public readonly metadata: Record<string, unknown>;
  public readonly createdAt: Date;

  constructor(props: TransitionLogData) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.workflowInstanceId = props.workflowInstanceId;
    this.transitionSlug = props.transitionSlug;
    this.fromStageId = props.fromStageId;
    this.fromStageName = props.fromStageName;
    this.toStageId = props.toStageId;
    this.toStageName = props.toStageName;
    this.executedBy = props.executedBy;
    this.executedAt = props.executedAt;
    this.comment = props.comment;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
  }

  static create(props: CreateTransitionLogProps): TransitionLogEntity {
    return new TransitionLogEntity({
      id: randomUUID(),
      tenantId: props.tenantId,
      workflowInstanceId: props.workflowInstanceId,
      transitionSlug: props.transitionSlug,
      fromStageId: props.fromStageId,
      fromStageName: props.fromStageName,
      toStageId: props.toStageId,
      toStageName: props.toStageName,
      executedBy: props.executedBy,
      executedAt: new Date(),
      comment: props.comment ?? null,
      metadata: props.metadata ?? {},
      createdAt: new Date(),
    });
  }

  static restore(data: TransitionLogData): TransitionLogEntity {
    return new TransitionLogEntity(data);
  }
}
