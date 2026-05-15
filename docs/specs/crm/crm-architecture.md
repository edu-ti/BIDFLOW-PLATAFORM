# CRM Architecture — BidFlow Platform

> **Propósito:** Documento de arquitetura enterprise do módulo CRM baseado na spec `bidflow-crm-001` e nos princípios de DDD com Clean Architecture. Define a estrutura de pastas, módulos, camadas, repositórios, DTOs, eventos, serviços, handlers e isolamento multi-tenant. **Sem implementação de código** — apenas arquitetura.

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
┌─────────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE LAYER                           │
│  (Prisma, RabbitMQ, HTTP, Redis, Guards, Filters, Interceptors)    │
├─────────────────────────────────────────────────────────────────────┤
│                       APPLICATION LAYER                              │
│  (Commands, Queries, Handlers, DTOs, Mappers, Domain Services)     │
├─────────────────────────────────────────────────────────────────────┤
│                         DOMAIN LAYER                                 │
│  (Entities, Aggregate Roots, Value Objects, Repository Interfaces, │
│   Domain Events, Domain Services, Business Rules, Enums)           │
└─────────────────────────────────────────────────────────────────────┘
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
apps/api/src/crm/
├── crm.module.ts                          # Módulo NestJS raiz do CRM
│
├── domain/
│   ├── lead/
│   │   ├── lead.entity.ts
│   │   ├── lead.repository.ts             # Interface (port)
│   │   ├── value-objects/
│   │   │   ├── lead-source.ts
│   │   │   ├── lead-score.ts
│   │   │   └── lead-status.ts
│   │   └── events/
│   │       ├── lead-captured.event.ts
│   │       ├── lead-qualified.event.ts
│   │       ├── lead-converted.event.ts
│   │       └── lead-disqualified.event.ts
│   │
│   ├── customer/
│   │   ├── customer.entity.ts
│   │   ├── customer.repository.ts
│   │   ├── value-objects/
│   │   │   ├── customer-segment.ts
│   │   │   ├── customer-tier.ts
│   │   │   └── contact-info.ts
│   │   └── events/
│   │       └── customer-tier-changed.event.ts
│   │
│   ├── pipeline/
│   │   ├── pipeline.entity.ts
│   │   ├── pipeline.repository.ts
│   │   └── value-objects/
│   │       ├── pipeline-stage.ts
│   │       └── pipeline-status.ts
│   │
│   ├── opportunity/
│   │   ├── opportunity.entity.ts
│   │   ├── opportunity.repository.ts
│   │   ├── value-objects/
│   │   │   ├── opportunity-stage.ts
│   │   │   ├── opportunity-status.ts
│   │   │   └── probability.ts
│   │   └── events/
│   │       ├── opportunity-created.event.ts
│   │       ├── opportunity-stage-changed.event.ts
│   │       ├── opportunity-won.event.ts
│   │       └── opportunity-lost.event.ts
│   │
│   ├── task/
│   │   ├── task.entity.ts
│   │   ├── task.repository.ts
│   │   ├── value-objects/
│   │   │   ├── task-priority.ts
│   │   │   └── task-status.ts
│   │   └── events/
│   │       └── task-completed.event.ts
│   │
│   ├── activity/
│   │   ├── activity.entity.ts
│   │   ├── activity.repository.ts
│   │   └── value-objects/
│   │       └── activity-type.ts
│   │
│   ├── timeline/
│   │   ├── timeline-entry.entity.ts
│   │   ├── timeline-entry.repository.ts
│   │   └── value-objects/
│   │       └── timeline-entry-type.ts
│   │
│   ├── common/
│   │   ├── value-objects/
│   │   │   ├── email.ts
│   │   │   ├── address.ts
│   │   │   ├── money.ts
│   │   │   └── tag.ts
│   │   ├── errors/
│   │   │   ├── domain-error.ts
│   │   │   ├── lead-not-found.error.ts
│   │   │   ├── customer-not-found.error.ts
│   │   │   ├── opportunity-not-found.error.ts
│   │   │   ├── invalid-stage-transition.error.ts
│   │   │   ├── lead-already-converted.error.ts
│   │   │   └── task-without-owner.error.ts
│   │   └── enums/
│   │       ├── lead-status.enum.ts
│   │       ├── lead-source.enum.ts
│   │       ├── customer-status.enum.ts
│   │       ├── customer-segment.enum.ts
│   │       ├── customer-tier.enum.ts
│   │       ├── opportunity-status.enum.ts
│   │       ├── task-priority.enum.ts
│   │       ├── task-status.enum.ts
│   │       ├── activity-type.enum.ts
│   │       └── timeline-entry-type.enum.ts
│
├── application/
│   ├── lead/
│   │   ├── commands/
│   │   │   ├── create-lead/
│   │   │   │   ├── create-lead.command.ts
│   │   │   │   └── create-lead.handler.ts
│   │   │   ├── update-lead/
│   │   │   │   ├── update-lead.command.ts
│   │   │   │   └── update-lead.handler.ts
│   │   │   ├── delete-lead/
│   │   │   │   ├── delete-lead.command.ts
│   │   │   │   └── delete-lead.handler.ts
│   │   │   ├── qualify-lead/
│   │   │   │   ├── qualify-lead.command.ts
│   │   │   │   └── qualify-lead.handler.ts
│   │   │   ├── disqualify-lead/
│   │   │   │   ├── disqualify-lead.command.ts
│   │   │   │   └── disqualify-lead.handler.ts
│   │   │   ├── convert-lead/
│   │   │   │   ├── convert-lead.command.ts
│   │   │   │   └── convert-lead.handler.ts
│   │   │   ├── assign-lead-owner/
│   │   │   │   ├── assign-lead-owner.command.ts
│   │   │   │   └── assign-lead-owner.handler.ts
│   │   │   └── merge-leads/
│   │   │       ├── merge-leads.command.ts
│   │   │       └── merge-leads.handler.ts
│   │   ├── queries/
│   │   │   ├── get-lead/
│   │   │   │   ├── get-lead.query.ts
│   │   │   │   └── get-lead.handler.ts
│   │   │   ├── list-leads/
│   │   │   │   ├── list-leads.query.ts
│   │   │   │   └── list-leads.handler.ts
│   │   │   └── get-lead-timeline/
│   │   │       ├── get-lead-timeline.query.ts
│   │   │       └── get-lead-timeline.handler.ts
│   │   └── dto/
│   │       ├── lead-response.dto.ts
│   │       ├── lead-detail-response.dto.ts
│   │       ├── create-lead.dto.ts
│   │       ├── update-lead.dto.ts
│   │       ├── lead-filter.dto.ts
│   │       ├── qualify-lead.dto.ts
│   │       ├── disqualify-lead.dto.ts
│   │       ├── convert-lead.dto.ts
│   │       ├── assign-owner.dto.ts
│   │       ├── merge-leads.dto.ts
│   │       └── batch-create-leads.dto.ts
│   │
│   ├── customer/
│   │   ├── commands/
│   │   │   ├── create-customer/
│   │   │   ├── update-customer/
│   │   │   ├── delete-customer/
│   │   │   ├── change-customer-tier/
│   │   │   └── assign-customer-owner/
│   │   ├── queries/
│   │   │   ├── get-customer/
│   │   │   ├── list-customers/
│   │   │   └── get-customer-timeline/
│   │   └── dto/
│   │
│   ├── pipeline/
│   │   ├── commands/
│   │   │   ├── create-pipeline/
│   │   │   ├── update-pipeline/
│   │   │   └── delete-pipeline/
│   │   ├── queries/
│   │   │   ├── get-pipeline/
│   │   │   └── list-pipelines/
│   │   └── dto/
│   │
│   ├── opportunity/
│   │   ├── commands/
│   │   │   ├── create-opportunity/
│   │   │   ├── update-opportunity/
│   │   │   ├── delete-opportunity/
│   │   │   ├── move-opportunity-stage/
│   │   │   ├── win-opportunity/
│   │   │   ├── lose-opportunity/
│   │   │   └── assign-opportunity-owner/
│   │   ├── queries/
│   │   │   ├── get-opportunity/
│   │   │   ├── list-opportunities/
│   │   │   ├── get-pipeline-kanban/
│   │   │   └── get-revenue-forecast/
│   │   └── dto/
│   │
│   ├── task/
│   │   ├── commands/
│   │   │   ├── create-task/
│   │   │   ├── update-task/
│   │   │   ├── complete-task/
│   │   │   ├── cancel-task/
│   │   │   └── delete-task/
│   │   ├── queries/
│   │   │   ├── get-task/
│   │   │   ├── list-tasks/
│   │   │   └── list-my-tasks/
│   │   └── dto/
│   │
│   ├── activity/
│   │   ├── commands/
│   │   │   └── create-activity/
│   │   └── queries/
│   │       ├── get-activity/
│   │       └── list-activities/
│   │
│   ├── timeline/
│   │   └── queries/
│   │       ├── get-lead-timeline/
│   │       ├── get-customer-timeline/
│   │       └── get-opportunity-timeline/
│   │
│   ├── dashboard/
│   │   └── queries/
│   │       ├── get-crm-summary/
│   │       ├── get-pipeline-kanban/
│   │       └── get-revenue-forecast/
│   │
│   └── common/
│       ├── interfaces/
│       │   ├── command.ts
│       │   ├── query.ts
│       │   └── handler.ts
│       ├── pagination.dto.ts
│       ├── batch-operation-response.dto.ts
│       └── crm.mapper.ts                 # Mapas de domínio → DTO
│
├── infrastructure/
│   ├── persistence/
│   │   ├── prisma/
│   │   │   ├── lead/
│   │   │   │   └── prisma-lead.repository.ts
│   │   │   ├── customer/
│   │   │   │   └── prisma-customer.repository.ts
│   │   │   ├── pipeline/
│   │   │   │   └── prisma-pipeline.repository.ts
│   │   │   ├── opportunity/
│   │   │   │   └── prisma-opportunity.repository.ts
│   │   │   ├── task/
│   │   │   │   └── prisma-task.repository.ts
│   │   │   ├── activity/
│   │   │   │   └── prisma-activity.repository.ts
│   │   │   └── timeline/
│   │   │       └── prisma-timeline-entry.repository.ts
│   │   └── mappers/
│   │       ├── lead.prisma-mapper.ts
│   │       ├── customer.prisma-mapper.ts
│   │       ├── pipeline.prisma-mapper.ts
│   │       ├── opportunity.prisma-mapper.ts
│   │       ├── task.prisma-mapper.ts
│   │       ├── activity.prisma-mapper.ts
│   │       └── timeline-entry.prisma-mapper.ts
│   │
│   ├── controllers/
│   │   ├── leads.controller.ts
│   │   ├── customers.controller.ts
│   │   ├── pipelines.controller.ts
│   │   ├── opportunities.controller.ts
│   │   ├── tasks.controller.ts
│   │   ├── activities.controller.ts
│   │   ├── timeline.controller.ts
│   │   └── crm-dashboard.controller.ts
│   │
│   ├── event-publishers/
│   │   ├── lead-event.publisher.ts
│   │   ├── customer-event.publisher.ts
│   │   ├── opportunity-event.publisher.ts
│   │   └── task-event.publisher.ts
│   │
│   ├── event-consumers/
│   │   ├── lead-scoring.consumer.ts       # Consome PredictionCompleted da IA
│   │   └── opportunity-rfp.consumer.ts    # Publica para Bidding
│   │
│   └── guards/
│       ├── crm-permission.guard.ts
│       └── crm-owner-or-admin.guard.ts
│
├── crm.module.ts
└── index.ts
```

---

## 3. Domain Layer

### 3.1 Aggregate Roots

| Aggregate    | Raiz          | Entidades filhas       | Value Objects                              |
|-------------|---------------|------------------------|--------------------------------------------|
| **Lead**    | `LeadEntity`  | —                      | `LeadSource`, `LeadScore`, `LeadStatus`, `Email`, `Tag`, `ContactInfo` |
| **Customer**| `CustomerEntity` | —                  | `CustomerSegment`, `CustomerTier`, `ContactInfo`, `Address`, `TaxId`, `Money` |
| **Pipeline**| `PipelineEntity` | `PipelineStage`    | `PipelineStage` (array embutido)           |
| **Opportunity** | `OpportunityEntity` | —            | `OpportunityStage`, `OpportunityStatus`, `Probability`, `Money` |
| **Task**    | `TaskEntity`  | —                     | `TaskPriority`, `TaskStatus`, `Tag`        |
| **Activity**| — (entidade)  | —                     | `ActivityType`                             |
| **TimelineEntry** | — (entidade) | —               | `TimelineEntryType`                        |

### 3.2 Regras do Domain Layer

```
DOMAIN LAYER RULES:
├── Zero dependências externas (sem import de Prisma, NestJS, Express)
├── Todo aggregate root possui:
│   ├── id: unique identifier (UUID)
│   ├── tenantId: string (obrigatório)
│   ├── createdAt: Date
│   └── updatedAt: Date
├── Entities imutáveis (Activity, TimelineEntry) não possuem updatedAt
├── Value Objects são imutáveis e comparados por valor
├── Invariantes protegidos no construtor e métodos públicos
├── Domain Events são objetos simples (POJO) com tipo + payload
└── Repository Interfaces definem contratos de persistência
```

### 3.3 Exemplo de estrutura de Aggregate Root (sem código)

```
LeadEntity
├── Construtor privado (factory method create() + restore())
├── Atributos: id, tenantId, name, email, phone, company, status, score, source, tags, assignedTo, convertedToCustomerId, deletedAt, createdAt, updatedAt
├── Métodos públicos:
│   ├── qualify(score: LeadScore, qualifiedBy: UserId): void
│   │   ├── Valida: status == NEW ou CONTACTED
│   │   ├── Valida: score >= 0 e <= 100
│   │   ├── Ação: atualiza status para QUALIFIED
│   │   ├── Evento: new LeadQualifiedEvent(this.id, score)
│   │   └── Erro: LeadAlreadyQualifiedError se status já QUALIFIED
│   ├── disqualify(reason: string): void
│   │   ├── Valida: status != CONVERTED
│   │   ├── Ação: atualiza status para DISQUALIFIED
│   │   ├── Evento: new LeadDisqualifiedEvent(this.id, reason)
│   │   └── Erro: LeadAlreadyConvertedError se status CONVERTED
│   ├── convert(customerId: string): void
│   │   ├── Valida: status == QUALIFIED
│   │   ├── Ação: atualiza status para CONVERTED, vincula customerId
│   │   ├── Evento: new LeadConvertedEvent(this.id, customerId)
│   │   └── Erro: InvalidLeadStatusError se não QUALIFIED
│   ├── assignTo(userId: string): void
│   ├── updateScore(score: number): void
│   ├── addTag(tag: string): void
│   ├── removeTag(tag: string): void
│   └── softDelete(): void
├── Getters públicos (sem setters — imutabilidade externa)
└── Método toPersistence(): PrismaLeadData (usado pelo mapper)
```

### 3.4 Value Objects

```
LeadSource (imutável)
├── channel: 'WEBSITE' | 'LANDING_PAGE' | 'REFERRAL' | 'IMPORT' | 'API' | 'SOCIAL_MEDIA' | 'EVENT' | 'INDICATION' | 'MANUAL'
├── campaign: string (opcional)
└── referrer: string (opcional)

