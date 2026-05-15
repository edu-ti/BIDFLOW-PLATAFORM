# Workflow Engine — Application Layer Enterprise

> **Application Layer** — Orquestração de casos de uso, commands, queries, handlers e serviços de aplicação. Depende apenas do Domain Layer.

---

## 1. Estrutura de Pastas (23 arquivos)

```
application/
├── index.ts                                              # Barrel export
├── common/
│   ├── interfaces/command.ts                             # Command + Query bases
│   ├── commands.ts                                       # 18 commands
│   ├── queries.ts                                        # 13 queries
│   ├── dto/
│   │   ├── index.ts                                      # 8 response DTOs
│   │   └── common.dto.ts                                 # PaginatedResponse<T>, BatchOperationResponse
│   └── services/
│       ├── definition-orchestration.service.ts           # Publishing + Stage + Transition orchestration
│       ├── instance-orchestration.service.ts             # Create + ExecuteTransition + Cancel + Reassign
│       └── approval-orchestration.service.ts             # Approve + Reject + Delegate
├── definition/commands/
│   ├── create-definition/create-definition.handler.ts
│   ├── update-definition/update-definition.handler.ts
│   ├── publish-definition/publish-definition.handler.ts
│   ├── create-version/create-version.handler.ts
│   └── delete-definition/delete-definition.handler.ts
├── definition/queries/
│   └── definition-queries.handler.ts                     # GetDefinition + ListDefinitions + ListStages + ListTransitions
├── stage/commands/
│   └── stage.handlers.ts                                 # CreateStage + UpdateStage + DeleteStage
├── transition/commands/
│   └── transition.handlers.ts                            # CreateTransition + DeleteTransition
├── instance/commands/
│   └── instance.handlers.ts                              # CreateInstance + ExecuteTransition + Cancel + Reassign
├── instance/queries/
│   └── instance-queries.handler.ts                       # GetInstance + ListInstances + GetTimeline
├── approval/commands/
│   └── approval.handlers.ts                              # Approve + Reject + Delegate + ListApprovals
├── task/commands/
│   └── task.handlers.ts                                  # CompleteTask + ListTasks + ListMyPending
└── dashboard/queries/
    └── dashboard-queries.handler.ts                      # GetSummary + GetMyPendingItems + GetOverdueInstances
```

---

## 2. Casos de Uso → Commands → Handlers

| Caso de Uso | Command | Handler | Eventos Publicados |
|------------|---------|---------|-------------------|
| **Criar definição** | `CreateDefinitionCommand` | `CreateDefinitionHandler` | `WorkflowDefinitionCreatedEvent` |
| **Publicar definição** | `PublishDefinitionCommand` | `PublishDefinitionHandler` | `WorkflowDefinitionPublishedEvent` |
| **Iniciar workflow** | `CreateInstanceCommand` | `CreateInstanceHandler` | `WorkflowStartedEvent` |
| **Transicionar estágio** | `ExecuteTransitionCommand` | `ExecuteTransitionHandler` | `StageChangedEvent`, `WorkflowCompletedEvent` (se final) |
| **Aprovar workflow** | `ApproveCommand` | `ApproveHandler` | `ApprovalGrantedEvent` |
| **Rejeitar workflow** | `RejectCommand` | `RejectHandler` | `ApprovalRejectedEvent` |
| **Delegar aprovação** | `DelegateApprovalCommand` | `DelegateApprovalHandler` | `ApprovalDelegatedEvent` |
| **Cancelar workflow** | `CancelInstanceCommand` | `CancelInstanceHandler` | `WorkflowInstanceCancelledEvent` |
| **Reatribuir** | `ReassignInstanceCommand` | `ReassignInstanceHandler` | — |
| **Concluir tarefa** | `CompleteTaskCommand` | `CompleteTaskHandler` | `TaskCompletedEvent` |

---

## 3. Queries → Handlers

