import { randomUUID } from 'crypto';
import { StageType } from '../common/enums';
import { ApprovalConfig, ApprovalConfigProps } from '../common/value-objects/approval-config';
import { AssignmentConfig, AssignmentConfigProps } from '../common/value-objects/assignment-config';

export interface CreateStageProps {
  workflowDefinitionId: string;
  slug: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  type: StageType;
  isInitial: boolean;
  isFinal: boolean;
  approvalConfig?: ApprovalConfigProps;
  assignmentConfig?: AssignmentConfigProps;
  deadlineHours?: number;
  notifyOnEnter?: boolean;
  notifyOnExit?: boolean;
  allowRejection?: boolean;
  rejectionTargetStageId?: string;
  metadata?: Record<string, unknown>;
}

export interface StageData {
  id: string;
  workflowDefinitionId: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  color: string | null;
  type: StageType;
  isInitial: boolean;
  isFinal: boolean;
  approvalConfig: Record<string, unknown> | null;
  assignmentConfig: Record<string, unknown> | null;
  deadlineHours: number | null;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
  allowRejection: boolean;
  rejectionTargetStageId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class StageEntity {
  public readonly id: string;
  public readonly workflowDefinitionId: string;
  public slug: string;
  public name: string;
  public description: string | null;
  public order: number;
  public color: string | null;
  public readonly type: StageType;
  public readonly isInitial: boolean;
  public readonly isFinal: boolean;
  public approvalConfig: ApprovalConfig | null;
  public assignmentConfig: AssignmentConfig | null;
  public deadlineHours: number | null;
  public notifyOnEnter: boolean;
  public notifyOnExit: boolean;
  public allowRejection: boolean;
  public rejectionTargetStageId: string | null;
  public metadata: Record<string, unknown>;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: CreateStageProps & { id: string; createdAt: Date; updatedAt: Date }) {
    this.id = props.id;
    this.workflowDefinitionId = props.workflowDefinitionId;
    this.slug = props.slug;
    this.name = props.name;
    this.description = props.description ?? null;
    this.order = props.order;
    this.color = props.color ?? null;
    this.type = props.type;
    this.isInitial = props.isInitial;
    this.isFinal = props.isFinal;
    this.approvalConfig = props.approvalConfig ? new ApprovalConfig(props.approvalConfig) : null;
    this.assignmentConfig = props.assignmentConfig ? new AssignmentConfig(props.assignmentConfig) : null;
    this.deadlineHours = props.deadlineHours ?? null;
    this.notifyOnEnter = props.notifyOnEnter ?? false;
    this.notifyOnExit = props.notifyOnExit ?? false;
    this.allowRejection = props.allowRejection ?? true;
    this.rejectionTargetStageId = props.rejectionTargetStageId ?? null;
    this.metadata = props.metadata ?? {};
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateStageProps): StageEntity {
    if (!props.slug?.trim()) throw new Error('Stage slug is required');
    if (!props.name?.trim()) throw new Error('Stage name is required');
    if (props.order < 1) throw new Error('Stage order must be >= 1');
    if (props.type === StageType.APPROVAL && !props.approvalConfig) {
      throw new Error('Approval stages require approvalConfig');
    }
    if (props.deadlineHours !== undefined && props.deadlineHours < 1) {
      throw new Error('deadlineHours must be >= 1');
    }

    return new StageEntity({
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static restore(data: StageData): StageEntity {
    return new StageEntity({
      id: data.id,
      workflowDefinitionId: data.workflowDefinitionId,
      slug: data.slug,
      name: data.name,
      description: data.description,
      order: data.order,
      color: data.color,
      type: data.type,
      isInitial: data.isInitial,
      isFinal: data.isFinal,
      approvalConfig: data.approvalConfig as ApprovalConfigProps | undefined,
      assignmentConfig: data.assignmentConfig as AssignmentConfigProps | undefined,
      deadlineHours: data.deadlineHours,
      notifyOnEnter: data.notifyOnEnter,
      notifyOnExit: data.notifyOnExit,
      allowRejection: data.allowRejection,
      rejectionTargetStageId: data.rejectionTargetStageId,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  isApprovalStage(): boolean {
    return this.type === StageType.APPROVAL;
  }

  isStandardStage(): boolean {
    return this.type === StageType.STANDARD || this.type === StageType.REVIEW;
  }
}