LeadScore (imutável)
├── value: number (0-100)
├── criteria: { profileFit: number, engagement: number, budget: number, timing: number }
└── Valida: value entre 0 e 100

PipelineStage (imutável)
├── id: string
├── name: string
├── order: number (>= 1)
├── probability: number (0-100)
└── color: string (hex, opcional)

Probability (imutável)
└── value: number (0-100)
└── Valida: value entre 0 e 100
```

### 3.5 Domain Events

```
LeadCapturedEvent
├── eventId: string (UUID)
├── aggregateId: string (leadId)
├── tenantId: string
├── occurredAt: Date
├── type: 'com.bidflow.crm.lead.captured.v1'
└── data: { name, email, company, source, score }

LeadQualifiedEvent
├── eventId, aggregateId, tenantId, occurredAt
├── type: 'com.bidflow.crm.lead.qualified.v1'
└── data: { leadId, score, qualifiedAt, assignedTo }

LeadConvertedEvent
├── eventId, aggregateId, tenantId, occurredAt
├── type: 'com.bidflow.crm.lead.converted.v1'
└── data: { leadId, customerId, customerName, taxId, tier }

LeadDisqualifiedEvent
├── eventId, aggregateId, tenantId, occurredAt
├── type: 'com.bidflow.crm.lead.disqualified.v1'
└── data: { leadId, reason }