| Query | Handler | Uso |
|-------|---------|-----|
| `GetDefinitionQuery` | `GetDefinitionHandler` | Detalhes da definição com stages + transitions |
| `ListDefinitionsQuery` | `ListDefinitionsHandler` | Lista paginada com filtros |
| `ListStagesQuery` | `ListStagesHandler` | Estágios de uma definição |
| `ListTransitionsQuery` | `ListTransitionsHandler` | Transições de uma definição |
| `GetInstanceQuery` | `GetInstanceHandler` | Instância com approvals + tasks |
| `ListInstancesQuery` | `ListInstancesHandler` | Lista paginada com 7 filtros |
| `GetInstanceTimelineQuery` | `GetInstanceTimelineHandler` | Timeline paginada |
| `ListApprovalsQuery` | `ListApprovalsHandler` | Approvals da instância |
| `ListTasksQuery` | `ListTasksHandler` | Tasks da instância |
| `ListMyPendingTasksQuery` | `ListMyPendingTasksHandler` | Tasks pendentes do usuário |
| `GetSummaryQuery` | `GetSummaryHandler` | Dashboard summary |
| `GetMyPendingItemsQuery` | `GetMyPendingItemsHandler` | Approvals + tasks do user |
| `GetOverdueInstancesQuery` | `GetOverdueInstancesHandler` | Instâncias com deadline vencido |

---

## 4. 3 Orchestration Services

### 4.1 InstanceOrchestrationService

```typescript
// Responsabilidade: Coordenar o ciclo de vida completo de uma instância

async createInstance(params: FactoryParams): Promise<WorkflowInstanceEntity>
  ├── 1. Verificar duplicidade (findByEntity)      → DuplicateWorkflowInstanceError
  ├── 2. Buscar definição                           → valida tenant + isActive
  ├── 3. Contar instâncias ativas                   → valida maxConcurrentInstances
  ├── 4. WorkflowInstanceFactory.create(params)      → instance + assignments + approvals + timeline
  ├── 5. Persistir tudo (instance + assignments + approvals + timeline)
  └── 6. Retornar instance criada

async executeTransition(instanceId, transitionSlug, userId, tenantId, comment?)
  ├── 1. Buscar instance                            → valida tenant
  ├── 2. Buscar definition                          → getStage + getTransition
  ├── 3. Buscar tasks + approvals                   → dados para validação
  ├── 4. TransitionValidator.validate()              → 5 pré-condições
  ├── 5. Criar TransitionLog                        → append-only
  ├── 6. instance.moveToStage()                     → atualiza estágio
  ├── 7. Se rejectionTarget: instance.reject()
  ├── 8. Se estágio FINAL: instance.complete()
  ├── 9. Criar WorkflowTimelineEntry                → TRANSITION_EXECUTED
  ├── 10. Persistir tudo (instance + log + timeline)
  └── 11. Publicar StageChangedEvent (e WorkflowCompletedEvent se final)

async cancelInstance(instanceId, reason, cancelledBy, tenantId)
  ├── 1. Buscar + validar
  ├── 2. instance.cancel(reason, cancelledBy)
  ├── 3. Skippar approvals pendentes
  ├── 4. Persistir + timeline
  └── 5. WorkflowInstanceCancelledEvent

async reassignInstance(instanceId, assignedTo, tenantId, roleSlug?)
  ├── 1. Buscar + validar
  ├── 2. instance.reassign(assignedTo, roleSlug)
  ├── 3. Persistir + timeline entry
  └── 4. Retornar instance atualizada
```

### 4.2 ApprovalOrchestrationService

```typescript
async approve(approvalId, userId, tenantId, comment?)
  ├── 1. Buscar approval                                     → ApprovalNotFoundError
  ├── 2. Validar tenant + assignedTo/delegatedTo             → SelfApprovalDeniedError
  ├── 3. approval.approve(comment)                            → ApprovalGrantedEvent
  ├── 4. Persistir
  └── 5. Retornar approval

async reject(approvalId, userId, tenantId, comment)
  ├── 1. Buscar + validar tenant
  ├── 2. Validar comment obrigatório
  ├── 3. approval.reject(comment)                             → ApprovalRejectedEvent
  ├── 4. Persistir
  └── 5. Retornar approval

async delegate(approvalId, delegatedTo, userId, tenantId)
  ├── 1. Buscar + validar tenant + assignedTo match
  ├── 2. approval.delegate(delegatedTo)                       → ApprovalDelegatedEvent
  ├── 3. Persistir
  └── 4. Retornar approval
```

