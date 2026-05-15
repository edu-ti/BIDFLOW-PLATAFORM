import { WorkflowInstanceEntity } from './workflow-instance.entity';
import { InstanceStatus, InstancePriority } from '../common/enums';

export interface InstanceFilter {
  tenantId: string;
  status?: InstanceStatus[];
  workflowDefinitionId?: string;
  entityType?: string;
  entityId?: string;
  currentStageId?: string;
  assignedTo?: string;
  priority?: InstancePriority[];
  createdAtFrom?: Date;
  createdAtTo?: Date;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface WorkflowInstanceRepository {
  save(instance: WorkflowInstanceEntity): Promise<void>;
  findById(id: string): Promise<WorkflowInstanceEntity | null>;
  findMany(filter: InstanceFilter): Promise<WorkflowInstanceEntity[]>;
  count(filter: InstanceFilter): Promise<number>;
  findByEntity(entityType: string, entityId: string, tenantId: string): Promise<WorkflowInstanceEntity | null>;
  findOverdue(tenantId: string): Promise<WorkflowInstanceEntity[]>;
  findActiveByDefinition(definitionId: string, tenantId: string): Promise<WorkflowInstanceEntity[]>;
  countActiveByDefinition(definitionId: string, tenantId: string): Promise<number>;
  findByAssignedUser(userId: string, tenantId: string): Promise<WorkflowInstanceEntity[]>;
}
