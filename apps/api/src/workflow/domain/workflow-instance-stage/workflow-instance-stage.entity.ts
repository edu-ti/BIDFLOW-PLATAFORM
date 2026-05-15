import { randomUUID } from 'crypto';
import { StageType } from '../common/enums';

export interface CreateInstanceStageProps {
  tenantId: string;
  workflowInstanceId: string;
  stageId: string;
  stageSlug: string;
  stageName: string;
  stageOrder: number;
  stageType: StageType;
  enteredAt: Date;
  transitionLogId?: string;
}

export interface InstanceStageData {
  id: string;
  tenantId: string;
  workflowInstanceId: string;
  stageId: string;
  stageSlug: string;
  stageName: string;
  stageOrder: number;
  stageType: StageType;
  enteredAt: Date;
  exitedAt: Date | null;
  transitionLogId: string | null;
  durationSeconds: number | null;
  createdAt: Date;
}

export class WorkflowInstanceStageEntity {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly workflowInstanceId: string;
  public readonly stageId: string;
  public readonly stageSlug: string;
  public readonly stageName: string;
  public readonly stageOrder: number;
  public readonly stageType: StageType;
  public readonly enteredAt: Date;
  private _exitedAt: Date | null;
  public readonly transitionLogId: string | null;
  private _durationSeconds: number | null;
  public readonly createdAt: Date;

  constructor(data: InstanceStageData) {
    this.id = data.id;
    this.tenantId = data.tenantId;
    this.workflowInstanceId = data.workflowInstanceId;
    this.stageId = data.stageId;
    this.stageSlug = data.stageSlug;
    this.stageName = data.stageName;
    this.stageOrder = data.stageOrder;
    this.stageType = data.stageType;
    this.enteredAt = data.enteredAt;
    this._exitedAt = data.exitedAt;
    this.transitionLogId = data.transitionLogId;
    this._durationSeconds = data.durationSeconds;
    this.createdAt = data.createdAt;
  }

  static create(props: CreateInstanceStageProps): WorkflowInstanceStageEntity {
    return new WorkflowInstanceStageEntity({
      id: randomUUID(),
      tenantId: props.tenantId,
      workflowInstanceId: props.workflowInstanceId,
      stageId: props.stageId,
      stageSlug: props.stageSlug,
      stageName: props.stageName,
      stageOrder: props.stageOrder,
      stageType: props.stageType,
      enteredAt: props.enteredAt,
      exitedAt: null,
      transitionLogId: props.transitionLogId ?? null,
      durationSeconds: null,
      createdAt: new Date(),
    });
  }

  static restore(data: InstanceStageData): WorkflowInstanceStageEntity {
    return new WorkflowInstanceStageEntity(data);
  }

  get exitedAt(): Date | null { return this._exitedAt; }
  get durationSeconds(): number | null { return this._durationSeconds; }
  get isActive(): boolean { return this._exitedAt === null; }

  exit(transitionLogId?: string): void {
    if (this._exitedAt !== null) {
      throw new Error('Stage already exited');
    }
    this._exitedAt = new Date();
    this._durationSeconds = Math.floor(
      (this._exitedAt.getTime() - this.enteredAt.getTime()) / 1000,
    );
    if (transitionLogId) {
      (this as any).transitionLogId = transitionLogId;
    }
  }
}
