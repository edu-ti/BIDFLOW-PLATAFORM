import { WorkflowAssignmentEntity } from './workflow-assignment.entity';

export interface WorkflowAssignmentRepository {
  save(assignment: WorkflowAssignmentEntity): Promise<void>;
  findByInstance(instanceId: string): Promise<WorkflowAssignmentEntity[]>;
  findActiveByUser(userId: string, tenantId: string): Promise<WorkflowAssignmentEntity[]>;
  delete(id: string): Promise<void>;
}
