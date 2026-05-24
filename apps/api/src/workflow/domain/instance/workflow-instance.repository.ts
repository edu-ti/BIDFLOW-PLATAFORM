import { WorkflowInstanceEntity } from './workflow-instance.entity';
import { InstanceStatus, InstancePriority } from '../common/enums';

export abstract class InstanceFilter {
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

export abstract class WorkflowInstanceRepository {
  abstract save(instance: WorkflowInstanceEntity): Promise<void>;
  abstract findById(id: string): Promise<WorkflowInstanceEntity | null>;
  abstract findMany(filter: InstanceFilter): Promise<WorkflowInstanceEntity[]>;
  abstract count(filter: InstanceFilter): Promise<number>;
  abstract findByEntity(entityType: string, entityId: string, tenantId: string): Promise<WorkflowInstanceEntity | null>;
  abstract findOverdue(tenantId: string): Promise<WorkflowInstanceEntity[]>;
  abstract findActiveByDefinition(definitionId: string, tenantId: string): Promise<WorkflowInstanceEntity[]>;
  abstract countActiveByDefinition(definitionId: string, tenantId: string): Promise<number>;
  abstract findByAssignedUser(userId: string, tenantId: string): Promise<WorkflowInstanceEntity[]>;
}
