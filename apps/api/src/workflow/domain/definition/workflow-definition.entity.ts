import { randomUUID } from 'crypto';
import { AggregateRoot } from '../common/aggregate-root';
import { StageEntity } from '../stage/stage.entity';
import { TransitionEntity } from '../transition/transition.entity';
import { WorkflowDefinitionCreatedEvent, WorkflowDefinitionPublishedEvent, WorkflowDefinitionVersionedEvent } from './events';
import {
  PublishedWorkflowImmutableError, WorkflowCycleDetectedError,
  NoInitialStageError, NoFinalStageError, StageSlugAlreadyExistsError,
  TransitionSlugAlreadyExistsError, StageNotFoundError,
} from '../common/errors';

export interface CreateWorkflowDefinitionProps {
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  entityType: string;
  icon?: string;
  color?: string;
  maxConcurrentInstances?: number;
  metadata?: Record<string, unknown>;
  createdBy: string;
  stages?: StageEntity[];
  transitions?: TransitionEntity[];
}

export interface WorkflowDefinitionData {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  entityType: string;
  icon: string | null;
  color: string | null;
  version: number;
  isActive: boolean;
  isPublished: boolean;
  publishedAt: Date | null;
  maxConcurrentInstances: number | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  stages: StageEntity[];
  transitions: TransitionEntity[];
}

