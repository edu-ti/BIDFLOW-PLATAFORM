# Workflow Domain Events — Catálogo Enterprise

> **Propósito:** Catálogo completo dos 6 domain events do Workflow Engine. Define payloads, produtores, consumidores, versionamento, retry strategy e DLQ.

---

## 1. `WorkflowStarted`

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | `com.bidflow.workflow.instance.started.v1` |
| **Versão** | `v1` (active) |
| **Produtor** | `CreateInstanceHandler` |
| **Gatilho** | Instância de workflow criada no estágio inicial |
| **Criticidade** | Alta |
| **Routing Key** | `{tenantId}.workflow.instance.started` |

**Payload:**
```json
{
  "eventId": "uuid",
  "specversion": "1.0",
  "type": "com.bidflow.workflow.instance.started.v1",
  "source": "/api/v1/workflow/instances",
  "subject": "{instanceId}",
  "time": "2026-05-15T10:00:00Z",
  "tenantid": "uuid",
  "userid": "uuid",
  "data": {
    "instanceId": "uuid",
    "workflowDefinitionId": "uuid",
    "workflowSlug": "aprovacao-rfp",
    "workflowVersion": 1,
    "entityType": "bidding.rfp",
    "entityId": "uuid",
    "title": "Aprovação RFP #001",
    "initialStage": "rascunho",
    "assignedTo": "uuid",
    "priority": "HIGH",
    "startedBy": "uuid"
  }
}
```

**Consumidores:**

| Serviço | Handler | Ação |
|---------|---------|------|
| Notifications | `onWorkflowStarted` | Notificar assignedTo |
| Analytics | `recordWorkflowStart` | Métrica de início |
| Audit | `persistAuditLog` | Audit trail |

---

## 2. `StageChanged`

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | `com.bidflow.workflow.stage.changed.v1` |
| **Versão** | `v1` (active) |
| **Produtor** | `ExecuteTransitionHandler` |
| **Gatilho** | Transição executada entre estágios |
| **Criticidade** | Alta |
| **Routing Key** | `{tenantId}.workflow.stage.changed` |

**Payload:**
```json
{
  "eventId": "uuid",
  "type": "com.bidflow.workflow.stage.changed.v1",
  "source": "/api/v1/workflow/instances/{id}/transition",
  "subject": "{instanceId}",
  "time": "2026-05-15T10:30:00Z",
  "tenantid": "uuid",
  "userid": "uuid",
  "data": {
    "instanceId": "uuid",
    "workflowDefinitionId": "uuid",
    "fromStage": "rascunho",
    "fromStageName": "Rascunho",
    "toStage": "revisao",
    "toStageName": "Em Revisão",
    "transitionSlug": "enviar_revisao",
    "transitionName": "Enviar para Revisão",
    "isAutomatic": false,
    "comment": "RFP completa, segue para revisão",
    "executedBy": "uuid",
    "deadlineAt": "2026-05-16T10:30:00Z",
    "isRejection": false
  }
}
```

**Consumidores:**

| Serviço | Handler | Ação |
|---------|---------|------|
| Notifications | `onStageChanged` | Notificar novo assignedTo |
| Timeline | `addTimelineEntry` | Registrar na timeline |
| Analytics | `recordStageDuration` | Métrica de tempo por estágio |
| Bidding | `onRfpStageChanged` | Atualizar status da RFP |

---

## 3. `ApprovalRequested`

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | `com.bidflow.workflow.approval.requested.v1` |
| **Versão** | `v1` (active) |
| **Produtor** | `ExecuteTransitionHandler` |
| **Gatilho** | Instância entra em estágio APPROVAL |
| **Criticidade** | Alta |
| **Routing Key** | `{tenantId}.workflow.approval.requested` |

**Payload:**
```json
{
  "eventId": "uuid",
  "type": "com.bidflow.workflow.approval.requested.v1",
  "source": "/api/v1/workflow/instances/{id}",
  "subject": "{approvalId}",
  "time": "2026-05-15T11:00:00Z",
  "tenantid": "uuid",
  "data": {
    "approvalId": "uuid",
    "workflowInstanceId": "uuid",
    "workflowDefinitionId": "uuid",
    "stageId": "uuid",
    "stageName": "Aprovação do Diretor",
    "approvalMode": "ANY",
    "assignedTo": "uuid",
    "assignedRole": "approver",
    "order": 1,
    "deadlineAt": "2026-05-17T11:00:00Z",
    "instanceTitle": "Aprovação RFP #001",
    "entityType": "bidding.rfp",
    "entityId": "uuid"
  }
}
```

