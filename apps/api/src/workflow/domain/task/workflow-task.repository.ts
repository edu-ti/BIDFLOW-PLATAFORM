import { WorkflowTaskEntity } from './workflow-task.entity';
import { TaskStatus } from '../common/enums';

export abstract class WorkflowTaskRepository {
  abstract save(task: WorkflowTaskEntity): Promise<void>;
  abstract findById(id: string): Promise<WorkflowTaskEntity | null>;
  abstract findByInstance(instanceId: string): Promise<WorkflowTaskEntity[]>;
  abstract findPendingByUser(userId: string, tenantId: string): Promise<WorkflowTaskEntity[]>;
  abstract countMandatoryPending(instanceId: string): Promise<number>;
  abstract delete(id: string): Promise<void>;
}