OpportunityCreatedEvent
├── eventId, aggregateId, tenantId, occurredAt
├── type: 'com.bidflow.crm.opportunity.created.v1'
└── data: { opportunityId, customerId, title, estimatedValue, stage, probability }

OpportunityStageChangedEvent
├── eventId, aggregateId, tenantId, occurredAt
├── type: 'com.bidflow.crm.opportunity.stage_changed.v1'
└── data: { opportunityId, fromStage, toStage, changedBy }

OpportunityWonEvent
├── eventId, aggregateId, tenantId, occurredAt
├── type: 'com.bidflow.crm.opportunity.won.v1'
└── data: { opportunityId, customerId, wonValue, products, closeDate }

OpportunityLostEvent
├── eventId, aggregateId, tenantId, occurredAt
├── type: 'com.bidflow.crm.opportunity.lost.v1'
└── data: { opportunityId, customerId, estimatedValue, lostReason, lostTo }

CustomerTierChangedEvent
├── eventId, aggregateId, tenantId, occurredAt
├── type: 'com.bidflow.crm.customer.tier_changed.v1'
└── data: { customerId, oldTier, newTier, reason, changedBy }

TaskCompletedEvent
├── eventId, aggregateId, tenantId, occurredAt
├── type: 'com.bidflow.crm.task.completed.v1'
└── data: { taskId, title, completedBy, leadId?, customerId?, opportunityId? }
```

### 3.6 Domain Errors

```
DomainError (abstract)
├── code: string
├── message: string
└── statusCode: number

LeadNotFoundError        → code: LEAD_NOT_FOUND,        status: 404
CustomerNotFoundError    → code: CUSTOMER_NOT_FOUND,    status: 404
OpportunityNotFoundError → code: OPPORTUNITY_NOT_FOUND, status: 404
PipelineNotFoundError    → code: PIPELINE_NOT_FOUND,    status: 404
TaskNotFoundError        → code: TASK_NOT_FOUND,        status: 404
ActivityNotFoundError    → code: ACTIVITY_NOT_FOUND,    status: 404
LeadAlreadyConvertedError  → code: LEAD_ALREADY_CONVERTED,  status: 422
InvalidLeadStatusError   → code: INVALID_LEAD_STATUS,      status: 422
InvalidStageTransitionError → code: INVALID_STAGE_TRANSITION, status: 422
OpportunityAlreadyWonError  → code: OPPORTUNITY_ALREADY_WON, status: 422
OpportunityAlreadyLostError → code: OPPORTUNITY_ALREADY_LOST, status: 422
TaskWithoutOwnerError     → code: TASK_WITHOUT_OWNER,       status: 422
InvalidScoreError         → code: INVALID_SCORE,            status: 422
DuplicateEmailError       → code: DUPLICATE_EMAIL,          status: 409
DuplicateTaxIdError       → code: DUPLICATE_TAXID,          status: 409
PipelineMinStagesError    → code: PIPELINE_MIN_STAGES,      status: 422
TimelineReadOnlyError     → code: TIMELINE_READONLY,        status: 403
```

---

## 4. Application Layer

### 4.1 CQRS Commands

| Aggregate    | Command                  | Handler                      | Eventos publicados              |
|-------------|--------------------------|------------------------------|---------------------------------|
| Lead        | `CreateLeadCommand`      | `CreateLeadHandler`          | `LeadCapturedEvent`             |
| Lead        | `UpdateLeadCommand`      | `UpdateLeadHandler`          | —                               |
| Lead        | `DeleteLeadCommand`      | `DeleteLeadHandler`          | —                               |
| Lead        | `QualifyLeadCommand`     | `QualifyLeadHandler`         | `LeadQualifiedEvent`            |
| Lead        | `DisqualifyLeadCommand`  | `DisqualifyLeadHandler`      | `LeadDisqualifiedEvent`         |
| Lead        | `ConvertLeadCommand`     | `ConvertLeadHandler`         | `LeadConvertedEvent`            |
| Lead        | `AssignLeadOwnerCommand` | `AssignLeadOwnerHandler`     | —                               |
| Lead        | `MergeLeadsCommand`      | `MergeLeadsHandler`          | —                               |
| Customer    | `CreateCustomerCommand`  | `CreateCustomerHandler`      | —                               |
| Customer    | `ChangeCustomerTierCommand` | `ChangeCustomerTierHandler` | `CustomerTierChangedEvent`   |
| Lead        | `DeleteCustomerCommand`  | `DeleteCustomerHandler`      | —                               |
| Pipeline    | `CreatePipelineCommand`  | `CreatePipelineHandler`      | —                               |
| Opportunity | `CreateOpportunityCommand` | `CreateOpportunityHandler` | `OpportunityCreatedEvent`      |
| Opportunity | `MoveOpportunityStageCommand` | `MoveOpportunityStageHandler` | `OpportunityStageChangedEvent` |
| Opportunity | `WinOpportunityCommand`  | `WinOpportunityHandler`      | `OpportunityWonEvent`           |
| Opportunity | `LoseOpportunityCommand` | `LoseOpportunityHandler`     | `OpportunityLostEvent`          |
| Task        | `CreateTaskCommand`      | `CreateTaskHandler`          | —                               |
| Task        | `CompleteTaskCommand`    | `CompleteTaskHandler`        | `TaskCompletedEvent`            |
| Task        | `CancelTaskCommand`      | `CancelTaskHandler`          | —                               |
| Activity    | `CreateActivityCommand`  | `CreateActivityHandler`      | —                               |

### 4.2 CQRS Queries

| Query                          | Handler                       | Uso                                |
|--------------------------------|-------------------------------|------------------------------------|
| `GetLeadQuery`                 | `GetLeadHandler`              | Detalhe do lead                    |
| `ListLeadsQuery`               | `ListLeadsHandler`            | Lista paginada com filtros         |
| `GetLeadTimelineQuery`         | `GetLeadTimelineHandler`      | Timeline do lead                   |
| `GetCustomerQuery`             | `GetCustomerHandler`          | Detalhe do cliente                 |
| `ListCustomersQuery`           | `ListCustomersHandler`        | Lista paginada com filtros         |
| `GetCustomerTimelineQuery`     | `GetCustomerTimelineHandler`  | Timeline do cliente                |
| `GetPipelineQuery`             | `GetPipelineHandler`          | Pipeline com estágios              |
| `ListPipelinesQuery`           | `ListPipelinesHandler`        | Todos os pipelines do tenant       |
| `GetOpportunityQuery`          | `GetOpportunityHandler`       | Detalhe da oportunidade            |
| `ListOpportunitiesQuery`       | `ListOpportunitiesHandler`    | Lista paginada com filtros         |
| `GetOpportunityTimelineQuery`  | `GetOpportunityTimelineHandler` | Timeline da oportunidade         |
| `GetPipelineKanbanQuery`       | `GetPipelineKanbanHandler`    | Ops agrupadas por estágio          |
| `GetRevenueForecastQuery`      | `GetRevenueForecastHandler`   | Previsão de receita                |
| `GetCrmSummaryQuery`           | `GetCrmSummaryHandler`        | Métricas do dashboard              |
| `GetTaskQuery`                 | `GetTaskHandler`              | Detalhe da tarefa                  |
| `ListTasksQuery`               | `ListTasksHandler`            | Lista paginada com filtros         |
| `ListMyTasksQuery`             | `ListMyTasksHandler`          | Tarefas do usuário autenticado     |

### 4.3 Estrutura de Command/Handler (sem código)

```
CreateLeadCommand
├── tenantId: string (extraído do JWT pelo guard)
├── name: string
├── email: string
├── phone: string (opcional)
├── company: string (opcional)
├── source: LeadSource
├── tags: string[] (opcional)
└── assignedTo: string (opcional)