**Consumidores:**

| Serviço | Handler | Ação |
|---------|---------|------|
| Notifications | `notifyApprover` | Email/push para assignedTo |
| Scheduler | `scheduleApprovalReminder` | Agendar lembretes |

---

## 4. `ApprovalGranted`

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | `com.bidflow.workflow.approval.granted.v1` |
| **Versão** | `v1` (active) |
| **Produtor** | `ApproveHandler` / `RejectHandler` |
| **Gatilho** | Aprovador toma decisão (approve/reject) |
| **Criticidade** | Alta |
| **Routing Key** | `{tenantId}.workflow.approval.granted` |

**Payload:**
```json
{
  "eventId": "uuid",
  "type": "com.bidflow.workflow.approval.granted.v1",
  "source": "/api/v1/workflow/instances/{id}/approvals/{id}",
  "subject": "{approvalId}",
  "time": "2026-05-15T14:00:00Z",
  "tenantid": "uuid",
  "data": {
    "approvalId": "uuid",
    "workflowInstanceId": "uuid",
    "workflowDefinitionId": "uuid",
    "stageId": "uuid",
    "decision": "APPROVED",
    "decidedBy": "uuid",
    "comment": "Documentação completa, aprovado",
    "approvalMode": "ANY",
    "remainingApprovals": 0,
    "delegatedFrom": null
  }
}
```

**Consumidores:**

| Serviço | Handler | Ação |
|---------|---------|------|
| Workflow Engine | `onApprovalGranted` | Verificar se pode transicionar |
| Notifications | `notifyRequester` | Notificar solicitante |
| Analytics | `recordApprovalTime` | Métrica de tempo de aprovação |

---

## 5. `WorkflowCompleted`

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | `com.bidflow.workflow.instance.completed.v1` |
| **Versão** | `v1` (active) |
| **Produtor** | `ExecuteTransitionHandler` |
| **Gatilho** | Instância atinge estágio FINAL, REJECTED ou CANCELLED |
| **Criticidade** | Crítica |
| **Routing Key** | `{tenantId}.workflow.instance.completed` |

**Payload:**
```json
{
  "eventId": "uuid",
  "type": "com.bidflow.workflow.instance.completed.v1",
  "source": "/api/v1/workflow/instances/{id}",
  "subject": "{instanceId}",
  "time": "2026-05-15T16:00:00Z",
  "tenantid": "uuid",
  "data": {
    "instanceId": "uuid",
    "workflowDefinitionId": "uuid",
    "workflowSlug": "aprovacao-rfp",
    "workflowVersion": 1,
    "entityType": "bidding.rfp",
    "entityId": "uuid",
    "title": "Aprovação RFP #001",
    "finalStage": "aprovado",
    "totalTransitions": 4,
    "totalElapsedMs": 21600000,
    "completedBy": "uuid",
    "result": "COMPLETED",
    "reason": null
  }
}
```

**Consumidores:**

| Serviço | Handler | Ação |
|---------|---------|------|
| Bidding | `onWorkflowCompleted` | Avançar status da RFP |
| CRM | `onWorkflowCompleted` | Atualizar pipeline |
| Notifications | `notifyStakeholders` | Notificar todos os envolvidos |
| Analytics | `recordWorkflowCompletion` | Métrica de conclusão |

---

## 6. `TaskAssigned`

| Propriedade | Valor |
|-------------|-------|
| **Tipo** | `com.bidflow.workflow.task.assigned.v1` |
| **Versão** | `v1` (active) |
| **Produtor** | `WorkflowInstanceFactory` / `CreateTaskHandler` |
| **Gatilho** | Tarefa criada e atribuída |
| **Criticidade** | Média |
| **Routing Key** | `{tenantId}.workflow.task.assigned` |

**Payload:**
```json
{
  "eventId": "uuid",
  "type": "com.bidflow.workflow.task.assigned.v1",
  "source": "/api/v1/workflow/instances/{id}/tasks",
  "subject": "{taskId}",
  "time": "2026-05-15T10:00:00Z",
  "tenantid": "uuid",
  "data": {
    "taskId": "uuid",
    "workflowInstanceId": "uuid",
    "workflowDefinitionId": "uuid",
    "stageId": "uuid",
    "stageName": "Revisão",
    "title": "Anexar comprovante de proposta",
    "description": "Digitalizar e anexar o documento assinado",
    "taskType": "UPLOAD",
    "assignedTo": "uuid",
    "assignedBy": "uuid",
    "isMandatory": true,
    "dueDate": "2026-05-17T10:00:00Z",
    "instanceTitle": "Aprovação RFP #001",
    "entityType": "bidding.rfp",
    "entityId": "uuid"
  }
}
```

