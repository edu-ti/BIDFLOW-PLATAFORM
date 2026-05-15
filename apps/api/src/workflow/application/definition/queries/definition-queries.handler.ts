import { WorkflowDefinitionRepository } from '../../../../domain/definition/workflow-definition.repository';
import { StageRepository } from '../../../../domain/stage/stage.repository';
import { TransitionRepository } from '../../../../domain/transition/transition.repository';
import { GetDefinitionQuery, ListDefinitionsQuery, ListStagesQuery, ListTransitionsQuery } from '../../../common/queries';
import { WorkflowDefinitionDetailDto, StageResponseDto, TransitionResponseDto, WorkflowDefinitionResponseDto } from '../../../common/dto';
import { PaginatedResponse } from '../../../common/dto/common.dto';

export class GetDefinitionHandler {
  constructor(
    private readonly defRepo: WorkflowDefinitionRepository,
    private readonly stageRepo: StageRepository,
    private readonly transitionRepo: TransitionRepository,
  ) {}

  async execute(query: GetDefinitionQuery): Promise<WorkflowDefinitionDetailDto> {
    const def = await this.defRepo.findById(query.id);
    if (!def || def.tenantId !== query.tenantId) throw new Error('Workflow definition not found');

    const stages = await this.stageRepo.findByDefinition(query.id);
    const transitions = await this.transitionRepo.findByDefinition(query.id);

    return {
      id: def.id, name: def.name, slug: def.slug,
      description: def.description, entityType: def.entityType,
      version: def.version, isPublished: def.isPublished,
      isActive: def.isActive, publishedAt: def.publishedAt?.toISOString() ?? null,
      createdAt: def.createdAt.toISOString(), updatedAt: def.updatedAt.toISOString(),
      stages: stages.map(s => ({
        id: s.id, slug: s.slug, name: s.name, description: s.description,
        order: s.order, color: s.color, type: s.type, isInitial: s.isInitial,
        isFinal: s.isFinal, deadlineHours: s.deadlineHours,
        approvalConfig: s.approvalConfig as Record<string, unknown>,
        assignmentConfig: s.assignmentConfig as Record<string, unknown>,
        createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(),
      })),
      transitions: transitions.map(t => ({
        id: t.id, slug: t.slug, name: t.name,
        fromStageId: t.fromStageId, toStageId: t.toStageId,
        conditions: t.conditions as Record<string, unknown>,
        isAutomatic: t.isAutomatic, autoTriggerEvent: t.autoTriggerEvent,
      })),
    };
  }
}

export class ListDefinitionsHandler {
  constructor(private readonly defRepo: WorkflowDefinitionRepository) {}

  async execute(query: ListDefinitionsQuery): Promise<PaginatedResponse<WorkflowDefinitionResponseDto>> {
    const [items, total] = await Promise.all([
      this.defRepo.findMany({
        tenantId: query.tenantId, entityType: query.entityType,
        isActive: query.isActive, search: query.search,
        page: query.page, limit: query.limit,
      }),
      this.defRepo.count({
        tenantId: query.tenantId, entityType: query.entityType,
        isActive: query.isActive, search: query.search,
      }),
    ]);

    return new PaginatedResponse(
      items.map(d => ({
        id: d.id, name: d.name, slug: d.slug,
        description: d.description, entityType: d.entityType,
        version: d.version, isPublished: d.isPublished,
        isActive: d.isActive, publishedAt: d.publishedAt?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString(),
      })),
      total, query.page, query.limit,
    );
  }
}

export class ListStagesHandler {
  constructor(private readonly stageRepo: StageRepository) {}

  async execute(query: ListStagesQuery): Promise<StageResponseDto[]> {
    const stages = await this.stageRepo.findByDefinition(query.definitionId);
    return stages.map(s => ({
      id: s.id, slug: s.slug, name: s.name, description: s.description,
      order: s.order, color: s.color, type: s.type,
      isInitial: s.isInitial, isFinal: s.isFinal,
      deadlineHours: s.deadlineHours,
      approvalConfig: s.approvalConfig as Record<string, unknown>,
      assignmentConfig: s.assignmentConfig as Record<string, unknown>,
      createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(),
    }));
  }
}

export class ListTransitionsHandler {
  constructor(private readonly transitionRepo: TransitionRepository) {}

  async execute(query: ListTransitionsQuery): Promise<TransitionResponseDto[]> {
    const transitions = await this.transitionRepo.findByDefinition(query.definitionId);
    return transitions.map(t => ({
      id: t.id, slug: t.slug, name: t.name,
      fromStageId: t.fromStageId, toStageId: t.toStageId,
      conditions: t.conditions as Record<string, unknown>,
      isAutomatic: t.isAutomatic, autoTriggerEvent: t.autoTriggerEvent,
    }));
  }
}
