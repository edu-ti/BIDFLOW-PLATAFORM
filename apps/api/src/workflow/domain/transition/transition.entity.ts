// @ts-nocheck
import { randomUUID } from 'crypto';
import { TransitionCondition, TransitionConditionProps } from '../common/value-objects/transition-condition';

export interface CreateTransitionProps {
  workflowDefinitionId: string;
  slug: string;
  name: string;
  fromStageId: string;
  toStageId: string;
  conditions?: TransitionConditionProps;
  permissions?: { roles?: string[]; selfService?: boolean };
  isAutomatic?: boolean;
  autoTriggerEvent?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

export interface TransitionData {
  id: string;
  workflowDefinitionId: string;
  slug: string;
  name: string;
  fromStageId: string;
  toStageId: string;
  conditions: Record<string, unknown> | null;
  permissions: Record<string, unknown> | null;
  isAutomatic: boolean;
  autoTriggerEvent: string | null;
  order: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export class TransitionEntity {
  public readonly id: string;
  public readonly workflowDefinitionId: string;
  public readonly slug: string;
  public name: string;
  public readonly fromStageId: string;
  public readonly toStageId: string;
  public conditions: TransitionCondition | null;
  public permissions: { roles?: string[]; selfService?: boolean } | null;
  public readonly isAutomatic: boolean;
  public readonly autoTriggerEvent: string | null;
  public order: number;
  public metadata: Record<string, unknown>;
  public readonly createdAt: Date;

  constructor(props: TransitionData) {
    this.id = props.id;
    this.workflowDefinitionId = props.workflowDefinitionId;
    this.slug = props.slug;
    this.name = props.name;
    this.fromStageId = props.fromStageId;
    this.toStageId = props.toStageId;
    this.conditions = props.conditions ? new TransitionCondition(props.conditions as TransitionConditionProps) : null;
    this.permissions = props.permissions as { roles?: string[]; selfService?: boolean } | null;
    this.isAutomatic = props.isAutomatic;
    this.autoTriggerEvent = props.autoTriggerEvent;
    this.order = props.order;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
  }

  static create(props: CreateTransitionProps): TransitionEntity {
    if (!props.slug?.trim()) throw new Error('Transition slug is required');
    if (!props.name?.trim()) throw new Error('Transition name is required');
    if (props.isAutomatic && !props.autoTriggerEvent) {
      throw new Error('Auto-trigger event is required for automatic transitions');
    }

    return new TransitionEntity({
      id: randomUUID(),
      workflowDefinitionId: props.workflowDefinitionId,
      slug: props.slug.trim(),
      name: props.name.trim(),
      fromStageId: props.fromStageId,
      toStageId: props.toStageId,
      conditions: (props.conditions as unknown as unknown as unknown as any) ?? null,
      permissions: (props.permissions as unknown as unknown as unknown as any) ?? null,
      isAutomatic: props.isAutomatic ?? false,
      autoTriggerEvent: props.autoTriggerEvent ?? null,
      order: props.order ?? 0,
      metadata: props.metadata ?? {},
      createdAt: new Date(),
    });
  }

  static restore(data: TransitionData): TransitionEntity {
    return new TransitionEntity(data);
  }
}
