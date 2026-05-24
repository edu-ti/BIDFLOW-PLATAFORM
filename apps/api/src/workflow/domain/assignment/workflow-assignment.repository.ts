import { WorkflowAssignmentEntity } from './workflow-assignment.entity';

export abstract class WorkflowAssignmentRepository {
  abstract save(assignment: WorkflowAssignmentEntity): Promise<void>;
  abstract findByInstance(instanceId: string): Promise<WorkflowAssignmentEntity[]>;
  abstract findActiveByUser(userId: string, tenantId: string): Promise<WorkflowAssignmentEntity[]>;
  abstract delete(id: string): Promise<void>;
}
