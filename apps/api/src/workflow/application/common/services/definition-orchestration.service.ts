import { StageEntity } from '../../../domain/stage/stage.entity';
import { TransitionEntity } from '../../../domain/transition/transition.entity';
import { WorkflowDefinitionEntity } from '../../../domain/definition/workflow-definition.entity';
import { WorkflowDefinitionRepository } from '../../../domain/definition/workflow-definition.repository';
import { StageRepository } from '../../../domain/stage/stage.repository';
import { TransitionRepository } from '../../../domain/transition/transition.repository';
import { StageType } from '../../../domain/common/enums';
import { PublishedWorkflowImmutableError, StageSlugAlreadyExistsError } from '../../../domain/common/errors';
import { CreateStageProps } from '../../../domain/stage/stage.entity';
import { CreateTransitionProps } from '../../../domain/transition/transition.entity';

export interface IDefinitionPublishingService {
  publishDefinition(definitionId: string, tenantId: string): Promise<WorkflowDefinitionEntity>;
}

export interface IDefinitionStageService {
  addStageToDefinition(definitionId: string, tenantId: string, props: CreateStageProps): Promise<StageEntity>;
  removeStageFromDefinition(definitionId: string, stageId: string, tenantId: string): Promise<void>;
  updateStage(stageId: string, props: Partial<CreateStageProps>): Promise<StageEntity>;
}

export interface IDefinitionTransitionService {
  addTransitionToDefinition(definitionId: string, tenantId: string, props: CreateTransitionProps): Promise<TransitionEntity>;
  removeTransitionFromDefinition(transitionId: string, definitionId: string): Promise<void>;
}

export class DefinitionPublishingService implements IDefinitionPublishingService {
  constructor(
    private readonly defRepo: WorkflowDefinitionRepository,
  ) {}

  async publishDefinition(definitionId: string, tenantId: string): Promise<WorkflowDefinitionEntity> {
    const definition = await this.defRepo.findById(definitionId);
    if (!definition) throw new Error('Workflow definition not found');
    if (definition.tenantId !== tenantId) throw new Error('Tenant mismatch');

    definition.publish();
    await this.defRepo.save(definition);
    return definition;
  }
}

export class DefinitionStageService implements IDefinitionStageService {
  constructor(
    private readonly defRepo: WorkflowDefinitionRepository,
    private readonly stageRepo: StageRepository,
  ) {}

  async addStageToDefinition(definitionId: string, tenantId: string, props: CreateStageProps): Promise<StageEntity> {
    const definition = await this.defRepo.findById(definitionId);
    if (!definition) throw new Error('Workflow definition not found');
    if (definition.tenantId !== tenantId) throw new Error('Tenant mismatch');
    if (definition.isPublished) throw new PublishedWorkflowImmutableError();

    if (definition.stages.some(s => s.slug === props.slug)) {
      throw new StageSlugAlreadyExistsError(props.slug);
    }

    const stage = StageEntity.create({ ...props, workflowDefinitionId: definitionId });
    await this.stageRepo.save(stage);
    return stage;
  }

  async removeStageFromDefinition(definitionId: string, stageId: string, tenantId: string): Promise<void> {
    const definition = await this.defRepo.findById(definitionId);
    if (!definition) throw new Error('Workflow definition not found');
    if (definition.tenantId !== tenantId) throw new Error('Tenant mismatch');
    if (definition.isPublished) throw new PublishedWorkflowImmutableError();

    const stage = definition.stages.find(s => s.id === stageId);
    if (!stage) throw new Error('Stage not found');
    if (stage.isInitial) throw new Error('Cannot remove the initial stage');

    const hasInstances = false;
    if (hasInstances) throw new Error('Cannot remove stage with active instances');

    await this.stageRepo.delete(stageId);
  }

  async updateStage(stageId: string, props: Partial<CreateStageProps>): Promise<StageEntity> {
    const stage = await this.stageRepo.findById(stageId);
    if (!stage) throw new Error('Stage not found');

    if (props.name !== undefined) stage.name = props.name;
    if (props.description !== undefined) stage.description = props.description ?? null;
    if (props.order !== undefined) stage.order = props.order;
    if (props.deadlineHours !== undefined) stage.deadlineHours = props.deadlineHours ?? null;
    if (props.notifyOnEnter !== undefined) stage.notifyOnEnter = props.notifyOnEnter;
    if (props.notifyOnExit !== undefined) stage.notifyOnExit = props.notifyOnExit;
    if (props.allowRejection !== undefined) stage.allowRejection = props.allowRejection;
    if (props.color !== undefined) stage.color = props.color ?? null;
    stage.updatedAt = new Date();

    await this.stageRepo.save(stage);
    return stage;
  }
}

export class DefinitionTransitionService implements IDefinitionTransitionService {
  constructor(
    private readonly defRepo: WorkflowDefinitionRepository,
    private readonly transitionRepo: TransitionRepository,
    private readonly stageRepo: StageRepository,
  ) {}

  async addTransitionToDefinition(definitionId: string, tenantId: string, props: CreateTransitionProps): Promise<TransitionEntity> {
    const definition = await this.defRepo.findById(definitionId);
    if (!definition) throw new Error('Workflow definition not found');
    if (definition.tenantId !== tenantId) throw new Error('Tenant mismatch');
    if (definition.isPublished) throw new PublishedWorkflowImmutableError();

    const fromStage = await this.stageRepo.findById(props.fromStageId);
    if (!fromStage || fromStage.workflowDefinitionId !== definitionId) {
      throw new Error('fromStage not found in this definition');
    }
    const toStage = await this.stageRepo.findById(props.toStageId);
    if (!toStage || toStage.workflowDefinitionId !== definitionId) {
      throw new Error('toStage not found in this definition');
    }

    const transition = TransitionEntity.create({ ...props, workflowDefinitionId: definitionId });
    await this.transitionRepo.save(transition);
    return transition;
  }

  async removeTransitionFromDefinition(transitionId: string, definitionId: string): Promise<void> {
    const transition = await this.transitionRepo.findById(transitionId);
    if (!transition || transition.workflowDefinitionId !== definitionId) {
      throw new Error('Transition not found in this definition');
    }
    await this.transitionRepo.delete(transitionId);
  }
}