export class WorkflowDefinitionEntity extends AggregateRoot {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public name: string,
    public readonly slug: string,
    public description: string | null,
    public readonly entityType: string,
    public icon: string | null,
    public color: string | null,
    public version: number,
    public isActive: boolean,
    public isPublished: boolean,
    public publishedAt: Date | null,
    public maxConcurrentInstances: number | null,
    public metadata: Record<string, unknown>,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    private _stages: StageEntity[],
    private _transitions: TransitionEntity[],
  ) { super(); }

  static create(props: CreateWorkflowDefinitionProps): WorkflowDefinitionEntity {
    const id = randomUUID();
    const now = new Date();

    if (!props.name || !props.name.trim()) throw new Error('Name is required');
    if (!props.slug || !props.slug.trim()) throw new Error('Slug is required');
    if (!props.entityType) throw new Error('EntityType is required');

    const entity = new WorkflowDefinitionEntity(
      id, props.tenantId, props.name.trim(), props.slug.trim(),
      props.description ?? null, props.entityType,
      props.icon ?? null, props.color ?? null,
      1, true, false, null,
      props.maxConcurrentInstances ?? null,
      props.metadata ?? {}, props.createdBy, now, now,
      props.stages ?? [], props.transitions ?? [],
    );

    entity.addDomainEvent(new WorkflowDefinitionCreatedEvent(
      id, props.tenantId, entity.name, entity.slug, entity.entityType, 1,
    ));
    return entity;
  }

  static restore(data: WorkflowDefinitionData): WorkflowDefinitionEntity {
    return new WorkflowDefinitionEntity(
      data.id, data.tenantId, data.name, data.slug,
      data.description, data.entityType, data.icon, data.color,
      data.version, data.isActive, data.isPublished, data.publishedAt,
      data.maxConcurrentInstances, data.metadata,
      data.createdBy, data.createdAt, data.updatedAt,
      data.stages, data.transitions,
    );
  }

  get stages(): StageEntity[] { return [...this._stages]; }
  get transitions(): TransitionEntity[] { return [...this._transitions]; }

  addStage(stage: StageEntity): void {
    this.assertNotPublished();
    if (this._stages.some(s => s.slug === stage.slug)) {
      throw new StageSlugAlreadyExistsError(stage.slug);
    }
    this._stages.push(stage);
    this.updatedAt = new Date();
  }

  removeStage(stageId: string): void {
    this.assertNotPublished();
    const idx = this._stages.findIndex(s => s.id === stageId);
    if (idx === -1) throw new StageNotFoundError(stageId);
    if (this._stages[idx].isInitial && this._stages.length > 1) {
      throw new Error('Cannot remove the initial stage');
    }
    this._stages.splice(idx, 1);
    this.updatedAt = new Date();
  }

  addTransition(transition: TransitionEntity): void {
    this.assertNotPublished();
    if (this._transitions.some(t => t.slug === transition.slug)) {
      throw new TransitionSlugAlreadyExistsError(transition.slug);
    }
    if (transition.fromStageId === transition.toStageId) {
      throw new Error('Transition cannot be self-referential');
    }
    this._transitions.push(transition);
    this.updatedAt = new Date();
  }

  publish(): void {
    if (this.isPublished) throw new PublishedWorkflowImmutableError();

    const initialStages = this._stages.filter(s => s.isInitial);
    if (initialStages.length !== 1) throw new NoInitialStageError();

    const finalStages = this._stages.filter(s => s.isFinal);
    if (finalStages.length < 1) throw new NoFinalStageError();

    const orders = this._stages.map(s => s.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) throw new Error('Stage orders must be sequential from 1');
    }

    if (this.hasCycle()) throw new WorkflowCycleDetectedError();

    for (const t of this._transitions) {
      if (!this._stages.some(s => s.id === t.fromStageId)) {
        throw new StageNotFoundError(`fromStage ${t.fromStageId} not found`);
      }
      if (!this._stages.some(s => s.id === t.toStageId)) {
        throw new StageNotFoundError(`toStage ${t.toStageId} not found`);
      }
    }

    const nonFinalStages = this._stages.filter(s => !s.isFinal);
    for (const stage of nonFinalStages) {
      const hasOutgoing = this._transitions.some(t => t.fromStageId === stage.id);
      if (!hasOutgoing) throw new Error(`Stage ${stage.slug} has no outgoing transitions`);
    }

    this.isPublished = true;
    this.publishedAt = new Date();
    this.updatedAt = new Date();
    this.addDomainEvent(new WorkflowDefinitionPublishedEvent(this.id, this.tenantId, this.version));
  }

  createNewVersion(): WorkflowDefinitionEntity {
    this.assertNotPublished();

    this.version += 1;
    this.isPublished = false;
    this.publishedAt = null;
    this.updatedAt = new Date();

    this.addDomainEvent(new WorkflowDefinitionVersionedEvent(
      this.id, this.tenantId, this.version - 1, this.version,
    ));
    return this;
  }

  getInitialStage(): StageEntity {
    const stage = this._stages.find(s => s.isInitial);
    if (!stage) throw new NoInitialStageError();
    return stage;
  }

  getStage(stageId: string): StageEntity {
    const stage = this._stages.find(s => s.id === stageId);
    if (!stage) throw new StageNotFoundError(stageId);
    return stage;
  }

  getStageBySlug(slug: string): StageEntity | undefined {
    return this._stages.find(s => s.slug === slug);
  }

  getTransition(slug: string, fromStageId: string): TransitionEntity | undefined {
    return this._transitions.find(t => t.slug === slug && t.fromStageId === fromStageId);
  }

  findAutoTriggerTransition(eventType: string): TransitionEntity | undefined {
    return this._transitions.find(t => t.isAutomatic && t.autoTriggerEvent === eventType);
  }

  private hasCycle(): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (stageId: string): boolean => {
      visited.add(stageId);
      recStack.add(stageId);

      const outgoing = this._transitions.filter(t => t.fromStageId === stageId);
      for (const t of outgoing) {
        if (!visited.has(t.toStageId)) {
          if (dfs(t.toStageId)) return true;
        } else if (recStack.has(t.toStageId)) {
          return true;
        }
      }

      recStack.delete(stageId);
      return false;
    };

    for (const stage of this._stages) {
      if (!visited.has(stage.id)) {
        if (dfs(stage.id)) return true;
      }
    }
    return false;
  }

  private assertNotPublished(): void {
    if (this.isPublished) throw new PublishedWorkflowImmutableError();
  }
}