### 4.3 DefinitionPublishingService / DefinitionStageService / DefinitionTransitionService

```typescript
// Publishing: valida + persiste definição publicada
// StageService: adiciona/remove/atualiza stages
// TransitionService: adiciona/remove transições com validação de stages
```

---

## 5. 18 Commands

| Command | Parâmetros | Handler |
|---------|-----------|---------|
| `CreateDefinitionCommand` | tenantId, name, slug, entityType, ... | `CreateDefinitionHandler` |
| `UpdateDefinitionCommand` | id, tenantId, name?, isActive?, ... | `UpdateDefinitionHandler` |
| `PublishDefinitionCommand` | id, tenantId | `PublishDefinitionHandler` |
| `CreateDefinitionVersionCommand` | id, tenantId | `CreateDefinitionVersionHandler` |
| `DeleteDefinitionCommand` | id, tenantId | `DeleteDefinitionHandler` |
| `CreateStageCommand` | 16 params | `CreateStageHandler` |
| `UpdateStageCommand` | id, name?, order?, ... | `UpdateStageHandler` |
| `DeleteStageCommand` | id, definitionId, tenantId | `DeleteStageHandler` |
| `CreateTransitionCommand` | 11 params | `CreateTransitionHandler` |
| `DeleteTransitionCommand` | id, definitionId | `DeleteTransitionHandler` |
| `CreateInstanceCommand` | 10 params | `CreateInstanceHandler` |
| `ExecuteTransitionCommand` | instanceId, transitionSlug, userId, tenantId, comment? | `ExecuteTransitionHandler` |
| `CancelInstanceCommand` | instanceId, reason, cancelledBy, tenantId | `CancelInstanceHandler` |
| `ReassignInstanceCommand` | instanceId, assignedTo, tenantId, roleSlug? | `ReassignInstanceHandler` |
| `ApproveCommand` | approvalId, userId, tenantId, comment? | `ApproveHandler` |
| `RejectCommand` | approvalId, userId, tenantId, comment | `RejectHandler` |
| `DelegateApprovalCommand` | approvalId, delegatedTo, userId, tenantId | `DelegateApprovalHandler` |
| `CompleteTaskCommand` | taskId, userId, tenantId, completedData? | `CompleteTaskHandler` |

---

## 6. 13 Queries

| Query | Parâmetros | Handler |
|-------|-----------|---------|
| `GetDefinitionQuery` | id, tenantId | `GetDefinitionHandler` |
| `ListDefinitionsQuery` | tenantId, entityType?, isActive?, search?, page?, limit? | `ListDefinitionsHandler` |
| `ListStagesQuery` | definitionId, tenantId | `ListStagesHandler` |
| `ListTransitionsQuery` | definitionId, tenantId | `ListTransitionsHandler` |
| `GetInstanceQuery` | id, tenantId | `GetInstanceHandler` |
| `ListInstancesQuery` | tenantId, status?, definitionId?, entityType?, entityId?, assignedTo?, page?, limit? | `ListInstancesHandler` |
| `GetInstanceTimelineQuery` | instanceId, tenantId, limit?, offset? | `GetInstanceTimelineHandler` |
| `ListApprovalsQuery` | instanceId, tenantId | `ListApprovalsHandler` |
| `ListTasksQuery` | instanceId, tenantId | `ListTasksHandler` |
| `ListMyPendingTasksQuery` | userId, tenantId | `ListMyPendingTasksHandler` |
| `GetSummaryQuery` | tenantId | `GetSummaryHandler` |
| `GetMyPendingItemsQuery` | userId, tenantId | `GetMyPendingItemsHandler` |
| `GetOverdueInstancesQuery` | tenantId | `GetOverdueInstancesHandler` |

---

## 7. 8 Response DTOs

