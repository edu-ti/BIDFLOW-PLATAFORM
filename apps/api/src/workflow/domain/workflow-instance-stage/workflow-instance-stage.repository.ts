import { WorkflowInstanceStageEntity } from './workflow-instance-stage.entity';

export interface InstanceStageFilter {
  workflowInstanceId: string;
  tenantId?: string;
  stageId?: string;
}

export interface WorkflowInstanceStageRepository {
  save(stage: WorkflowInstanceStageEntity): Promise<void>;
  findById(id: string): Promise<WorkflowInstanceStageEntity | null>;
  findByInstance(instanceId: string): Promise<WorkflowInstanceStageEntity[]>;
  findActiveByInstance(instanceId: string): Promise<WorkflowInstanceStageEntity | null>;
  findByInstanceAndStage(instanceId: string, stageId: string): Promise<WorkflowInstanceStageEntity | null>;
}
