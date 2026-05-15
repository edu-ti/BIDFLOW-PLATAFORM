import { WorkflowDefinitionEntity } from './workflow-definition.entity';

export interface DefinitionFilter {
  tenantId: string;
  entityType?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface WorkflowDefinitionRepository {
  save(definition: WorkflowDefinitionEntity): Promise<void>;
  findById(id: string): Promise<WorkflowDefinitionEntity | null>;
  findBySlug(slug: string, tenantId: string): Promise<WorkflowDefinitionEntity | null>;
  findMany(filter: DefinitionFilter): Promise<WorkflowDefinitionEntity[]>;
  findByEntityType(entityType: string, tenantId: string): Promise<WorkflowDefinitionEntity[]>;
  count(filter: DefinitionFilter): Promise<number>;
  delete(id: string): Promise<void>;
}