CreateLeadHandler
├── Dependências (injetadas via constructor):
│   ├── LeadRepository (port do domínio)
│   ├── TimelineEntryRepository (port do domínio)
│   ├── EventPublisher (infrastructure)
│   └── TenantContext (request-scoped)
├── execute(command: CreateLeadCommand): Promise<LeadResponseDto>
│   ├── 1. Validar email único (via repositório)
│   ├── 2. Criar LeadEntity via factory method (LeadEntity.create())
│   ├── 3. Salvar no repositório
│   ├── 4. Criar TimelineEntry (SYSTEM_EVENT)
│   ├── 5. Publicar LeadCapturedEvent
│   ├── 6. Mapear LeadEntity → LeadResponseDto
│   └── 7. Retornar DTO
```

### 4.4 Application Services (Domain Services na camada Application)

```
LeadConversionService
├── Responsabilidade: Orquestrar conversão completa de lead em cliente
├── Método: convert(leadId, convertLeadDto): Promise<ConvertLeadResponseDto>
│   ├── 1. Buscar LeadEntity (via repositório)
│   ├── 2. Validar que lead pode ser convertido (lead.qualify())
│   ├── 3. Criar CustomerEntity (factory)
│   ├── 4. Salvar CustomerEntity (via repositório de customer)
│   ├── 5. LeadEntity.convert(newCustomer.id)
│   ├── 6. Salvar LeadEntity
│   ├── 7. Criar TimelineEntry em ambos (lead + customer)
│   ├── 8. Publicar LeadConvertedEvent
│   └── 9. Retornar resposta com IDs de lead e customer

OpportunityStageService
├── Responsabilidade: Validar e executar movimentação entre estágios
├── Método: move(opportunityId, targetStage): Promise<OpportunityResponseDto>
│   ├── 1. Buscar OpportunityEntity
│   ├── 2. Buscar PipelineEntity (para validar estágios)
│   ├── 3. OpportunityEntity.moveStage(targetStage)
│   ├── 4. Salvar
│   ├── 5. Criar TimelineEntry (STAGE_CHANGED)
│   ├── 6. Publicar OpportunityStageChangedEvent
│   └── 7. Retornar DTO
```

---

## 5. Infrastructure Layer

### 5.1 Controllers

```
LeadsController
├── POST /api/v1/crm/leads → @Body CreateLeadDto
├── POST /api/v1/crm/leads/batch → @Body BatchCreateLeadsDto
├── GET /api/v1/crm/leads → @Query LeadFilterDto
├── GET /api/v1/crm/leads/:id
├── PATCH /api/v1/crm/leads/:id → @Body UpdateLeadDto
├── DELETE /api/v1/crm/leads/:id
├── POST /api/v1/crm/leads/:id/qualify → @Body QualifyLeadDto
├── POST /api/v1/crm/leads/:id/disqualify → @Body DisqualifyLeadDto
├── POST /api/v1/crm/leads/:id/convert → @Body ConvertLeadDto
├── POST /api/v1/crm/leads/:id/assign → @Body AssignOwnerDto
└── POST /api/v1/crm/leads/:id/merge → @Body MergeLeadsDto

CustomersController
├── POST /api/v1/crm/customers
├── GET /api/v1/crm/customers
├── GET /api/v1/crm/customers/:id
├── PATCH /api/v1/crm/customers/:id
├── DELETE /api/v1/crm/customers/:id
├── POST /api/v1/crm/customers/:id/change-tier → @Body ChangeTierDto
└── POST /api/v1/crm/customers/:id/assign → @Body AssignOwnerDto

PipelinesController
├── POST /api/v1/crm/pipelines
├── GET /api/v1/crm/pipelines
├── GET /api/v1/crm/pipelines/:id
├── PATCH /api/v1/crm/pipelines/:id
└── DELETE /api/v1/crm/pipelines/:id

OpportunitiesController
├── POST /api/v1/crm/opportunities
├── GET /api/v1/crm/opportunities
├── GET /api/v1/crm/opportunities/:id
├── PATCH /api/v1/crm/opportunities/:id
├── POST /api/v1/crm/opportunities/:id/move-stage → @Body MoveStageDto
├── POST /api/v1/crm/opportunities/:id/win → @Body WinOpportunityDto
├── POST /api/v1/crm/opportunities/:id/lose → @Body LoseOpportunityDto
├── POST /api/v1/crm/opportunities/:id/assign → @Body AssignOwnerDto
└── DELETE /api/v1/crm/opportunities/:id

TasksController
├── POST /api/v1/crm/tasks
├── GET /api/v1/crm/tasks
├── GET /api/v1/crm/tasks/my
├── GET /api/v1/crm/tasks/:id
├── PATCH /api/v1/crm/tasks/:id
├── POST /api/v1/crm/tasks/:id/complete
├── POST /api/v1/crm/tasks/:id/cancel → @Body CancelTaskDto
└── DELETE /api/v1/crm/tasks/:id

ActivitiesController
├── POST /api/v1/crm/activities
├── GET /api/v1/crm/activities
└── GET /api/v1/crm/activities/:id

TimelineController
├── GET /api/v1/crm/timeline/lead/:leadId
├── GET /api/v1/crm/timeline/customer/:customerId
└── GET /api/v1/crm/timeline/opportunity/:opportunityId

