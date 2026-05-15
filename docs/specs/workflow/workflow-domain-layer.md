# Workflow Engine — Domain Layer Enterprise

> **Domain Layer** — Código puro TypeScript, zero dependências de infraestrutura.

---

## 1. Estrutura de Pastas (37 arquivos)

```
src/workflow/domain/
├── index.ts                                              # Barrel export
├── events/index.ts                                       # 8 domain events
├── common/
│   ├── aggregate-root.ts                                 # Base class com domain events
│   ├── domain-event.ts                                   # Base class (eventId, aggregateId, tenantId)
│   ├── enums.ts                                          # 10 enums
│   ├── errors/domain-error.ts                            # Base abstract
│   ├── errors/index.ts                                   # 20 domain errors
│   ├── value-objects/approval-config.ts                  # ApprovalConfig VO
│   ├── value-objects/assignment-config.ts                # AssignmentConfig VO
│   ├── value-objects/transition-condition.ts             # TransitionCondition VO
│   └── services/
│       ├── dag-validator.service.ts                      # DAG validation
│       ├── instance-factory.service.ts                   # Instance factory
│       ├── approval-engine.service.ts                    # ANY/ALL/SEQUENTIAL engine
│       └── transition-validator.service.ts               # Transition validator
├── definition/
│   ├── workflow-definition.entity.ts                     # AGGREGATE ROOT
│   └── workflow-definition.repository.ts                 # Port
├── stage/
│   ├── stage.entity.ts                                   # ENTITY
│   └── stage.repository.ts                               # Port
├── transition/
│   ├── transition.entity.ts                              # ENTITY
│   └── transition.repository.ts                          # Port
├── instance/
│   ├── workflow-instance.entity.ts                       # AGGREGATE ROOT
│   └── workflow-instance.repository.ts                   # Port
├── workflow-instance-stage/
│   ├── workflow-instance-stage.entity.ts                 # ENTITY (append-only)
│   └── workflow-instance-stage.repository.ts             # Port
├── transition-log/
│   ├── transition-log.entity.ts                          # ENTITY (append-only)
│   └── transition-log.repository.ts                      # Port
├── approval/
│   ├── approval.entity.ts                                # AGGREGATE ROOT
│   └── approval.repository.ts                            # Port
├── assignment/
│   ├── workflow-assignment.entity.ts                     # ENTITY
│   └── workflow-assignment.repository.ts                 # Port
├── task/
│   ├── workflow-task.entity.ts                           # AGGREGATE ROOT
│   └── workflow-task.repository.ts                       # Port
└── timeline/
    ├── workflow-timeline-entry.entity.ts                 # ENTITY (append-only)
    └── workflow-timeline-entry.repository.ts             # Port
```

---

## 2. Aggregate Roots

### 2.1 WorkflowDefinitionEntity

- **Factory:** `create(props)` e `restore(data)`
- **Comandos:** `addStage()`, `removeStage()`, `addTransition()`, `publish()`, `createNewVersion()`
- **Queries:** `getInitialStage()`, `getStage(slug)`, `getTransition(slug, fromStageId)`, `findAutoTriggerEvent()`

**Invariantes no `publish()`:**
1. Apenas 1 estágio INITIAL → `NoInitialStageError`
2. Pelo menos 1 FINAL → `NoFinalStageError`
3. Ordens sequenciais 1, 2, 3...
4. DAG (DFS cycle detection) → `WorkflowCycleDetectedError`
5. Todo estágio não-final tem transição de saída
6. isPublished = true → todas as mutações bloqueadas

### 2.2 WorkflowInstanceEntity

- **Factory:** `create(props)` — valida `maxConcurrentInstances`, título obrigatório
- **Ciclo de vida:** `moveToStage()`, `complete()`, `cancel()`, `reject()`
- **Config:** `reassign()`, `setPriority()`

**Invariantes:**
1. `moveToStage()` rejeita se status !== ACTIVE
2. `complete()` rejeita se já COMPLETED/CANCELLED
3. `cancel()` rejeita se COMPLETED
4. Dispara `WorkflowStartedEvent` no create, `StageChangedEvent` no moveToStage
5. Dispara `WorkflowCompletedEvent` no complete

### 2.3 ApprovalEntity

- **Factory:** `create(props)` — valida `SelfApprovalDeniedError`
- **Decisão:** `approve(comment?)`, `reject(comment)`, `delegate(to)`, `skip()`, `markExpired()`

