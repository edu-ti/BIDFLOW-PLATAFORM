import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module';

// ── API Layer ──
import { DefinitionsController, StagesController, TransitionsController } from './api/controllers/definition.controller';
import { InstancesController, ApprovalsController, TasksController, TimelineController } from './api/controllers/instance.controller';
import { DashboardController } from './api/controllers/dashboard.controller';
import { WorkflowPermissionGuard } from './api/guards/workflow-permission.guard';
import { WorkflowExceptionFilter } from './api/filters/workflow-exception.filter';
import { WorkflowLoggingInterceptor } from './api/interceptors/workflow-logging.interceptor';
import { TenderEventsConsumer } from './api/consumers/tender-events.consumer';

// ── Application Layer ──
import { CreateDefinitionHandler, UpdateDefinitionHandler, PublishDefinitionHandler, CreateDefinitionVersionHandler, DeleteDefinitionHandler } from './application/definition/commands';
import { GetDefinitionHandler, ListDefinitionsHandler, ListStagesHandler, ListTransitionsHandler } from './application/definition/queries/definition-queries.handler';
import { CreateStageHandler, UpdateStageHandler, DeleteStageHandler } from './application/stage/commands/stage.handlers';
import { CreateTransitionHandler, DeleteTransitionHandler } from './application/transition/commands/transition.handlers';
import { CreateInstanceHandler, ExecuteTransitionHandler, CancelInstanceHandler, ReassignInstanceHandler } from './application/instance/commands/instance.handlers';
import { GetInstanceHandler, ListInstancesHandler, GetInstanceTimelineHandler } from './application/instance/queries/instance-queries.handler';
import { ApproveHandler, RejectHandler, DelegateApprovalHandler, ListApprovalsHandler } from './application/approval/commands/approval.handlers';
import { CompleteTaskHandler, ListTasksHandler, ListMyPendingTasksHandler } from './application/task/commands/task.handlers';
import { TenderAcceptedHandler } from './application/instance/events/tender-accepted.handler';
import { GetSummaryHandler, GetMyPendingItemsHandler, GetOverdueInstancesHandler } from './application/dashboard/queries/dashboard-queries.handler';
import { DefinitionPublishingService, DefinitionStageService, DefinitionTransitionService } from './application/common/services/definition-orchestration.service';
import { InstanceOrchestrationService } from './application/common/services/instance-orchestration.service';
import { ApprovalOrchestrationService } from './application/common/services/approval-orchestration.service';

// ── Domain Layer ──
import { DagValidatorService, WorkflowInstanceFactory, ApprovalEngine, TransitionValidator } from './domain/common/services';
import { WorkflowDefinitionRepository, StageRepository, TransitionRepository, WorkflowInstanceRepository, TransitionLogRepository, ApprovalRepository, WorkflowAssignmentRepository, WorkflowTaskRepository, WorkflowTimelineEntryRepository } from './domain';

// ── Infrastructure Layer ──
import { PrismaWorkflowDefinitionRepository } from './infrastructure/persistence/prisma/definition/prisma-definition.repository';
import { PrismaStageRepository } from './infrastructure/persistence/prisma/stage/prisma-stage.repository';
import { PrismaTransitionRepository } from './infrastructure/persistence/prisma/transition/prisma-transition.repository';
import { PrismaWorkflowInstanceRepository } from './infrastructure/persistence/prisma/instance/prisma-instance.repository';
import { PrismaTransitionLogRepository } from './infrastructure/persistence/prisma/transition-log/prisma-transition-log.repository';
import { PrismaApprovalRepository } from './infrastructure/persistence/prisma/approval/prisma-approval.repository';
import { PrismaWorkflowAssignmentRepository } from './infrastructure/persistence/prisma/assignment/prisma-assignment.repository';
import { PrismaWorkflowTaskRepository } from './infrastructure/persistence/prisma/task/prisma-task.repository';
import { PrismaWorkflowTimelineEntryRepository } from './infrastructure/persistence/prisma/timeline/prisma-timeline.repository';
import { WorkflowEventPublisher, RabbitMqEventPublisher } from './infrastructure/event-publishers';
import { WorkflowObservabilityService } from './infrastructure/observability';

const controllers = [
  DefinitionsController, StagesController, TransitionsController,
  InstancesController, ApprovalsController, TasksController, TimelineController,
  DashboardController,
  TenderEventsConsumer,
];

const repositories = [
  { provide: WorkflowDefinitionRepository, useClass: PrismaWorkflowDefinitionRepository },
  { provide: StageRepository, useClass: PrismaStageRepository },
  { provide: TransitionRepository, useClass: PrismaTransitionRepository },
  { provide: WorkflowInstanceRepository, useClass: PrismaWorkflowInstanceRepository },
  { provide: TransitionLogRepository, useClass: PrismaTransitionLogRepository },
  { provide: ApprovalRepository, useClass: PrismaApprovalRepository },
  { provide: WorkflowAssignmentRepository, useClass: PrismaWorkflowAssignmentRepository },
  { provide: WorkflowTaskRepository, useClass: PrismaWorkflowTaskRepository },
  { provide: WorkflowTimelineEntryRepository, useClass: PrismaWorkflowTimelineEntryRepository },
];

const domainServices = [
  DagValidatorService, WorkflowInstanceFactory, ApprovalEngine, TransitionValidator,
];

const orchestrators = [
  DefinitionPublishingService, DefinitionStageService, DefinitionTransitionService,
  InstanceOrchestrationService, ApprovalOrchestrationService,
];

const commandHandlers = [
  CreateDefinitionHandler, UpdateDefinitionHandler, PublishDefinitionHandler,
  CreateDefinitionVersionHandler, DeleteDefinitionHandler,
  CreateStageHandler, UpdateStageHandler, DeleteStageHandler,
  CreateTransitionHandler, DeleteTransitionHandler,
  CreateInstanceHandler, ExecuteTransitionHandler, CancelInstanceHandler, ReassignInstanceHandler,
  ApproveHandler, RejectHandler, DelegateApprovalHandler,
  CompleteTaskHandler,
];

const queryHandlers = [
  GetDefinitionHandler, ListDefinitionsHandler, ListStagesHandler, ListTransitionsHandler,
  GetInstanceHandler, ListInstancesHandler, GetInstanceTimelineHandler,
  ListApprovalsHandler, ListTasksHandler, ListMyPendingTasksHandler,
  GetSummaryHandler, GetMyPendingItemsHandler, GetOverdueInstancesHandler,
];

const eventHandlers = [
  TenderAcceptedHandler,
];

const infrastructure = [
  WorkflowEventPublisher, RabbitMqEventPublisher, WorkflowObservabilityService,
  WorkflowPermissionGuard,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers,
  providers: [
    ...repositories,
    ...domainServices,
    ...orchestrators,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    ...infrastructure,
  ],
  exports: [],
})
export class WorkflowModule {}
