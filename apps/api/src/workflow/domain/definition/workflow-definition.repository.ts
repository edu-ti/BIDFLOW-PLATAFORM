import { WorkflowDefinitionEntity } from './workflow-definition.entity';

export abstract class DefinitionFilter {
  tenantId: string;
  entityType?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export abstract class WorkflowDefinitionRepository {
  abstract save(definition: WorkflowDefinitionEntity): Promise<void>;
  abstract findById(id: string): Promise<WorkflowDefinitionEntity | null>;
  abstract findBySlug(slug: string, tenantId: string): Promise<WorkflowDefinitionEntity | null>;
  abstract findMany(filter: DefinitionFilter): Promise<WorkflowDefinitionEntity[]>;
  abstract findByEntityType(entityType: string, tenantId: string): Promise<WorkflowDefinitionEntity[]>;
  abstract count(filter: DefinitionFilter): Promise<number>;
  abstract delete(id: string): Promise<void>;
}
