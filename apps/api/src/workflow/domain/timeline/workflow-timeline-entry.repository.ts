import { WorkflowTimelineEntryEntity } from './workflow-timeline-entry.entity';

export abstract class TimelineFilter {
  workflowInstanceId: string;
  limit?: number;
  offset?: number;
}

export abstract class WorkflowTimelineEntryRepository {
  abstract save(entry: WorkflowTimelineEntryEntity): Promise<void>;
  abstract findByInstance(instanceId: string, filter: TimelineFilter): Promise<WorkflowTimelineEntryEntity[]>;
  abstract createMany(entries: WorkflowTimelineEntryEntity[]): Promise<void>;
}
