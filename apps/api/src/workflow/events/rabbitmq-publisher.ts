import { Injectable, Logger } from '@nestjs/common';
import { IWorkflowEventPublisher } from './publishers';
import {
  WorkflowStartedEvent, StageChangedEvent, ApprovalRequestedEvent,
  ApprovalGrantedEvent, WorkflowCompletedEvent, TaskAssignedEvent,
} from './domain-events';

@Injectable()
export class RabbitMqWorkflowEventPublisher implements IWorkflowEventPublisher {
  private readonly logger = new Logger('RabbitMQ.WorkflowEvents');

  private routingKey(tenantId: string, eventType: string): string {
    return `${tenantId}.${eventType}`;
  }

  private async publish(event: any, routingKey: string): Promise<void> {
    this.logger.debug(`Publicando ${routingKey}`, { eventId: event.eventId });
  }

  async publishWorkflowStarted(event: WorkflowStartedEvent): Promise<void> {
    await this.publish(event, this.routingKey(event.tenantId, event.type));
  }

  async publishStageChanged(event: StageChangedEvent): Promise<void> {
    await this.publish(event, this.routingKey(event.tenantId, event.type));
  }

  async publishApprovalRequested(event: ApprovalRequestedEvent): Promise<void> {
    await this.publish(event, this.routingKey(event.tenantId, event.type));
  }

  async publishApprovalGranted(event: ApprovalGrantedEvent): Promise<void> {
    await this.publish(event, this.routingKey(event.tenantId, event.type));
  }

  async publishWorkflowCompleted(event: WorkflowCompletedEvent): Promise<void> {
    await this.publish(event, this.routingKey((event as any).tenantId, event.type));
  }

  async publishTaskAssigned(event: TaskAssignedEvent): Promise<void> {
    await this.publish(event, this.routingKey((event as any).tenantId, event.type));
  }
}