CrmDashboardController
├── GET /api/v1/crm/dashboard/summary
├── GET /api/v1/crm/dashboard/pipeline/:pipelineId
└── GET /api/v1/crm/dashboard/forecast
```

### 5.2 Repository Implementations (Prisma)

```
PrismaLeadRepository (implements LeadRepository)
├── save(lead: LeadEntity): Promise<void>
│   ├── Mapear LeadEntity → PrismaLeadData (via LeadPrismaMapper)
│   ├── prisma.lead.upsert({ where: { id }, create, update })
│   └── Publicar domain events (se houver)
│
├── findById(id: string): Promise<LeadEntity | null>
│   ├── prisma.lead.findUnique({ where: { id } })
│   └── Se found: LeadPrismaMapper.toDomain(record)
│
├── findMany(filter: LeadFilter): Promise<LeadEntity[]>
│   ├── prisma.lead.findMany({ where: buildWhere(filter), orderBy, skip, take })
│   └── Mapear cada record
│
├── count(filter: LeadFilter): Promise<number>
│
├── findByEmail(email: string): Promise<LeadEntity | null>
│
├── softDelete(id: string): Promise<void>
│   └── prisma.lead.update({ where: { id }, data: { deletedAt: now() } })
│
└── findDuplicates(criteria: object): Promise<LeadEntity[]>
```

### 5.3 Prisma Mappers

Cada mapper tem duas direções:

```
LeadPrismaMapper
├── toDomain(prismaRecord: PrismaLead): LeadEntity
│   ├── Extrair dados do Prisma record
│   ├── Instanciar Value Objects
│   └── LeadEntity.restore({ ... })  (factory method para reconstituição)
│
└── toPersistence(domainEntity: LeadEntity): PrismaLeadCreateInput
    ├── Extrair dados da entidade
    ├── Serializar Value Objects
    └── Retornar objeto compatível com Prisma create/update
```

### 5.4 Event Publishers

```
LeadEventPublisher
├── publishLeadCaptured(event: LeadCapturedEvent): Promise<void>
│   └── amqp.publish('bidflow.domain', routingKey, cloudEvent)
├── publishLeadQualified(event: LeadQualifiedEvent): Promise<void>
├── publishLeadConverted(event: LeadConvertedEvent): Promise<void>
└── publishLeadDisqualified(event: LeadDisqualifiedEvent): Promise<void>

OpportunityEventPublisher
├── publishOpportunityCreated(event: OpportunityCreatedEvent): Promise<void>
├── publishOpportunityStageChanged(event: OpportunityStageChangedEvent): Promise<void>
├── publishOpportunityWon(event: OpportunityWonEvent): Promise<void>
└── publishOpportunityLost(event: OpportunityLostEvent): Promise<void>
```

### 5.5 Event Consumers

```
LeadScoringConsumer
├── Consome: com.bidflow.ai.prediction.completed.v1
├── Handler: onPredictionCompleted(prediction)
│   ├── Verificar se é predição de lead score
│   ├── Buscar LeadEntity
│   ├── lead.updateScore(prediction.output.score)
│   └── Salvar lead

OpportunityRfpConsumer
├── Consome: com.bidflow.bidding.contract.awarded.v1
├── Handler: onContractAwarded(contract)
│   ├── Buscar OpportunityEntity vinculada
│   ├── opportunity.win(contract.value)
│   └── Salvar + publicar eventos
```

---

## 6. Modules (NestJS)

### 6.1 Estrutura do Módulo Raiz

```
crm.module.ts
├── imports: [CqrsModule, PrismaModule, RabbitMQModule]
├── controllers: [
│     LeadsController,
│     CustomersController,
│     PipelinesController,
│     OpportunitiesController,
│     TasksController,
│     ActivitiesController,
│     TimelineController,
│     CrmDashboardController
│   ]
├── providers: [
│     // Repositories (Ports → Adapters)
│     { provide: LeadRepository, useClass: PrismaLeadRepository },
│     { provide: CustomerRepository, useClass: PrismaCustomerRepository },
│     { provide: PipelineRepository, useClass: PrismaPipelineRepository },
│     { provide: OpportunityRepository, useClass: PrismaOpportunityRepository },
│     { provide: TaskRepository, useClass: PrismaTaskRepository },
│     { provide: ActivityRepository, useClass: PrismaActivityRepository },
│     { provide: TimelineEntryRepository, useClass: PrismaTimelineEntryRepository },
│
│     // Command Handlers
│     CreateLeadHandler,
│     UpdateLeadHandler,
│     DeleteLeadHandler,
│     QualifyLeadHandler,
│     DisqualifyLeadHandler,
│     ConvertLeadHandler,
│     AssignLeadOwnerHandler,
│     MergeLeadsHandler,
│     CreateCustomerHandler,
│     UpdateCustomerHandler,
│     DeleteCustomerHandler,
│     ChangeCustomerTierHandler,
│     AssignCustomerOwnerHandler,
│     CreatePipelineHandler,
│     UpdatePipelineHandler,
│     DeletePipelineHandler,
│     CreateOpportunityHandler,
│     UpdateOpportunityHandler,
│     DeleteOpportunityHandler,
│     MoveOpportunityStageHandler,
│     WinOpportunityHandler,
│     LoseOpportunityHandler,
│     AssignOpportunityOwnerHandler,
│     CreateTaskHandler,
│     UpdateTaskHandler,
│     CompleteTaskHandler,
│     CancelTaskHandler,
│     DeleteTaskHandler,
│     CreateActivityHandler,
│
│     // Query Handlers
│     GetLeadHandler,
│     ListLeadsHandler,
│     GetLeadTimelineHandler,
│     GetCustomerHandler,
│     ListCustomersHandler,
│     GetCustomerTimelineHandler,
│     GetPipelineHandler,
│     ListPipelinesHandler,
│     GetOpportunityHandler,
│     ListOpportunitiesHandler,
│     GetOpportunityTimelineHandler,
│     GetPipelineKanbanHandler,
│     GetRevenueForecastHandler,
│     GetCrmSummaryHandler,
│     GetTaskHandler,
│     ListTasksHandler,
│     ListMyTasksHandler,
│     ListActivitiesHandler,
│     GetActivityHandler,
│
│     // Event Publishers
│     LeadEventPublisher,
│     OpportunityEventPublisher,
│     CustomerEventPublisher,
│     TaskEventPublisher,
│
│     // Event Consumers
│     LeadScoringConsumer,
│     OpportunityRfpConsumer,
│
│     // Application Services
│     LeadConversionService,
│     OpportunityStageService
│   ]
└── exports: []
```

### 6.2 Pontos de Extensão

Para adicionar um novo aggregate no CRM:

```
1. domain/<aggregate>/<aggregate>.entity.ts         → Entidade + invariantes
2. domain/<aggregate>/<aggregate>.repository.ts      → Interface (port)
3. domain/<aggregate>/value-objects/                 → Value Objects
4. domain/<aggregate>/events/                        → Domain Events
5. domain/common/errors/<error>.ts                   → Domain Errors
6. application/<aggregate>/commands/<command>/       → Command + Handler
7. application/<aggregate>/queries/<query>/          → Query + Handler
8. application/<aggregate>/dto/                      → DTOs
9. infrastructure/persistence/prisma/<aggregate>/    → Prisma Repository
10. infrastructure/persistence/mappers/              → Prisma Mapper
11. infrastructure/controllers/                      → Controller REST
12. crm.module.ts                                    → Registrar providers
```

---

## 7. Repositories

### 7.1 Interface (Port) — Domain Layer

```
LeadRepository (interface)
├── save(lead: LeadEntity): Promise<void>
├── findById(id: string): Promise<LeadEntity | null>
├── findMany(filter: LeadFilter): Promise<LeadEntity[]>
├── count(filter: LeadFilter): Promise<number>
├── findByEmail(email: string, tenantId: string): Promise<LeadEntity | null>
├── softDelete(id: string): Promise<void>
└── findDuplicates(tenantId: string, criteria: object): Promise<LeadEntity[]>

