import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WorkflowObservabilityService {
  private readonly logger = new Logger(WorkflowObservabilityService.name);

  logTransition(instanceId: string, transitionSlug: string, fromStage: string, toStage: string, userId: string, tenantId: string, durationMs: number): void {
    this.logger.log('Workflow transition executed', {
      instanceId, transitionSlug, fromStage, toStage,
      userId, tenantId, durationMs,
    });
  }

  logInstanceCreated(instanceId: string, definitionId: string, entityType: string, tenantId: string): void {
    this.logger.log('Workflow instance created', {
      instanceId, definitionId, entityType, tenantId,
    });
  }

  logApproval(approvalId: string, instanceId: string, decision: string, userId: string, tenantId: string): void {
    this.logger.log('Workflow approval completed', {
      approvalId, instanceId, decision, userId, tenantId,
    });
  }

  logError(operation: string, error: Error, context: Record<string, unknown> = {}): void {
    this.logger.error(`Workflow ${operation} failed: ${error.message}`, error.stack, context);
  }

  recordMetric(name: string, value: number, labels: Record<string, string> = {}): void {
    this.logger.debug(`Metric: ${name} = ${value}`, labels);
  }
}
