import { WorkflowTimelineEntryEntity } from './workflow-timeline-entry.entity';

export interface TimelineFilter {
  workflowInstanceId: string;
  limit?: number;
  offset?: number;
}

export interface WorkflowTimelineEntryRepository {
  save(entry: WorkflowTimelineEntryEntity): Promise<void>;
  findByInstance(instanceId: string, filter: TimelineFilter): Promise<WorkflowTimelineEntryEntity[]>;
  createMany(entries: WorkflowTimelineEntryEntity[]): Promise<void>;
}
