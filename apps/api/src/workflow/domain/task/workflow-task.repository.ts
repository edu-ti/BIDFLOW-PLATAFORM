import { WorkflowTaskEntity } from './workflow-task.entity';
import { TaskStatus } from '../common/enums';

export interface WorkflowTaskRepository {
  save(task: WorkflowTaskEntity): Promise<void>;
  findById(id: string): Promise<WorkflowTaskEntity | null>;
  findByInstance(instanceId: string): Promise<WorkflowTaskEntity[]>;
  findPendingByUser(userId: string, tenantId: string): Promise<WorkflowTaskEntity[]>;
  countMandatoryPending(instanceId: string): Promise<number>;
  delete(id: string): Promise<void>;
}