```typescript
WorkflowDefinitionResponseDto      → id, name, slug, entityType, version, isPublished, isActive
WorkflowDefinitionDetailDto        → + stages[], transitions[]
WorkflowInstanceResponseDto        → id, workflowDefinitionId, entityType/Id, title, status, currentStage
WorkflowInstanceDetailDto          → + approvals[], tasks[], transitionCount
ApprovalResponseDto                → id, status, approvalMode, assignedTo, decision, comment
TaskResponseDto                    → id, title, type, status, assignedTo, isMandatory, dueDate
TimelineEntryDto                   → id, type, title, occurredAt, createdBy, metadata
WorkflowSummaryDto                 → totalActive, totalCompleted, totalOverdue, pendingApprovals, pendingTasks
PendingItemsDto                    → approvals[], tasks[], overdueInstances[]
PaginatedResponse<T>               → data, total, page, limit, totalPages, hasNext
```

---

## 8. Fluxo Completo: Executar Transição

```
Controller
  └─POST /api/v1/workflow/instances/:id/transition
     └─@Body ExecuteTransitionDto { transitionSlug, comment? }
        └─CommandBus.execute(ExecuteTransitionCommand)
           │
           ▼
        ExecuteTransitionHandler
          ├─ 1. instanceRepo.findById(instanceId)          → valida tenant
          ├─ 2. defRepo.findById(instance.definitionId)    → getStage + getTransition
          ├─ 3. taskRepo.findByInstance(instanceId)        → para validação
          ├─ 4. approvalRepo.findByInstance(instanceId)    → para validação
          ├─ 5. transitionValidator.validate(instance, transition, user, stage, tasks, approvals)
          │     └─ 5 condições: active, available, tasks, approvals, comment
          ├─ 6. TransitionLogEntity.create({...})
          ├─ 7. instance.moveToStage(toStage.id)           → atualiza currentStageId
          ├─ 8. Se rejectionTarget: instance.reject(userId)
          ├─ 9. Se estágio FINAL: instance.complete(userId)
          ├─ 10. WorkflowTimelineEntryEntity.create({...})
          ├─ 11. Persistir em transação:
          │      ├─ logRepo.save(log)
          │      ├─ instanceRepo.save(instance)
          │      └─ timelineRepo.save(entry)
          ├─ 12. instance.publishTransitionExecuted()      → StageChangedEvent
          ├─ 13. Se final: instance.publishCompleted()     → WorkflowCompletedEvent
          └─ 14. instanceToDto(instance)
               └─ Retorna WorkflowInstanceResponseDto
```

---

## 9. Separação de Responsabilidades

```
┌─────────────────────────────────────────────────────────────┐
│                     HANDLER (use case)                       │
│                                                             │
│  Responsabilidade:                                           │
│  ├── Receber command/query                                  │
│  ├── Orquestrar chamadas a repositórios                     │
│  ├── Invocar domain services e entities                     │
│  ├── Coordenar transação de persistência                    │
│  └── Mapear resultado para DTO                              │
│                                                             │
│  NÃO faz:                                                    │
│  ├── Regras de negócio complexas (delegadas ao domain)      │
│  ├── Acesso direto a Prisma (via repositórios)              │
│  └── Lógica de apresentação                                 │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                 ORCHESTRATION SERVICE                         │
│                                                             │
│  Responsabilidade:                                           │
│  ├── Coordenar fluxos multi-entidade                        │
│  ├── Gerenciar transações distribuidas                      │
│  ├── Publicar eventos de domínio                            │
│  └── Garantir consistência eventual                         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                 DOMAIN LAYER (puro)                           │
│  ├── Entities + Aggregates (regras de negócio)               │
│  ├── Domain Services (DAG, ApprovalEngine)                   │
│  └── Repository Interfaces (ports)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Multi-tenant + Auditabilidade

```typescript
// Todo handler segue este padrão:
async execute(command: CreateInstanceCommand): Promise<WorkflowInstanceResponseDto> {
  // 1. Tenant isolation via CurrentTenant
  const { tenantId } = this.tenant;

  // 2. Validar tenant em toda entidade buscada
  const definition = await this.defRepo.findById(command.workflowDefinitionId);
  if (definition.tenantId !== tenantId) throw new Error('Tenant mismatch');

  // 3. Operação no domínio puro
  const instance = await this.orchestration.createInstance(params);

  // 4. Eventos publicados pelo domínio (não pelo handler)
  // Os eventos estão nos domainEvents[] do aggregate

  // 5. DTO de resposta (sem lógica)
  return instanceToDto(instance);
}
```
