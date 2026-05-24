import { WorkflowInstanceStageEntity } from './workflow-instance-stage.entity';

export abstract class InstanceStageFilter {
  workflowInstanceId: string;
  tenantId?: string;
  stageId?: string;
}

export abstract class WorkflowInstanceStageRepository {
  abstract save(stage: WorkflowInstanceStageEntity): Promise<void>;
  abstract findById(id: string): Promise<WorkflowInstanceStageEntity | null>;
  abstract findByInstance(instanceId: string): Promise<WorkflowInstanceStageEntity[]>;
  abstract findActiveByInstance(instanceId: string): Promise<WorkflowInstanceStageEntity | null>;
  abstract findByInstanceAndStage(instanceId: string, stageId: string): Promise<WorkflowInstanceStageEntity | null>;
}