**Consumidores:**

| Serviço | Handler | Ação |
|---------|---------|------|
| Notifications | `notifyTaskAssignee` | Notificar responsável |
| CRM Tasks | `syncWorkflowTask` | Sincronizar com módulo de tarefas |

---

## 7. Retry Strategy

```yaml
workflow_events:
  retry:
    max_attempts: 3
    initial_interval: 1s      # 1 segundo
    multiplier: 2              # backoff exponencial
    max_interval: 60s          # máximo 60s entre tentativas
    retry_on:
      - TIMEOUT
      - SERVICE_UNAVAILABLE
      - DB_CONNECTION_ERROR
      - RATE_LIMITED
    no_retry_on:
      - VALIDATION_ERROR
      - ENTITY_NOT_FOUND
      - TENANT_MISMATCH
      - DUPLICATE_EVENT
```

## 8. Dead Letter Queue (DLQ)

```yaml
dlq:
  exchange: "bidflow.dlq.workflow"
  type: "fanout"
  queue: "dlq.workflow.all"
  ttl: 30_days
  alerts:
    - condition: "message_count > 0"
      severity: "P3"
      notify: "workflow-team"
  replay:
    enabled: true
    tool: "RabbitMQ Management UI"
    max_retries_before_dlq: 3
  routing:
    - event: "WorkflowStarted"
      dlq_reason: "Definition not found"
    - event: "ApprovalGranted"
      dlq_reason: "Instance not found"
```

## 9. Event Versioning

```yaml
versioning:
  strategy: "type-based"
  pattern: "com.bidflow.workflow.{event}.v{version}"
  current_version: 1
  breaking_change_policy:
    - "Adição de campo opcional: NON-breaking"
    - "Remoção de campo: BREAKING → nova versão"
    - "Renomeio de campo: BREAKING → nova versão"
    - "Mudança de tipo: BREAKING → nova versão"
  deprecation:
    notice_days: 90
    parallel_publish: true  # v1 e v2 publicados em paralelo
```

## 10. Matriz Produtor x Consumidor

| Evento | Produtor | Consumidores | Broker | Retry | DLQ |
|--------|----------|--------------|--------|-------|-----|
| `WorkflowStarted` | CreateInstanceHandler | Notifications, Analytics, Audit | RabbitMQ | 3x | Sim |
| `StageChanged` | ExecuteTransitionHandler | Notifications, Timeline, Analytics, Bidding | RabbitMQ | 3x | Sim |
| `ApprovalRequested` | ExecuteTransitionHandler | Notifications, Scheduler | RabbitMQ | 3x | Sim |
| `ApprovalGranted` | ApproveHandler, RejectHandler | Workflow Engine, Notifications, Analytics | RabbitMQ | 3x | Sim |
| `WorkflowCompleted` | ExecuteTransitionHandler | Bidding, CRM, Notifications, Analytics | RabbitMQ | 3x | Sim |
| `TaskAssigned` | WorkflowInstanceFactory, CreateTaskHandler | Notifications, CRM Tasks | RabbitMQ | 3x | Sim |

## 11. Implementação no Código

### Publisher Injection

```typescript
// workflow.module.ts
{
  provide: 'IWorkflowEventPublisher',
  useFactory: (...publishers: IWorkflowEventPublisher[]) =>
    new CompositeWorkflowEventPublisher(publishers),
  inject: [ConsoleWorkflowEventPublisher, RabbitMqWorkflowEventPublisher],
}
```

### Uso no Handler

```typescript
// ExecuteTransitionHandler
async execute(command: ExecuteTransitionCommand): Promise<WorkflowInstanceResponseDto> {
  // ... lógica de transição ...

  await this.eventPublisher.publishStageChanged(new StageChangedEvent(
    instance.id, tenantId, defId, instance.id,
    fromStage.slug, fromStage.name,
    toStage.slug, toStage.name,
    transition.slug, transition.name,
    transition.isAutomatic, command.comment, userId,
    deadlineAt?.toISOString() ?? null, isRejection,
  ));

  if (nextStage.isFinal) {
    await this.eventPublisher.publishWorkflowCompleted(new WorkflowCompletedEvent(
      instance.id, tenantId, defId, definition.slug, definition.version,
      instance.entityType, instance.entityId, instance.title,
      nextStage.slug, totalTransitions, elapsedMs, userId, result, null,
    ));
  }

  return instanceToDto(instance);
}
```