**Invariantes:**
1. Double-decision → `ApprovalAlreadyDecidedError`
2. Rejeição sem comment → throw
3. Máximo 1 delegação → `MaxDelegationExceededError`
4. Auto-delegação → throw
5. `approve()` → `ApprovalGrantedEvent`
6. `reject()` → `ApprovalRejectedEvent`

---

## 3. 8 Domain Events

| Evento | Type | Payload |
|--------|------|---------|
| `WorkflowStartedEvent` | `com.bidflow.workflow.instance.started.v1` | instanceId, workflowSlug, entityType, entityId, initialStage, startedBy |
| `StageChangedEvent` | `com.bidflow.workflow.stage.changed.v1` | instanceId, fromStage->toStage, transitionSlug, executedBy, isAutomatic |
| `ApprovalRequestedEvent` | `com.bidflow.workflow.approval.requested.v1` | approvalId, stageSlug, approvalMode, assignedTo, deadlineAt |
| `ApprovalGrantedEvent` | `com.bidflow.workflow.approval.granted.v1` | approvalId, decidedBy, comment, remainingApprovals |
| `ApprovalRejectedEvent` | `com.bidflow.workflow.approval.rejected.v1` | approvalId, decidedBy, comment |
| `TaskAssignedEvent` | `com.bidflow.workflow.task.assigned.v1` | taskId, title, taskType, assignedTo, assignedBy, isMandatory |
| `TaskCompletedEvent` | `com.bidflow.workflow.task.completed.v1` | taskId, completedBy, completedData |
| `WorkflowCompletedEvent` | `com.bidflow.workflow.instance.completed.v1` | workflowSlug, finalStage, completedBy, result |

---

## 4. 20 Domain Errors

```
404: WorkflowDefinitionNotFound, WorkflowInstanceNotFound, StageNotFound, TransitionNotFound, ApprovalNotFound
403: TransitionNotAllowed, SelfApprovalDenied
409: DuplicateWorkflowInstance
422: InvalidTransition, ApprovalPending, MandatoryTasksPending, WorkflowCycleDetected, PublishedWorkflowImmutable, ApprovalAlreadyDecided, InstanceAlreadyCompleted, MaxDelegationExceeded, NoInitialStage, NoFinalStage, StageSlugDuplicate
429: MaxConcurrentInstances
```

---

## 5. 4 Domain Services

| Service | Método | Função |
|---------|--------|--------|
| `DagValidatorService` | `validate(definition)` | 6 regras + cycle detection (DFS) |
| `WorkflowInstanceFactory` | `create(params)` | Gera instance + assignments + approvals + timeline |
| `ApprovalEngine` | `processDecision()`, `canTransition()` | ANY/ALL/SEQUENTIAL logic |
| `TransitionValidator` | `validate()` | 5 pré-condições para transição |

---

## 6. 10 Repository Interfaces (Ports)

| Interface | Métodos |
|-----------|---------|
| `WorkflowDefinitionRepository` | save, findById, findBySlug, findMany, findByEntityType, count, delete |
| `StageRepository` | save, findById, findByDefinition, findInitialStage, delete |
| `TransitionRepository` | save, findById, findByDefinition, findAvailable, findByAutoTriggerEvent, delete |
| `WorkflowInstanceRepository` | save, findById, findMany, count, findByEntity, findOverdue, countActiveByDefinition, findByAssignedUser |
| `WorkflowInstanceStageRepository` | save, findById, findByInstance, findActiveByInstance, findByInstanceAndStage |
| `TransitionLogRepository` | save, findByInstance, countByInstance |
| `ApprovalRepository` | save, findById, findByInstance, findPendingByUser, findPendingByStage, countPendingByInstance, markExpired |
| `WorkflowAssignmentRepository` | save, findByInstance, findActiveByUser, delete |
| `WorkflowTaskRepository` | save, findById, findByInstance, findPendingByUser, countMandatoryPending, delete |
| `WorkflowTimelineEntryRepository` | save, findByInstance, createMany |

---

## 7. Zero Dependências

```
DOMAIN LAYER — imports permitidos:
├── ✅ crypto (randomUUID)
├── ✅ Date, Promise, Error
├── ✅ TypeScript nativo

DOMAIN LAYER — imports proibidos:
├── ❌ @prisma/client, PrismaClient
├── ❌ @nestjs/common, @nestjs/core
├── ❌ Express, HTTP, Request, Response
├── ❌ class-validator, class-transformer
├── ❌ DTOs, Controllers, Guards
├── ❌ RabbitMQ, Kafka, qualquer broker
```