CustomerRepository (interface)
├── save(customer: CustomerEntity): Promise<void>
├── findById(id: string): Promise<CustomerEntity | null>
├── findMany(filter: CustomerFilter): Promise<CustomerEntity[]>
├── count(filter: CustomerFilter): Promise<number>
├── findByTaxId(taxId: string, tenantId: string): Promise<CustomerEntity | null>
├── softDelete(id: string): Promise<void>
└── findByLeadId(leadId: string): Promise<CustomerEntity | null>

PipelineRepository (interface)
├── save(pipeline: PipelineEntity): Promise<void>
├── findById(id: string): Promise<PipelineEntity | null>
├── findMany(tenantId: string): Promise<PipelineEntity[]>
├── findDefault(tenantId: string): Promise<PipelineEntity | null>
└── delete(id: string): Promise<void>

OpportunityRepository (interface)
├── save(opportunity: OpportunityEntity): Promise<void>
├── findById(id: string): Promise<OpportunityEntity | null>
├── findMany(filter: OpportunityFilter): Promise<OpportunityEntity[]>
├── count(filter: OpportunityFilter): Promise<number>
├── findByCustomer(customerId: string): Promise<OpportunityEntity[]>
├── findWonByCustomer(customerId: string): Promise<OpportunityEntity[]>
├── softDelete(id: string): Promise<void>
└── groupByStage(pipelineId: string): Promise<StageGroup[]>

TaskRepository (interface)
├── save(task: TaskEntity): Promise<void>
├── findById(id: string): Promise<TaskEntity | null>
├── findMany(filter: TaskFilter): Promise<TaskEntity[]>
├── count(filter: TaskFilter): Promise<number>
└── softDelete(id: string): Promise<void>

ActivityRepository (interface)
├── save(activity: ActivityEntity): Promise<void>
├── findById(id: string): Promise<ActivityEntity | null>
├── findMany(filter: ActivityFilter): Promise<ActivityEntity[]>
└── count(filter: ActivityFilter): Promise<number>

TimelineEntryRepository (interface)
├── save(entry: TimelineEntryEntity): Promise<void>
├── findByLead(leadId: string, pagination): Promise<TimelineEntryEntity[]>
├── findByCustomer(customerId: string, pagination): Promise<TimelineEntryEntity[]>
├── findByOpportunity(opportunityId: string, pagination): Promise<TimelineEntryEntity[]>
└── createMany(entries: TimelineEntryEntity[]): Promise<void>
```

### 7.2 Filtros (Value Objects para queries)

```
LeadFilter
├── tenantId: string (obrigatório — do contexto)
├── status: LeadStatus[] (opcional)
├── source: LeadSource[] (opcional)
├── scoreMin: number (opcional)
├── scoreMax: number (opcional)
├── assignedTo: string (opcional)
├── tags: string[] (opcional)
├── search: string (opcional — busca em name + email + company)
├── createdAtFrom: Date (opcional)
├── createdAtTo: Date (opcional)
├── page: number (default: 1)
├── limit: number (default: 50)
└── sort: 'createdAt_desc' | 'createdAt_asc' | 'score_desc' | 'name_asc'

OpportunityFilter
├── tenantId: string
├── status: OpportunityStatus[]
├── pipelineId: string
├── stage: string
├── customerId: string
├── leadId: string
├── assignedTo: string
├── tags: string[]
├── estimatedValueMin: number
├── expectedCloseDateFrom: Date
├── expectedCloseDateTo: Date
├── page, limit, sort
```

---

## 8. DTOs & Contracts

### 8.1 Padrão de DTOs

```
Leads:
├── CreateLeadDto         → @IsString, @IsEmail, @IsOptional, @IsEnum (Validated by class-validator)
├── UpdateLeadDto         → PartialType(CreateLeadDto)
├── LeadFilterDto         → @IsOptional para cada campo de filtro + @Type para transform
├── LeadResponseDto       → @ApiProperty para cada campo (response)
├── LeadDetailResponseDto → extends LeadResponseDto + timeline preview, activities count
├── QualifyLeadDto        → score: number + criteria: object
├── DisqualifyLeadDto     → reason: string
├── ConvertLeadDto        → legalName, taxId, segment, tier
├── ConvertLeadResponseDto → customerId, customerName, tier, leadId
├── AssignOwnerDto        → assignedTo: string (UUID)
├── MergeLeadsDto         → sourceLeadId: string, targetLeadId: string
└── BatchCreateLeadsDto  → leads: CreateLeadDto[]

Customers:
├── CreateCustomerDto     → legalName, taxId, email, segment, tier, contacts, address
├── UpdateCustomerDto     → PartialType(CreateCustomerDto)
├── CustomerFilterDto     → status, segment, tier, assignedTo, tags, search
├── CustomerResponseDto   → id, legalName, taxId, email, segment, tier, status
├── CustomerDetailResponseDto → + contacts, address, totalRevenue, wonOpportunities, lastActivityAt
└── ChangeTierDto         → newTier: CustomerTier, reason: string

Pipelines:
├── CreatePipelineDto     → name, slug, description, stages[], isDefault
├── UpdatePipelineDto     → PartialType(CreatePipelineDto)
├── PipelineResponseDto   → id, name, slug, stages[], isDefault, isActive
└── PipelineDetailResponseDto → + opportunities count per stage

Opportunities:
├── CreateOpportunityDto     → customerId, pipelineId, title, estimatedValue, stage, expectedCloseDate, products
├── UpdateOpportunityDto     → PartialType(CreateOpportunityDto)
├── OpportunityFilterDto     → status, pipelineId, stage, customerId, assignedTo, estimatedValueMin, expectedCloseDateFrom/To
├── OpportunityResponseDto   → id, title, status, stage, probability, estimatedValue, expectedCloseDate
├── OpportunityDetailResponseDto → + customer, pipeline, products, tags, timeline preview
├── MoveStageDto             → toStage: string, reason: string (opcional)
├── WinOpportunityDto        → wonValue: number, actualCloseDate: date, products
└── LoseOpportunityDto       → lostReason: string, lostDetails: string, lostTo: string

Tasks:
├── CreateTaskDto    → title, description, priority, dueDate, assignedTo, leadId?, customerId?, opportunityId?, tags
├── UpdateTaskDto    → PartialType(CreateTaskDto)
├── TaskFilterDto     → status, priority, assignedTo, leadId, customerId, opportunityId, dueDateFrom/To, tags
├── TaskResponseDto   → id, title, status, priority, dueDate, assignedTo, leadId?, customerId?, opportunityId?
├── CancelTaskDto     → cancelledReason: string

Activities:
├── CreateActivityDto → type, subject, description, leadId?, customerId?, opportunityId?, occurredAt, duration, outcome, metadata
├── ActivityFilterDto → leadId?, customerId?, opportunityId?, type, createdBy, dateFrom, dateTo
└── ActivityResponseDto → id, type, subject, description, occurredAt, createdBy, createdAt (READONLY)

Timeline:
└── TimelineEntryDto  → id, type, title, description, occurredAt, createdBy, metadata

Dashboard:
├── CrmSummaryDto         → totalLeads, leadsByStatus, totalCustomers, totalOpportunities, pipelineValue, wonValue, overdueTasks
├── PipelineKanbanDto     → stages[{ stage, opportunities[] }]
└── RevenueForecastDto    → currentMonth, nextMonth, quarter, expectedByStage
```

### 8.2 Validação (class-validator)

```
CreateLeadDto:
├── @IsString() name
├── @IsEmail() email
├── @IsOptional() @IsString() phone
├── @IsOptional() @IsString() company
├── @IsEnum(LeadSource) source
├── @IsOptional() @IsArray() @IsString({ each: true }) tags
└── @IsOptional() @IsUUID() assignedTo

