# Workflow Engine Architecture — BidFlow Platform

> **Propósito:** Documento de arquitetura enterprise do Workflow Engine baseado na spec `bidflow-wf-001`. Define estrutura de pastas, módulos, camadas, repositórios, DTOs, eventos, serviços, handlers e isolamento multi-tenant. **Sem implementação de código** — apenas arquitetura.

---

## Sumário

1. [Clean Architecture Layers](#1-clean-architecture-layers)
2. [Estrutura de Pastas](#2-estrutura-de-pastas)
3. [Domain Layer](#3-domain-layer)
4. [Application Layer](#4-application-layer)
5. [Infrastructure Layer](#5-infrastructure-layer)
6. [Modules (NestJS)](#6-modules-nestjs)
7. [Repositories](#7-repositories)
8. [DTOs & Contracts](#8-dtos--contracts)
9. [Eventos](#9-eventos)
10. [Services](#10-services)
11. [Handlers (CQRS)](#11-handlers-cqrs)
12. [Multi-tenant Separation](#12-multi-tenant-separation)
13. [Cross-Cutting Concerns](#13-cross-cutting-concerns)
14. [Pipeline de Requisição](#14-pipeline-de-requisição)

---

## 1. Clean Architecture Layers

```
┌────────────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE LAYER                              │
│  (Prisma, RabbitMQ, HTTP, Guards, Filters, Interceptors, Scheduler)   │
├────────────────────────────────────────────────────────────────────────┤
│                        APPLICATION LAYER                                │
│  (Commands, Queries, Handlers, DTOs, Mappers, Domain Services)        │
├────────────────────────────────────────────────────────────────────────┤
│                          DOMAIN LAYER                                   │
│  (Entities, Aggregate Roots, Value Objects, Repository Interfaces,    │
│   Domain Events, Domain Services, Business Rules, DAG Validator)      │
└────────────────────────────────────────────────────────────────────────┘
```

### Regras de dependência

| Camada         | Depende de               | Não pode depender de                    |
|----------------|--------------------------|-----------------------------------------|
| **Domain**     | Nada (código puro TS)    | Prisma, NestJS, Express, HTTP, RabbitMQ |
| **Application**| Domain apenas            | Prisma, HTTP, NestJS específico         |
| **Infrastructure** | Domain + Application | Nenhuma restrição                       |

---

## 2. Estrutura de Pastas

```
apps/api/src/workflow/
├── workflow.module.ts                        # Módulo NestJS raiz
│
├── domain/
│   ├── definition/
│   │   ├── workflow-definition.entity.ts
│   │   ├── workflow-definition.repository.ts     # Interface (port)
│   │   ├── value-objects/
│   │   │   ├── entity-type.ts
│   │   │   └── workflow-version.ts
│   │   └── events/
│   │       ├── workflow-definition-created.event.ts
│   │       ├── workflow-definition-published.event.ts
│   │       └── workflow-definition-versioned.event.ts
│   │
│   ├── stage/
│   │   ├── stage.entity.ts
│   │   ├── stage.repository.ts
│   │   ├── value-objects/
│   │   │   ├── stage-type.ts
│   │   │   ├── approval-config.ts
│   │   │   └── assignment-config.ts
│   │   └── events/
│   │       └── stage-created.event.ts
│   │
│   ├── transition/
│   │   ├── transition.entity.ts
│   │   ├── transition.repository.ts
│   │   └── value-objects/
│   │       ├── transition-condition.ts
│   │       └── transition-permission.ts
│   │
│   ├── instance/
│   │   ├── workflow-instance.entity.ts
│   │   ├── workflow-instance.repository.ts
│   │   ├── value-objects/
│   │   │   ├── instance-status.ts
│   │   │   ├── instance-priority.ts
│   │   │   └── instance-data.ts
│   │   └── events/
│   │       ├── workflow-instance-created.event.ts
│   │       ├── workflow-transition-executed.event.ts
│   │       ├── workflow-instance-completed.event.ts
│   │       └── workflow-instance-cancelled.event.ts
│   │
│   ├── transition-log/
│   │   ├── transition-log.entity.ts
│   │   └── transition-log.repository.ts
│   │
│   ├── approval/
│   │   ├── approval.entity.ts
│   │   ├── approval.repository.ts
│   │   ├── value-objects/
│   │   │   ├── approval-mode.ts
│   │   │   └── approval-decision.ts
│   │   └── events/
│   │       ├── approval-completed.event.ts
│   │       ├── approval-delegated.event.ts
│   │       └── approval-expired.event.ts
│   │
│   ├── assignment/
│   │   ├── workflow-assignment.entity.ts
│   │   └── workflow-assignment.repository.ts
│   │
│   ├── task/
│   │   ├── workflow-task.entity.ts
│   │   ├── workflow-task.repository.ts
│   │   ├── value-objects/
│   │   │   ├── task-type.ts
│   │   │   └── task-status.ts
│   │   └── events/
│   │       └── workflow-task-completed.event.ts
│   │
│   ├── timeline/
│   │   ├── workflow-timeline-entry.entity.ts
│   │   ├── workflow-timeline-entry.repository.ts
│   │   └── value-objects/
│   │       └── timeline-entry-type.ts
│   │
│   └── common/
│       ├── errors/
│       │   ├── domain-error.ts
│       │   ├── workflow-definition-not-found.error.ts
│       │   ├── instance-not-found.error.ts
│       │   ├── invalid-transition.error.ts
│       │   ├── approval-pending.error.ts
│       │   ├── mandatory-tasks-pending.error.ts
│       │   ├── self-approval-denied.error.ts
│       │   ├── workflow-cycle-detected.error.ts
│       │   ├── published-workflow-immutable.error.ts
│       │   └── duplicate-instance.error.ts
│       └── services/
│           ├── dag-validator.service.ts               # Domain Service
│           └── workflow-instance-factory.ts            # Factory
│
├── application/
│   ├── definition/
│   │   ├── commands/
│   │   │   ├── create-definition/
│   │   │   │   ├── create-definition.command.ts
│   │   │   │   └── create-definition.handler.ts
│   │   │   ├── update-definition/
│   │   │   ├── publish-definition/
│   │   │   ├── create-definition-version/
│   │   │   └── delete-definition/
│   │   ├── queries/
│   │   │   ├── get-definition/
│   │   │   └── list-definitions/
│   │   └── dto/
│   │       ├── workflow-definition.response.dto.ts
│   │       ├── workflow-definition-detail.dto.ts
│   │       ├── create-workflow-definition.dto.ts
│   │       ├── update-workflow-definition.dto.ts
│   │       └── definition-filter.dto.ts
│   │
│   ├── stage/
│   │   ├── commands/
│   │   │   ├── create-stage/
│   │   │   ├── update-stage/
│   │   │   └── delete-stage/
│   │   ├── queries/
│   │   │   └── list-stages/
│   │   └── dto/
│   │       ├── stage.response.dto.ts
│   │       ├── create-stage.dto.ts
│   │       └── update-stage.dto.ts
│   │
│   ├── transition/
│   │   ├── commands/
│   │   │   ├── create-transition/
│   │   │   └── delete-transition/
│   │   ├── queries/
│   │   │   └── list-transitions/
│   │   └── dto/
│   │
│   ├── instance/
│   │   ├── commands/
│   │   │   ├── create-instance/
│   │   │   │   ├── create-instance.command.ts
│   │   │   │   └── create-instance.handler.ts
│   │   │   ├── execute-transition/
│   │   │   │   ├── execute-transition.command.ts
│   │   │   │   └── execute-transition.handler.ts
│   │   │   ├── cancel-instance/
│   │   │   └── reassign-instance/
│   │   ├── queries/
│   │   │   ├── get-instance/
│   │   │   ├── list-instances/
│   │   │   ├── get-instance-timeline/
│   │   │   └── get-overdue-instances/
│   │   └── dto/
│   │       ├── workflow-instance.response.dto.ts
│   │       ├── workflow-instance-detail.dto.ts
│   │       ├── create-instance.dto.ts
│   │       ├── execute-transition.dto.ts
│   │       ├── cancel-instance.dto.ts
│   │       ├── reassign.dto.ts
│   │       └── instance-filter.dto.ts
│   │
│   ├── approval/
│   │   ├── commands/
│   │   │   ├── approve/
│   │   │   │   ├── approve.command.ts
│   │   │   │   └── approve.handler.ts
│   │   │   ├── reject/
│   │   │   │   ├── reject.command.ts
│   │   │   │   └── reject.handler.ts
│   │   │   └── delegate-approval/
│   │   ├── queries/
│   │   │   └── list-approvals/
│   │   └── dto/
│   │       ├── approval.response.dto.ts
│   │       ├── approval-decision.dto.ts
│   │       └── delegate-approval.dto.ts
│   │
│   ├── task/
│   │   ├── commands/
│   │   │   └── complete-task/
│   │   ├── queries/
│   │   │   ├── list-tasks/
│   │   │   └── list-my-tasks/
│   │   └── dto/
│   │
│   ├── dashboard/
│   │   └── queries/
│   │       ├── get-summary/
│   │       ├── get-my-pending/
│   │       └── get-overdue/
│   │
│   └── common/
│       ├── workflow.mapper.ts
│       ├── pagination.dto.ts
│       └── pending-items.dto.ts
│
├── infrastructure/
│   ├── persistence/
│   │   ├── prisma/
│   │   │   ├── definition/
│   │   │   │   └── prisma-definition.repository.ts
│   │   │   ├── stage/
│   │   │   │   └── prisma-stage.repository.ts
│   │   │   ├── transition/
│   │   │   │   └── prisma-transition.repository.ts
│   │   │   ├── instance/
│   │   │   │   └── prisma-instance.repository.ts
│   │   │   ├── transition-log/
│   │   │   │   └── prisma-transition-log.repository.ts
│   │   │   ├── approval/
│   │   │   │   └── prisma-approval.repository.ts
│   │   │   ├── assignment/
│   │   │   │   └── prisma-assignment.repository.ts
│   │   │   ├── task/
│   │   │   │   └── prisma-task.repository.ts
│   │   │   └── timeline/
│   │   │       └── prisma-timeline.repository.ts
│   │   └── mappers/
│   │       ├── definition.prisma-mapper.ts
│   │       ├── stage.prisma-mapper.ts
│   │       ├── transition.prisma-mapper.ts
│   │       ├── instance.prisma-mapper.ts
│   │       ├── transition-log.prisma-mapper.ts
│   │       ├── approval.prisma-mapper.ts
│   │       ├── assignment.prisma-mapper.ts
│   │       ├── task.prisma-mapper.ts
│   │       └── timeline.prisma-mapper.ts
│   │
│   ├── controllers/
│   │   ├── definitions.controller.ts
│   │   ├── stages.controller.ts
│   │   ├── transitions.controller.ts
│   │   ├── instances.controller.ts
│   │   ├── approvals.controller.ts
│   │   ├── tasks.controller.ts
│   │   ├── timeline.controller.ts
│   │   └── dashboard.controller.ts
│   │
│   ├── event-publishers/
│   │   ├── definition-event.publisher.ts
│   │   ├── instance-event.publisher.ts
│   │   └── approval-event.publisher.ts
│   │
│   ├── event-consumers/
│   │   ├── auto-transition.consumer.ts        # Consome eventos externos para auto-transition
│   │   └── entity-workflow.consumer.ts        # Consome eventos de entidades (RFP, etc.)
│   │
│   ├── schedulers/
│   │   ├── deadline-checker.scheduler.ts      # Verifica deadlines vencidos
│   │   └── approval-reminder.scheduler.ts     # Envia lembretes de aprovação
│   │
│   └── guards/
│       ├── workflow-permission.guard.ts
│       └── workflow-approval-access.guard.ts  # Valida se user pode aprovar
│
├── workflow.module.ts
└── index.ts
```

---

## 3. Domain Layer

### 3.1 Aggregate Roots vs Entities

| Aggregate Root    | Raiz                | Entidades filhas             | Value Objects                              |
|-------------------|---------------------|------------------------------|--------------------------------------------|
| **WorkflowDefinition** | `WorkflowDefinitionEntity` | `StageEntity`, `TransitionEntity` | `EntityType`, `WorkflowVersion`       |
| **WorkflowInstance**   | `WorkflowInstanceEntity`   | `TransitionLogEntity`, `WorkflowAssignmentEntity`, `WorkflowTaskEntity` | `InstanceStatus`, `InstancePriority`, `InstanceData` |
| **Approval**      | `ApprovalEntity`    | —                            | `ApprovalMode`, `ApprovalDecision`         |

### 3.2 Domain Services (puros, sem dependências)

```
DagValidatorService
├── validate(workflowDefinition: WorkflowDefinitionEntity): ValidationResult
│   ├── Construir grafo: Stage → fromStages → Transition → toStage
│   ├── Verificar: exatamente 1 initial stage
│   ├── Verificar: pelo menos 1 final stage
│   ├── Verificar: ordem sequencial sem gaps
│   ├── Verificar: DAG (DFS cycle detection)
│   └── Verificar: slug uniqueness entre estágios

WorkflowInstanceFactory
├── create(definition: WorkflowDefinitionEntity, params: CreateParams): WorkflowInstanceEntity
│   ├── Encontrar estágio inicial
│   ├── Criar instância com estágio inicial
│   ├── Gerar assignments automáticos (via assignmentConfig)
│   ├── Gerar tasks automáticas (se configuradas no definition)
│   ├── Gerar approvals (se estágio inicial é APPROVAL)
│   └── Calcular deadlineAt (se estágio tem deadlineHours)

ApprovalEngine
├── processDecision(approval: ApprovalEntity, decision: Decision, comment: string): ApprovalResult
│   ├── Registrar decisão na approval
│   ├── Se modo ANY e APPROVED → resolver todas como SKIPPED, liberar
│   ├── Se modo ALL e APPROVED → verificar se todas aprovaram
│   ├── Se modo SEQUENTIAL → liberar próxima da fila
│   ├── Se REJECTED → instância retorna ao rejectionTargetStage
│   └── Publicar ApprovalCompletedEvent

TransitionValidator
├── canExecute(instance: WorkflowInstanceEntity, transition: TransitionEntity, user: UserId): ValidationResult
│   ├── Verificar: transição existe no estágio atual
│   ├── Verificar: usuário tem permissão (roles)
│   ├── Verificar: condições (requiresComment, requiresAttachment)
│   ├── Verificar: tasks mandatórias concluídas
│   ├── Verificar: approvals resolvidas (se estágio APPROVAL)
│   └── Verificar: entidade existe e é válida
```

### 3.3 Domain Events

```
WorkflowDefinition Events:
├── WorkflowDefinitionCreatedEvent     → type: com.bidflow.workflow.definition.created.v1
├── WorkflowDefinitionPublishedEvent   → type: com.bidflow.workflow.definition.published.v1
└── WorkflowDefinitionVersionedEvent   → type: com.bidflow.workflow.definition.versioned.v1

WorkflowInstance Events:
├── WorkflowInstanceCreatedEvent       → type: com.bidflow.workflow.instance.created.v1
├── WorkflowTransitionExecutedEvent    → type: com.bidflow.workflow.transition.executed.v1
├── WorkflowInstanceCompletedEvent     → type: com.bidflow.workflow.instance.completed.v1
└── WorkflowInstanceCancelledEvent     → type: com.bidflow.workflow.instance.cancelled.v1

Approval Events:
├── ApprovalCompletedEvent             → type: com.bidflow.workflow.approval.completed.v1
├── ApprovalDelegatedEvent             → type: com.bidflow.workflow.approval.delegated.v1
└── ApprovalExpiredEvent              → type: com.bidflow.workflow.approval.expired.v1

Task Events:
└── WorkflowTaskCompletedEvent         → type: com.bidflow.workflow.task.completed.v1
```

### 3.4 Domain Errors

```
DomainError (abstract) → code: string, message: string, statusCode: number

WorkflowDefinitionNotFoundError  → DEF_NOT_FOUND,      404
InstanceNotFoundError            → INST_NOT_FOUND,      404
StageNotFoundError               → STAGE_NOT_FOUND,     404
TransitionNotFoundError          → TRANS_NOT_FOUND,     404
ApprovalNotFoundError            → APPR_NOT_FOUND,      404
InvalidTransitionError           → INVALID_TRANSITION,      422
TransitionNotAllowedError        → TRANSITION_NOT_ALLOWED,  403
ApprovalPendingError             → APPROVALS_PENDING,       422
MandatoryTasksPendingError       → MANDATORY_TASKS_PENDING, 422
SelfApprovalDeniedError          → SELF_APPROVAL_DENIED,    403
WorkflowCycleDetectedError       → WORKFLOW_CYCLE,          422
PublishedWorkflowImmutableError  → PUBLISHED_IMMUTABLE,     422
DuplicateInstanceError           → DUPLICATE_INSTANCE,      409
MaxDelegationExceededError       → MAX_DELEGATION,          422
ApprovalAlreadyDecidedError      → ALREADY_DECIDED,         422
InstanceAlreadyCompletedError    → ALREADY_COMPLETED,       422
```

---

## 4. Application Layer

### 4.1 CQRS Commands

| Aggregate     | Command                        | Handler                       | Eventos                           |
|---------------|--------------------------------|-------------------------------|-----------------------------------|
| Definition    | `CreateDefinitionCommand`      | `CreateDefinitionHandler`     | `WorkflowDefinitionCreatedEvent`  |
| Definition    | `UpdateDefinitionCommand`      | `UpdateDefinitionHandler`     | —                                 |
| Definition    | `PublishDefinitionCommand`     | `PublishDefinitionHandler`    | `WorkflowDefinitionPublishedEvent`|
| Definition    | `CreateDefinitionVersionCommand` | `CreateDefinitionVersionHandler` | `WorkflowDefinitionVersionedEvent`|
| Definition    | `DeleteDefinitionCommand`      | `DeleteDefinitionHandler`     | —                                 |
| Stage         | `CreateStageCommand`           | `CreateStageHandler`          | —                                 |
| Stage         | `UpdateStageCommand`           | `UpdateStageHandler`          | —                                 |
| Stage         | `DeleteStageCommand`           | `DeleteStageHandler`          | —                                 |
| Transition    | `CreateTransitionCommand`      | `CreateTransitionHandler`     | —                                 |
| Transition    | `DeleteTransitionCommand`      | `DeleteTransitionHandler`     | —                                 |
| Instance      | `CreateInstanceCommand`        | `CreateInstanceHandler`       | `WorkflowInstanceCreatedEvent`    |
| Instance      | `ExecuteTransitionCommand`     | `ExecuteTransitionHandler`    | `WorkflowTransitionExecutedEvent`+ `WorkflowInstanceCompletedEvent`(se final) |
| Instance      | `CancelInstanceCommand`        | `CancelInstanceHandler`       | `WorkflowInstanceCancelledEvent`  |
| Instance      | `ReassignInstanceCommand`      | `ReassignInstanceHandler`     | —                                 |
| Approval      | `ApproveCommand`               | `ApproveHandler`              | `ApprovalCompletedEvent`          |
| Approval      | `RejectCommand`                | `RejectHandler`               | `ApprovalCompletedEvent`          |
| Approval      | `DelegateApprovalCommand`      | `DelegateApprovalHandler`     | `ApprovalDelegatedEvent`          |
| Task          | `CompleteTaskCommand`          | `CompleteTaskHandler`         | `WorkflowTaskCompletedEvent`      |

### 4.2 CQRS Queries

| Query                           | Handler                        | Uso                                   |
|---------------------------------|--------------------------------|---------------------------------------|
| `GetDefinitionQuery`            | `GetDefinitionHandler`         | Detalhes da definição                 |
| `ListDefinitionsQuery`          | `ListDefinitionsHandler`       | Todas as definições do tenant         |
| `ListStagesQuery`               | `ListStagesHandler`            | Estágios de uma definição             |
| `ListTransitionsQuery`          | `ListTransitionsHandler`       | Transições de uma definição           |
| `GetInstanceQuery`              | `GetInstanceHandler`           | Detalhes da instância                 |
| `ListInstancesQuery`            | `ListInstancesHandler`         | Instâncias com filtros                |
| `GetInstanceTimelineQuery`      | `GetInstanceTimelineHandler`   | Timeline da instância                 |
| `ListApprovalsQuery`            | `ListApprovalsHandler`         | Aprovações da instância               |
| `ListTasksQuery`                | `ListTasksHandler`             | Tarefas da instância                  |
| `ListMyPendingTasksQuery`       | `ListMyPendingTasksHandler`    | Minhas tarefas pendentes              |
| `GetSummaryQuery`               | `GetSummaryHandler`            | Dashboard summary                     |
| `GetMyPendingItemsQuery`        | `GetMyPendingItemsHandler`     | Aprovações + tarefas do user          |
| `GetOverdueInstancesQuery`      | `GetOverdueInstancesHandler`   | Instâncias com deadline vencido       |

### 4.3 Estrutura de Handler

```
CreateInstanceHandler
├── Dependências:
│   ├── WorkflowDefinitionRepository
│   ├── WorkflowInstanceRepository
│   ├── WorkflowAssignmentRepository
│   ├── ApprovalRepository
│   ├── WorkflowTaskRepository
│   ├── WorkflowTimelineEntryRepository
│   ├── WorkflowInstanceFactory (domain service)
│   ├── EventPublisher
│   └── TenantContext
│
├── execute(command: CreateInstanceCommand): Promise<WorkflowInstanceResponseDto>
│   ├── 1. Buscar WorkflowDefinition (ativa e published)
│   ├── 2. Validar que entidade não tem instância ativa (unique constraint)
│   ├── 3. Validar se maxConcurrentInstances foi atingido
│   ├── 4. WorkflowInstanceFactory.create(definition, params)
│   ├── 5. Salvar: instance, assignments, approvals, tasks
│   ├── 6. Criar WorkflowTimelineEntry (INSTANCE_CREATED)
│   ├── 7. Publicar WorkflowInstanceCreatedEvent
│   └── 8. Mapear e retornar DTO

ExecuteTransitionHandler
├── Dependências:
│   ├── WorkflowInstanceRepository
│   ├── WorkflowDefinitionRepository (para validar)
│   ├── TransitionLogRepository
│   ├── TransitionValidator (domain service)
│   ├── ApprovalEngine (domain service)
│   ├── WorkflowTimelineEntryRepository
│   ├── EventPublisher
│   └── TenantContext
│
├── execute(command: ExecuteTransitionCommand): Promise<WorkflowInstanceResponseDto>
│   ├── 1. Buscar WorkflowInstance
│   ├── 2. Buscar Transition + Stage da instância
│   ├── 3. TransitionValidator.canExecute(instance, transition, user)
│   ├── 4. Criar TransitionLog (append-only)
│   ├── 5. Atualizar instance: currentStageId, enteredStageAt, deadlineAt
│   ├── 6. Se novo estágio é APPROVAL: criar Approval records
│   ├── 7. Se novo estágio é FINAL: marcar instance como COMPLETED
│   ├── 8. Se rejection: atualizar previousStage
│   ├── 9. Criar WorkflowTimelineEntry (TRANSITION_EXECUTED)
│   ├── 10. Publicar evento (completed se final, transition caso contrário)
│   └── 11. Mapear e retornar DTO
```

---

## 5. Infrastructure Layer

### 5.1 Controllers

```
DefinitionsController           → /api/v1/workflow/definitions
├── POST / → createDefinition
├── GET / → listDefinitions
├── GET /:id → getDefinition
├── PATCH /:id → updateDefinition
├── POST /:id/publish → publishDefinition
├── POST /:id/version → createDefinitionVersion
└── DELETE /:id → deleteDefinition

StagesController                → /api/v1/workflow/definitions/:defId/stages
├── POST / → createStage
├── GET / → listStages
├── PATCH /:id → updateStage
└── DELETE /:id → deleteStage

TransitionsController           → /api/v1/workflow/definitions/:defId/transitions
├── POST / → createTransition
├── GET / → listTransitions
└── DELETE /:id → deleteTransition

InstancesController             → /api/v1/workflow/instances
├── POST / → createInstance
├── GET / → listInstances
├── GET /:id → getInstance
├── POST /:id/transition → executeTransition
├── POST /:id/cancel → cancelInstance
└── POST /:id/reassign → reassignInstance

ApprovalsController             → /api/v1/workflow/instances/:instId/approvals
├── GET / → listApprovals
├── POST /:id/approve → approve
├── POST /:id/reject → reject
└── POST /:id/delegate → delegateApproval

TasksController                 → /api/v1/workflow/instances/:instId/tasks
├── GET / → listTasks
└── POST /:id/complete → completeTask

TimelineController              → /api/v1/workflow/instances/:instId/timeline
└── GET / → getTimeline

DashboardController             → /api/v1/workflow/dashboard
├── GET /summary → getSummary
├── GET /my-pending → getMyPending
└── GET /overdue → getOverdue
```

### 5.2 Controller → Handler Mapping

```
Cada controller method:
├── 1. @UseGuards(AuthGuard, TenantGuard, WorkflowPermissionGuard)
├── 2. @Body() dto validado pelo ValidationPipe
├── 3. @CurrentTenant() tenant: TenantContext
├── 4. CommandBus.execute(command)  ou  QueryBus.execute(query)
└── 5. Retornar DTO com status HTTP adequado
```

### 5.3 Schedulers (Infrastructure Services)

```
DeadlineCheckerScheduler
├── Frequência: 5 min
├── Query: workflow_instances where status = ACTIVE AND deadlineAt < now()
├── Para cada instância:
│   ├── Criar WorkflowTimelineEntry (DEADLINE_UPDATED)
│   ├── Notificar responsáveis
│   └── Log de alerta
└── Métrica: bidflow_wf_overdue_instances

ApprovalReminderScheduler
├── Frequência: 1 hora
├── Query: approvals where status = PENDING AND deadlineAt < now() + 24h AND (remindedAt < now() - 24h OR remindedAt IS NULL)
├── Para cada approval:
│   ├── Enviar notificação ao assignedTo
│   ├── Atualizar remindedAt
│   └── Se deadlineExcedido: ApprovalExpiredEvent
└── Métrica: bidflow_wf_approval_reminders_sent
```

### 5.4 Event Consumers

```
AutoTransitionConsumer
├── Exchange: bidflow.domain (topic)
├── Fila: bidflow.workflow.auto-transition
├── Consome: eventos que disparam auto-transitions
│   ├── Binding key: {tenantId}.{entityType}.{action}
│   └── Ex: com.bidflow.bidding.proposal.submitted.v1
├── Handler: onEvent(event: CloudEvent)
│   ├── 1. Buscar definition com autoTriggerEvent matching
│   ├── 2. Buscar transition isAutomatic com autoTriggerEvent
│   ├── 3. Buscar instance da entidade no estágio de origem
│   ├── 4. Executar ExecuteTransitionCommand automaticamente
│   └── 5. Log + métrica

EntityWorkflowConsumer
├── Consome: eventos de criação de entidades (RFP, PO, etc.)
├── Handler: onEntityCreated(event: CloudEvent)
│   ├── 1. Buscar definition por entityType
│   ├── 2. Se definition com auto-start configurado:
│   └── 3. Executar CreateInstanceCommand
```

---

## 6. Modules (NestJS)

### 6.1 Estrutura do Módulo Raiz

```
workflow.module.ts
├── imports: [CqrsModule, PrismaModule, RabbitMQModule, ScheduleModule]
├── controllers: [
│     DefinitionsController,
│     StagesController,
│     TransitionsController,
│     InstancesController,
│     ApprovalsController,
│     TasksController,
│     TimelineController,
│     DashboardController
│   ]
├── providers: [
│     // Repositories (Ports → Adapters)
│     { provide: WorkflowDefinitionRepository, useClass: PrismaDefinitionRepository },
│     { provide: StageRepository, useClass: PrismaStageRepository },
│     { provide: TransitionRepository, useClass: PrismaTransitionRepository },
│     { provide: WorkflowInstanceRepository, useClass: PrismaInstanceRepository },
│     { provide: TransitionLogRepository, useClass: PrismaTransitionLogRepository },
│     { provide: ApprovalRepository, useClass: PrismaApprovalRepository },
│     { provide: WorkflowAssignmentRepository, useClass: PrismaAssignmentRepository },
│     { provide: WorkflowTaskRepository, useClass: PrismaTaskRepository },
│     { provide: WorkflowTimelineEntryRepository, useClass: PrismaTimelineRepository },
│
│     // Domain Services
│     DagValidatorService,
│     WorkflowInstanceFactory,
│     ApprovalEngine,
│     TransitionValidator,
│
│     // Command Handlers
│     CreateDefinitionHandler,
│     UpdateDefinitionHandler,
│     PublishDefinitionHandler,
│     CreateDefinitionVersionHandler,
│     DeleteDefinitionHandler,
│     CreateStageHandler,
│     UpdateStageHandler,
│     DeleteStageHandler,
│     CreateTransitionHandler,
│     DeleteTransitionHandler,
│     CreateInstanceHandler,
│     ExecuteTransitionHandler,
│     CancelInstanceHandler,
│     ReassignInstanceHandler,
│     ApproveHandler,
│     RejectHandler,
│     DelegateApprovalHandler,
│     CompleteTaskHandler,
│
│     // Query Handlers
│     GetDefinitionHandler,
│     ListDefinitionsHandler,
│     ListStagesHandler,
│     ListTransitionsHandler,
│     GetInstanceHandler,
│     ListInstancesHandler,
│     GetInstanceTimelineHandler,
│     ListApprovalsHandler,
│     ListTasksHandler,
│     ListMyPendingTasksHandler,
│     GetSummaryHandler,
│     GetMyPendingItemsHandler,
│     GetOverdueInstancesHandler,
│
│     // Event Publishers
│     DefinitionEventPublisher,
│     InstanceEventPublisher,
│     ApprovalEventPublisher,
│
│     // Event Consumers
│     AutoTransitionConsumer,
│     EntityWorkflowConsumer,
│
│     // Schedulers
│     DeadlineCheckerScheduler,
│     ApprovalReminderScheduler,
│   ]
└── exports: []
```

### 6.2 Pontos de Extensão

Para adicionar um novo aggregate no Workflow Engine:

```
1. domain/<aggregate>/<aggregate>.entity.ts           → Entidade + invariantes
2. domain/<aggregate>/<aggregate>.repository.ts        → Interface (port)
3. domain/<aggregate>/value-objects/                    → Value Objects
4. domain/<aggregate>/events/                           → Domain Events
5. domain/common/errors/<error>.ts                      → Domain Error
6. application/<aggregate>/commands/<command>/          → Command + Handler
7. application/<aggregate>/queries/<query>/             → Query + Handler
8. application/<aggregate>/dto/                          → DTOs
9. infrastructure/persistence/prisma/<aggregate>/       → Prisma Repository
10. infrastructure/persistence/mappers/                  → Prisma Mapper
11. infrastructure/controllers/                          → Controller REST
12. workflow.module.ts                                   → Registrar providers
```

---

## 7. Repositories

### 7.1 Interfaces (Port) — Domain Layer

```
WorkflowDefinitionRepository
├── save(definition: WorkflowDefinitionEntity): Promise<void>
├── findById(id: string): Promise<WorkflowDefinitionEntity | null>
├── findBySlug(slug: string, tenantId: string): Promise<WorkflowDefinitionEntity | null>
├── findMany(filter: DefinitionFilter): Promise<WorkflowDefinitionEntity[]>
├── findByEntityType(entityType: string, tenantId: string): Promise<WorkflowDefinitionEntity[]>
└── delete(id: string): Promise<void>

StageRepository
├── save(stage: StageEntity): Promise<void>
├── findById(id: string): Promise<StageEntity | null>
├── findByDefinition(definitionId: string): Promise<StageEntity[]>
├── findInitialStage(definitionId: string): Promise<StageEntity | null>
└── delete(id: string): Promise<void>

TransitionRepository
├── save(transition: TransitionEntity): Promise<void>
├── findById(id: string): Promise<TransitionEntity | null>
├── findByDefinition(definitionId: string): Promise<TransitionEntity[]>
├── findAvailable(fromStageId: string): Promise<TransitionEntity[]>
├── findByAutoTriggerEvent(eventType: string, defId: string): Promise<TransitionEntity | null>
└── delete(id: string): Promise<void>

WorkflowInstanceRepository
├── save(instance: WorkflowInstanceEntity): Promise<void>
├── findById(id: string): Promise<WorkflowInstanceEntity | null>
├── findMany(filter: InstanceFilter): Promise<WorkflowInstanceEntity[]>
├── count(filter: InstanceFilter): Promise<number>
├── findByEntity(entityType: string, entityId: string): Promise<WorkflowInstanceEntity | null>
├── findOverdue(tenantId: string): Promise<WorkflowInstanceEntity[]>
├── findActiveByDefinition(defId: string): Promise<number>
└── findByAssignedUser(userId: string, tenantId: string): Promise<WorkflowInstanceEntity[]>

TransitionLogRepository (append-only)
├── save(log: TransitionLogEntity): Promise<void>
├── findByInstance(instanceId: string): Promise<TransitionLogEntity[]>
└── countByInstance(instanceId: string): Promise<number>

ApprovalRepository
├── save(approval: ApprovalEntity): Promise<void>
├── findById(id: string): Promise<ApprovalEntity | null>
├── findByInstance(instanceId: string): Promise<ApprovalEntity[]>
├── findPendingByUser(userId: string, tenantId: string): Promise<ApprovalEntity[]>
├── findPendingByStage(instanceId: string, stageId: string): Promise<ApprovalEntity[]>
├── countPendingByInstance(instanceId: string): Promise<number>
└── markExpired(id: string): Promise<void>

WorkflowAssignmentRepository
├── save(assignment: WorkflowAssignmentEntity): Promise<void>
├── findByInstance(instanceId: string): Promise<WorkflowAssignmentEntity[]>
├── findActiveByUser(userId: string, tenantId: string): Promise<WorkflowAssignmentEntity[]>
└── delete(id: string): Promise<void>

WorkflowTaskRepository
├── save(task: WorkflowTaskEntity): Promise<void>
├── findById(id: string): Promise<WorkflowTaskEntity | null>
├── findByInstance(instanceId: string): Promise<WorkflowTaskEntity[]>
├── findPendingByUser(userId: string, tenantId: string): Promise<WorkflowTaskEntity[]>
├── countMandatoryPending(instanceId: string): Promise<number>
└── delete(id: string): Promise<void>

WorkflowTimelineEntryRepository (append-only)
├── save(entry: WorkflowTimelineEntryEntity): Promise<void>
├── findByInstance(instanceId: string, pagination): Promise<WorkflowTimelineEntryEntity[]>
└── createMany(entries: WorkflowTimelineEntryEntity[]): Promise<void>
```

### 7.2 Filtros

```
DefinitionFilter
├── tenantId: string (obrigatório)
├── entityType: string (opcional)
├── isActive: boolean (opcional)
├── search: string (opcional)
├── page, limit, sort

InstanceFilter
├── tenantId: string (obrigatório)
├── status: InstanceStatus[] (opcional)
├── workflowDefinitionId: string (opcional)
├── entityType: string (opcional)
├── entityId: string (opcional)
├── currentStageId: string (opcional)
├── assignedTo: string (opcional)
├── priority: InstancePriority[] (opcional)
├── createdAtFrom: Date (opcional)
├── createdAtTo: Date (opcional)
├── page, limit, sort
```

---

## 8. DTOs & Contracts

### 8.1 DTOs por Controller

```
Definitions:
├── CreateWorkflowDefinitionDto    → name, slug, description, entityType, icon, color, metadata
├── UpdateWorkflowDefinitionDto    → PartialType(CreateWorkflowDefinitionDto)
├── DefinitionFilterDto            → entityType, isActive, search
├── WorkflowDefinitionResponseDto  → id, name, slug, entityType, version, isPublished, isActive, createdAt
├── WorkflowDefinitionDetailDto    → + stages[], transitions[]
└── PublishDefinitionResponseDto   → id, version, isPublished, publishedAt

Stages:
├── CreateStageDto                 → slug, name, description, order, type, color, approvalConfig, assignmentConfig, deadlineHours, notificação, rejectionTargetStageId
├── UpdateStageDto                 → PartialType(CreateStageDto)
├── StageResponseDto               → id, slug, name, type, order, isInitial, isFinal, deadlineHours, createdAt

Transitions:
├── CreateTransitionDto            → slug, name, fromStageId, toStageId, conditions, permissions, isAutomatic, autoTriggerEvent
├── TransitionResponseDto          → id, slug, name, fromStageId, toStageId, conditions, isAutomatic

Instances:
├── CreateWorkflowInstanceDto      → workflowDefinitionId, entityType, entityId, title, priority, data
├── ExecuteTransitionDto           → transitionSlug, comment (optional)
├── CancelInstanceDto              → reason (required)
├── ReassignDto                    → assignedTo (required), comment (optional)
├── WorkflowInstanceResponseDto    → id, status, currentStage, entityType, entityId, title, assignedTo, deadlineAt, priority, createdAt
├── WorkflowInstanceDetailDto      → + transitionLog[], approvals[], tasks[], assignment, timeline preview
└── InstanceFilterDto              → status[], definitionId, entityType, entityId, assignedTo, priority, createdAtFrom/To, page, limit

Approvals:
├── ApprovalDecisionDto            → comment (optional)
├── DelegateApprovalDto            → delegatedTo (required), reason (optional)
├── ApprovalResponseDto            → id, status, approvalMode, assignedTo, decidedAt, decision, comment, deadlineAt, delegatedTo

Tasks:
├── CompleteWorkflowTaskDto        → completedData (optional JSON)
├── WorkflowTaskResponseDto        → id, title, type, status, assignedTo, isMandatory, dueDate

Timeline:
└── WorkflowTimelineEntryDto       → id, type, title, description, occurredAt, createdBy, metadata

Dashboard:
├── WorkflowSummaryDto             → totalActive, totalCompleted, totalOverdue, pendingApprovals, pendingTasks, byWorkflow[]
├── PendingItemsDto                → approvals: ApprovalResponseDto[], tasks: WorkflowTaskResponseDto[], overdue: WorkflowInstanceResponseDto[]
```

---

## 9. Eventos

### 9.1 Fluxo de publicação

```
                  ┌──────────────────────────┐
                  │     Command Handler       │
                  │   (Application Layer)     │
                  └────────────┬─────────────┘
                               │ domainEvents[]
                               ▼
                  ┌──────────────────────────┐
                  │     OutboxService         │
                  │   (Infrastructure)        │
                  └────────────┬─────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
   ┌────────────────────┐          ┌──────────────────────┐
   │   event_store DB   │          │  RabbitMQ            │
   │   (idempotência)   │          │  bidflow.domain      │
   └────────────────────┘          └──────────────────────┘
                                            │
                               ┌────────────┴────────────┐
                               ▼                         ▼
                    ┌──────────────────┐     ┌──────────────────────┐
                    │ AutoTransition   │     │ EntityWorkflow      │
                    │ Consumer (workflow)│    │ Consumer (externo)  │
                    └──────────────────┘     └──────────────────────┘
```

---

## 10. Services

### 10.1 Domain Services (no Domain Layer)

| Service                    | Responsabilidade                                    |
|----------------------------|-----------------------------------------------------|
| `DagValidatorService`      | Valida DAG, estágios, transições, ciclo detection   |
| `WorkflowInstanceFactory`  | Cria instância com assignments, approvals, tasks    |
| `ApprovalEngine`           | Processa decisões ANY/ALL/SEQUENTIAL                |
| `TransitionValidator`      | Valida permissões, condições, pré-requisitos         |

### 10.2 Application Services (no Application Layer)

| Service                       | Responsabilidade                                        |
|-------------------------------|---------------------------------------------------------|
| `WorkflowPublishingService`   | Congela definição, valida DAG, cria versão              |
| `InstanceTransitionService`   | Orquestra transição completa + logs + timeline          |
| `ApprovalResolutionService`   | Gerencia resolução de approvals (ANY/ALL/SEQUENTIAL)    |
| `PendingItemsService`         | Agrega approvals + tasks pendentes do usuário           |
| `OverdueTrackingService`      | Tracking de deadlines vencidos e alertas                |

### 10.3 Infrastructure Services (no Infrastructure Layer)

| Service                           | Responsabilidade                           |
|-----------------------------------|--------------------------------------------|
| `PrismaTenantSchemaProvider`      | PrismaClient por schema de tenant          |
| `WorkflowEventPublisher`          | Publica eventos no RabbitMQ                |
| `WorkflowAuditService`            | Audit logs do workflow                     |
| `DeadlineCheckerScheduler`        | Scheduler de deadline tracking             |
| `ApprovalReminderScheduler`       | Scheduler de lembretes de aprovação        |
| `DagValidationRunner`             | Runner de validação de DAG no publish      |

---

## 11. Handlers (CQRS)

### 11.1 Estrutura de Handler

```
ExecuteTransitionHandler
├── constructor(
│     @Inject(WorkflowInstanceRepository) private instanceRepo,
│     @Inject(WorkflowDefinitionRepository) private defRepo,
│     @Inject(TransitionLogRepository) private logRepo,
│     @Inject(WorkflowTimelineEntryRepository) private timelineRepo,
│     private transitionValidator: TransitionValidator,
│     private approvalEngine: ApprovalEngine,
│     private eventPublisher: InstanceEventPublisher,
│     @Inject(CurrentTenant) private tenant: TenantContext
│   )
│
├── execute(command: ExecuteTransitionCommand): Promise<WorkflowInstanceResponseDto>
│   Passos:
│   1. tenantId ← this.tenant.tenantId
│   2. Buscar instância:
│      const instance = await this.instanceRepo.findById(command.instanceId)
│      if (!instance) throw new InstanceNotFoundError(command.instanceId)
│   3. Buscar definição + transição:
│      const definition = await this.defRepo.findById(instance.workflowDefinitionId)
│      const transition = definition.findTransition(command.transitionSlug, instance.currentStageId)
│      if (!transition) throw new TransitionNotFoundError()
│   4. Validar:
│      const validation = this.transitionValidator.canExecute(instance, transition, this.tenant.userId)
│      if (!validation.valid) throw new InvalidTransitionError(validation.reason)
│   5. Executar transição:
│      const log = TransitionLogEntity.create({
│        instanceId: instance.id, transitionSlug, fromStage: instance.currentStageId,
│        toStage: transition.toStageId, executedBy: this.tenant.userId,
│      })
│      const nextStage = definition.getStage(transition.toStageId)
│      instance.moveToStage(nextStage)
│   6. Se nova stage é FINAL: markAsCompleted()
│   7. Se nova stage é APPROVAL: criar approvals
│   8. Salvar tudo em transação:
│      await this.prisma.$transaction([
│        this.instanceRepo.save(instance),
│        this.logRepo.save(log),
│        ...approvals.map(a => this.approvalRepo.save(a)),
│        this.timelineRepo.save(timelineEntry),
│      ])
│   9. Publicar evento:
│      if (instance.isCompleted) this.eventPublisher.publishCompleted(instance)
│      else this.eventPublisher.publishTransition(log)
│   10. Retornar DTO
```

---

## 12. Multi-tenant Separation

### 12.1 Estratégia

```
TIPO: Schema-per-tenant (schema PostgreSQL dedicado por tenant)
COLUNA: tenantId em todas as tabelas (redundância para queries cross-schema)
RESOLUÇÃO: TenantResolutionMiddleware → CurrentTenant context
```

### 12.2 Aplicação nas Camadas

```
CONTROLLER:
├── @UseGuards(AuthGuard, TenantGuard, WorkflowPermissionGuard)
├── TenantGuard: valida tenantId do JWT
├── WorkflowPermissionGuard: RBAC específico do workflow
├── WorkflowApprovalAccessGuard: valida se user pode aprovar aquela approval

HANDLER:
├── @Inject(CurrentTenant) private tenant: TenantContext
├── tenant.tenantId usado em todas as queries de repositório

REPOSITORY:
├── PrismaClient configurado com schema do tenant
├── Todas as queries filtradas por tenantId
├── Cache prefixado: {tenantId}:workflow:...

SCHEDULER:
├── Executa por tenant (loop sobre tenants ativos)
├── Ou query global com tenantId
```

---

## 13. Cross-Cutting Concerns

### 13.1 Versionamento de Definições

```
WorkflowDefinition.version:
├── Nova definição: version = 1
├── Publish: isPublished = true (congela)
├── Alterações requerem nova versão:
│   ├── POST /:id/version → version++ (copia stages + transitions)
│   └── Instâncias existentes continuam na versão antiga
├── Instância nova: usa versão published mais recente
└── Instância em andamento: mantém workflowVersion original
```

### 13.2 DAG Validation (no Publish)

```
PublishDefinitionHandler:
├── 1. Buscar definição com stages + transitions
├── 2. DagValidatorService.validate(definition):
│   ├── Exatamente 1 estágio INITIAL
│   ├── Pelo menos 1 estágio FINAL
│   ├── Ordens sequenciais (1, 2, 3...)
│   ├── Todas as transições referenciam stages válidos
│   ├── Cada estágio tem pelo menos 1 transição de saída (exceto FINAL)
│   ├── DAG validation (DFS cycle detection)
│   ├── Sem slugs duplicados entre stages
│   └── Verification: todos os rejectionTargetStageId são válidos
├── 3. Se válido: isPublished = true, salvar
├── 4. Se inválido: throw WorkflowCycleDetectedError
```

### 13.3 Timeline Automática

```
Geração automática de WorkflowTimelineEntry:
├── INSTANCE_CREATED → ao criar instância
├── TRANSITION_EXECUTED → transição entre estágios
├── APPROVED / REJECTED → decisão de aprovação
├── TASK_CREATED / TASK_COMPLETED → tarefas
├── ASSIGNED / REASSIGNED → atribuições
├── DELEGATED → delegações
├── INSTANCE_COMPLETED / INSTANCE_CANCELLED → estados finais
```

### 13.4 Observabilidade

```
Métricas:
├── bidflow_wf_instances_total{tenant, workflow_slug}
├── bidflow_wf_transitions_total{tenant, transition_slug}
├── bidflow_wf_instances_active{tenant, workflow_slug}
├── bidflow_wf_transition_duration_seconds{tenant}
└── bidflow_wf_approval_response_time_hours{tenant}

Alertas:
├── WorkflowHighFailureRate: taxa de erro em transições > 5%
└── WorkflowOverdueInstances: mais de 100 instâncias em atraso
```

---

## 14. Pipeline de Requisição

### 14.1 Fluxo: Execute Transition

```
HTTP POST /api/v1/workflow/instances/:id/transition
    │
    ▼
┌────────────────────────────────────────┐
│ 1. Global Middleware                    │
│    ├── RequestLoggerMiddleware         │
│    └── TenantResolutionMiddleware      │
└──────────────────┬─────────────────────┘
                   ▼
┌────────────────────────────────────────┐
│ 2. Guards                              │
│    ├── AuthGuard (JWT)                 │
│    ├── TenantGuard (tenant status)     │
│    └── WorkflowPermissionGuard (RBAC)  │
└──────────────────┬─────────────────────┘
                   ▼
┌────────────────────────────────────────┐
│ 3. ValidationPipe                      │
│    └── ExecuteTransitionDto validated  │
└──────────────────┬─────────────────────┘
                   ▼
┌────────────────────────────────────────┐
│ 4. InstancesController.transition()   │
│    ├── @Body() dto                     │
│    ├── @Param() instanceId             │
│    └── CommandBus.execute(cmd)        │
└──────────────────┬─────────────────────┘
                   ▼
┌────────────────────────────────────────┐
│ 5. ExecuteTransitionHandler            │
│    ├── Buscar instance + definition    │
│    ├── TransitionValidator.canExecute  │
│    ├── Criar TransitionLog             │
│    ├── Atualizar instance (stage)      │
│    ├── Se APPROVAL: criar approvals    │
│    ├── Se FINAL: marcar completed      │
│    ├── Salvar tudo em transação        │
│    ├── WorkflowTimelineEntry           │
│    ├── EventPublisher.publish          │
│    └── Mapper → DTO                    │
└──────────────────┬─────────────────────┘
                   ▼
┌────────────────────────────────────────┐
│ 6. AuditInterceptor                   │
│    └── auditService.log(WF_TRANSITION) │
└──────────────────┬─────────────────────┘
                   ▼
┌────────────────────────────────────────┐
│ 7. Response (200 OK)                  │
│    └── WorkflowInstanceResponseDto     │
└────────────────────────────────────────┘
```

---

> **Revisão:** Este documento de arquitetura deve ser usado como guia para implementação do Workflow Engine. Estrutura e camadas seguem DDD com Clean Architecture conforme `docs/architecture-principles.md`.
> 
> **Spec de referência:** `.specify/specs/workflow/workflow-engine.yml`
> 
> **Diferenças do CRM Architecture:** Workflow Engine tem separação clara entre definição (template) e instância (execução), motor de aprovação com 3 modos (ANY/ALL/SEQUENTIAL), validação de DAG, auto-transitions event-driven, schedulers para deadline/approval tracking, e versionamento de definições.
