import { Injectable, Logger } from '@nestjs/common';
import { IWorkflowEventPublisher } from './publishers';

@Injectable()
export class CompositeWorkflowEventPublisher implements IWorkflowEventPublisher {
  private readonly logger = new Logger('CompositePublisher');

  constructor(
    private readonly publishers: IWorkflowEventPublisher[],
  ) {}

  async publishWorkflowStarted(event: any): Promise<void> {
    for (const p of this.publishers) {
      try { await p.publishWorkflowStarted(event); }
      catch (e) { this.logger.error(`Publisher failed: ${(e as Error).message}`); }
    }
  }

  async publishStageChanged(event: any): Promise<void> {
    for (const p of this.publishers) {
      try { await p.publishStageChanged(event); }
      catch (e) { this.logger.error(`Publisher failed: ${(e as Error).message}`); }
    }
  }

  async publishApprovalRequested(event: any): Promise<void> {
    for (const p of this.publishers) {
      try { await p.publishApprovalRequested(event); }
      catch (e) { this.logger.error(`Publisher failed: ${(e as Error).message}`); }
    }
  }

  async publishApprovalGranted(event: any): Promise<void> {
    for (const p of this.publishers) {
      try { await p.publishApprovalGranted(event); }
      catch (e) { this.logger.error(`Publisher failed: ${(e as Error).message}`); }
    }
  }

  async publishWorkflowCompleted(event: any): Promise<void> {
    for (const p of this.publishers) {
      try { await p.publishWorkflowCompleted(event); }
      catch (e) { this.logger.error(`Publisher failed: ${(e as Error).message}`); }
    }
  }

  async publishTaskAssigned(event: any): Promise<void> {
    for (const p of this.publishers) {
      try { await p.publishTaskAssigned(event); }
      catch (e) { this.logger.error(`Publisher failed: ${(e as Error).message}`); }
    }
  }
}