MoveStageDto:
├── @IsString() toStage
└── @IsOptional() @IsString() reason

WinOpportunityDto:
├── @IsNumber() @Min(0.01) wonValue
├── @IsDateString() actualCloseDate
└── @IsOptional() @IsArray() products
```

### 8.3 Response Pattern (Padrão de resposta)

```
PaginatedResponse<T>:
├── data: T[]
├── total: number
├── page: number
├── limit: number
├── totalPages: number
└── hasNext: boolean

BatchOperationResponse:
├── totalProcessed: number
├── successCount: number
├── failureCount: number
└── errors: { index: number, error: string, item: object }[]
```

---

## 9. Eventos

### 9.1 Fluxo de publicação

```
                  ┌──────────────────────┐
                  │   Command Handler    │
                  │  (Application Layer) │
                  └──────────┬───────────┘
                             │ domainEvents[]
                             ▼
                  ┌──────────────────────┐
                  │   OutboxService      │
                  │  (Infrastructure)    │
                  └──────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                              ▼
   ┌──────────────────┐          ┌──────────────────┐
   │  event_store DB  │          │  RabbitMQ        │
   │  (idempotência)  │          │  bidflow.domain  │
   └──────────────────┘          └──────────────────┘
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                   ┌──────────────────┐     ┌──────────────────┐
                   │  LeadScoring     │     │  OpportunityRfp │
                   │  Consumer (IA)   │     │  Consumer (Bid) │
                   └──────────────────┘     └──────────────────┘
```

### 9.2 Eventos publicados pelo CRM

| Evento                    | Publisher            | Routing Key                         | Consumidores        |
|---------------------------|----------------------|-------------------------------------|---------------------|
| `LeadCaptured`            | `LeadEventPublisher` | `{tenant}.crm.lead.captured`        | IA (scoring)        |
| `LeadQualified`           | `LeadEventPublisher` | `{tenant}.crm.lead.qualified`       | ERP (supplier draft)|
| `LeadConverted`           | `LeadEventPublisher` | `{tenant}.crm.lead.converted`       | ERP + IA            |
| `LeadDisqualified`        | `LeadEventPublisher` | `{tenant}.crm.lead.disqualified`    | —                   |
| `OpportunityCreated`      | `OpportunityEventPublisher` | `{tenant}.crm.opportunity.created` | IA            |
| `OpportunityStageChanged` | `OpportunityEventPublisher` | `{tenant}.crm.opportunity.stage_changed` | IA     |
| `OpportunityWon`          | `OpportunityEventPublisher` | `{tenant}.crm.opportunity.won`    | Bidding + IA       |
| `OpportunityLost`         | `OpportunityEventPublisher` | `{tenant}.crm.opportunity.lost`   | IA                 |
| `CustomerTierChanged`     | `CustomerEventPublisher` | `{tenant}.crm.customer.tier_changed` | ERP + SaaS      |
| `TaskCompleted`           | `TaskEventPublisher` | `{tenant}.crm.task.completed`        | Timeline (interno) |

### 9.3 Eventos consumidos pelo CRM

| Evento                              | Tipo                                        | Consumer                | Ação                        |
|-------------------------------------|---------------------------------------------|-------------------------|-----------------------------|
| `PredictionCompleted` (lead score)  | `com.bidflow.ai.prediction.completed.v1`    | `LeadScoringConsumer`   | Atualizar score do lead     |
| `ContractAwarded` (para atualizar)  | `com.bidflow.bidding.contract.awarded.v1`   | `OpportunityRfpConsumer`| Marcar opportunity como won |

---

## 10. Services

### 10.1 Domain Services (no Domain Layer)

| Service                    | Responsabilidade                              |
|----------------------------|-----------------------------------------------|
| `LeadScoringService`       | Calcula score do lead com base em critérios   |
| `DuplicateDetectionService`| Encontra leads duplicados por email, phone    |
| `PipelineValidationService`| Valida transições de estágio e regras do pipeline |

### 10.2 Application Services (no Application Layer)

| Service                       | Responsabilidade                                           |
|-------------------------------|------------------------------------------------------------|
| `LeadConversionService`       | Orquestra lead → customer + supplier + eventos             |
| `OpportunityStageService`     | Move oportunidade entre estágios com validação do pipeline |
| `TimelineConsolidationService`| Gera entradas de timeline automaticamente                  |
| `CrmSummaryService`           | Calcula métricas do dashboard                              |
| `RevenueForecastService`      | Projeta receita com base no pipeline                       |
| `BatchImportService`          | Processa importação em lote de leads                       |
| `MergeLeadsService`           | Mescla leads duplicados preservando dados                  |

### 10.3 Infrastructure Services (no Infrastructure Layer)

| Service                        | Responsabilidade                            |
|--------------------------------|---------------------------------------------|
| `PrismaTenantSchemaProvider`   | Fornece PrismaClient por schema de tenant   |
| `CrmEventPublisher`            | Publica eventos no RabbitMQ                 |
| `CrmAuditService`             | Registra audit logs no banco                |
| `CrmCacheService`             | Gerencia cache Redis das queries de CRM     |

---

## 11. Handlers (CQRS)

### 11.1 Estrutura de um Handler

```
CreateLeadHandler implements ICommandHandler<CreateLeadCommand>
├── constructor(
│     @Inject(LeadRepository) private readonly leadRepo: LeadRepository,
│     @Inject(TimelineEntryRepository) private readonly timelineRepo: TimelineEntryRepository,
│     private readonly eventPublisher: LeadEventPublisher,
│     @Inject(CurrentTenant) private readonly tenant: TenantContext
│   )
│
├── execute(command: CreateLeadCommand): Promise<LeadResponseDto>
│
│   Passos:
│   1. tenantId ← this.tenant.tenantId
│   2. Verificar duplicidade:
│      const existing = await this.leadRepo.findByEmail(command.email, tenantId)
│      if (existing) throw new DuplicateEmailError(command.email)
│   3. Criar entidade de domínio:
│      const lead = LeadEntity.create({
│        tenantId,
│        name: command.name,
│        email: command.email,
│        source: command.source,
│        ...
│      })
│   4. Salvar:
│      await this.leadRepo.save(lead)
│   5. Criar entrada de timeline:
│      const timelineEntry = TimelineEntryEntity.create({
│        leadId: lead.id,
│        type: TimelineEntryType.SYSTEM_EVENT,
│        title: 'Lead capturado',
│        ...
│      })
│      await this.timelineRepo.save(timelineEntry)
│   6. Publicar evento:
│      const event = new LeadCapturedEvent({ ...lead })
│      await this.eventPublisher.publishLeadCaptured(event)
│   7. Mapear e retornar:
│      return LeadMapper.toResponseDto(lead)
│
├── Observações:
│   ● Nenhum acesso direto ao Prisma (via repositório)
│   ● Nenhuma lógica de negócio fora da entidade
│   ● Timeline consolidada no handler (não no controller)
│   ● Eventos publicados após save
```

### 11.2 Agrupamento de Handlers no Module

```typescript
// Organização dos providers no módulo
const commandHandlers = [
  CreateLeadHandler,
  UpdateLeadHandler,
  DeleteLeadHandler,
  QualifyLeadHandler,
  DisqualifyLeadHandler,
  ConvertLeadHandler,
  AssignLeadOwnerHandler,
  MergeLeadsHandler,
  CreateCustomerHandler,
  UpdateCustomerHandler,
  DeleteCustomerHandler,
  ChangeCustomerTierHandler,
  AssignCustomerOwnerHandler,
  CreatePipelineHandler,
  UpdatePipelineHandler,
  DeletePipelineHandler,
  CreateOpportunityHandler,
  UpdateOpportunityHandler,
  DeleteOpportunityHandler,
  MoveOpportunityStageHandler,
  WinOpportunityHandler,
  LoseOpportunityHandler,
  AssignOpportunityOwnerHandler,
  CreateTaskHandler,
  UpdateTaskHandler,
  CompleteTaskHandler,
  CancelTaskHandler,
  DeleteTaskHandler,
  CreateActivityHandler,
];

const queryHandlers = [
  GetLeadHandler,
  ListLeadsHandler,
  GetLeadTimelineHandler,
  GetCustomerHandler,
  ListCustomersHandler,
  GetCustomerTimelineHandler,
  GetPipelineHandler,
  ListPipelinesHandler,
  GetOpportunityHandler,
  ListOpportunitiesHandler,
  GetOpportunityTimelineHandler,
  GetPipelineKanbanHandler,
  GetRevenueForecastHandler,
  GetCrmSummaryHandler,
  GetTaskHandler,
  ListTasksHandler,
  ListMyTasksHandler,
  ListActivitiesHandler,
  GetActivityHandler,
];
```

---

## 12. Multi-tenant Separation

### 12.1 Estratégia

```
TIPO: Schema-per-tenant (schema PostgreSQL dedicado por tenant)
COLUNA: tenantId em todas as tabelas (redundância para consultas)
RESOLUÇÃO: TenantResolutionMiddleware → CurrentTenant context
```

### 12.2 TenantResolutionMiddleware

```
Função:
├── 1. Extrair slug do Host header (subdomínio)
├── 2. Lookup na tabela 'tenants' (schema public)
├── 3. Resolver schemaName do tenant
├── 4. Retornar PrismaClient configurado com search_path = schemaName
└── 5. Injetar TenantContext na request

TenantContext (request-scoped):
├── tenantId: string
├── schemaName: string
└── userId: string (do JWT)
```

### 12.3 Aplicação nas Camadas

```
CONTROLLER:
├── @UseGuards(AuthGuard, TenantGuard, CrmPermissionGuard)
├── TenantGuard valida tenantId do JWT
└── Request carrega CurrentTenant

HANDLER:
├── @Inject(CurrentTenant) private tenant: TenantContext
├── tenant.tenantId usado em toda query de repositório

REPOSITORY:
├── PrismaClient configurado com schema do tenant
├── PrismaTenantSchemaProvider.getClient(tenantId) → PrismaClient
├── Cache prefixado: {tenantId}:crm:leads:{...}
└── Eventos routing key: {tenantId}.crm.{eventType}
```

### 12.4 Tenant Guard

```
CrmTenantGuard
├── Extrair tenantId do JWT
├── Buscar tenant na tabela global
├── Validar status do tenant (deve ser ACTIVE)
├── Injetar CurrentTenant na request
└── 403 se tenant não encontrado ou inativo
```

---

## 13. Cross-Cutting Concerns

### 13.1 Soft Delete

```
Todos os aggregates principais (Lead, Customer, Opportunity, Task):
├── Atributo: deletedAt: DateTime | null
├── findBy queries: filtrar WHERE deletedAt IS NULL
├── findById: permitir buscar deletados (admin)
├── delete(): setar deletedAt = now() (não remover)
└── Repositório expõe: includeDeleted?: boolean no filter
```

### 13.2 Audit Log

```
AuditLog (append-only no schema do tenant):
├── Criado automaticamente por interceptor global
├── Eventos: CREATE, UPDATE, DELETE, QUALIFY, CONVERT, WIN, LOSE
├── Payload: { action, entityType, entityId, before, after, performedBy, ipAddress }
└── Retenção: 365 dias (configurável)
```

### 13.3 Timeline Automática

```
Geração automática de TimelineEntry:
├── Lead: created, qualified, converted, disqualified, stage change
├── Customer: created, tier changed, opportunity won
├── Opportunity: created, stage changed, won, lost
├── Activity: toda atividade vira entrada na timeline
└── Task: task completed vira entrada na timeline
```

### 13.4 Cache

```
Redis cache strategy:
├── Chave: {tenantId}:crm:{entity}:{id}
├── TTL: 60s (leads), 60s (customers), 30s (kanban), 300s (forecast)
├── Invalidação: on update/delete do aggregate
└── Cache apenas para queries (nunca para commands)
```

### 13.5 Observabilidade

```
Logging:
├── Logger estruturado (JSON) com tenantId, userId, entityType, operation
└── Sensitive fields filtrados (email, phone, taxId)

Métricas (Prometheus):
├── bidflow_crm_leads_total{tenant, source, status}
├── bidflow_crm_opportunities_total{tenant, pipeline, status}
├── bidflow_crm_pipeline_value{tenant, pipeline}
└── bidflow_crm_tasks_overdue{tenant, priority}

Tracing (OpenTelemetry):
├── Span por handler (command ou query)
├── Atributos: tenant.id, crm.entity_type, crm.operation
└── Sampling: 0.5 (50% das requisições)

Alertas:
├── CrmHighConversionDrop: taxa de conversão < 10% em 7 dias
└── CrmManyOverdueTasks: mais de 50 tarefas em atraso
```

---

## 14. Pipeline de Requisição

### 14.1 Fluxo completo: POST /api/v1/crm/leads

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────┐
│ 1. Global Middleware                │
│    ├── RequestLoggerMiddleware      │
│    └── TenantResolutionMiddleware   │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 2. Guards                           │
│    ├── AuthGuard (JWT validation)   │
│    ├── TenantGuard (tenant status)  │
│    └── CrmPermissionGuard (RBAC)    │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 3. ValidationPipe (Global)          │
│    ├── whitelist: true              │
│    ├── forbidNonWhitelisted: true   │
│    └── transform: true              │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 4. LeadsController.create()        │
│    ├── @Body() createLeadDto       │
│    ├── @CurrentTenant() tenant     │
│    └── CommandBus.execute(cmd)     │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 5. CreateLeadHandler.execute()     │
│    ├── Validar duplicidade         │
│    ├── LeadEntity.create()         │
│    ├── leadRepo.save(lead)         │
│    ├── timelineRepo.save(entry)   │
│    ├── eventPublisher.publish()   │
│    └── LeadMapper.toDto(lead)     │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 6. AuditInterceptor                │
│    └── auditService.log('CREATE..) │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ 7. Response (201 Created)          │
│    └── LeadResponseDto (JSON)      │
└─────────────────────────────────────┘
```

### 14.2 Fluxo assíncrono (pós-response)

```
Command Handler
    │
    ▼ (eventos armazenados no outbox)
┌──────────────────────┐
│ OutboxService        │
│ ├── Salvar na tabela │
│ └── Publicar RabbitMQ│
└──────────┬───────────┘
           │
           ▼ (paralelo)
┌──────────────────────┐     ┌──────────────────────┐
│ LeadScoringConsumer  │     │ ERP Consumer         │
│ (IA - analytics)     │     │ (create supplier)    │
│ Atualiza score       │     │ Cria fornecedor      │
└──────────────────────┘     └──────────────────────┘
```

---

> **Revisão:** Este documento de arquitetura deve ser usado como guia para implementação do módulo CRM. A estrutura de pastas, módulos e camadas segue os princípios de Clean Architecture com DDD definidos em `docs/architecture-principles.md` e `docs/coding-standards.md`.
> 
> **Spec de referência:** `.specify/specs/crm/crm-module.yml`
> 
> **Próximos passos:** Implementação seguindo o AI Development Workflow definido em `docs/ai-development-workflow.md`, fase 3 (código).
