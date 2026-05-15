# Workflow Engine — Events Architecture Enterprise

> **Event-Driven Architecture** — Domain events, integration events, publishers, consumers, versioning, retry, DLQ e observabilidade.

---

## 1. Estrutura de Pastas

```
src/workflow/events/                          (5 arquivos atuais)
├── domain-events.ts                          → 6 eventos de domínio (WorkflowStarted, StageChanged, etc.)
├── publishers.ts                             → IWorkflowEventPublisher interface
├── rabbitmq-publisher.ts                     → RabbitMqWorkflowEventPublisher
├── composite-publisher.ts                    → CompositeWorkflowEventPublisher
└── index.ts                                  → Barrel export

src/workflow/infrastructure/event-publishers/ (1 arquivo)
└── index.ts                                  → WorkflowEventPublisher + RabbitMqEventPublisher

A ADICIONAR:
src/workflow/events/
├── contracts/
│   ├── workflow-started.contract.ts          → Schema + version + example
│   ├── stage-changed.contract.ts
│   ├── approval-granted.contract.ts
│   └── index.ts
├── integration-events.ts                     → Eventos para publicação externa
├── idempotency.service.ts                    → Idempotency handler
├── outbox.service.ts                         → Outbox pattern
├── event-bus.service.ts                      → Abstraction sobre RabbitMQ/Kafka
└── workflow-event-tracing.ts                 → OpenTelemetry spans
```

---

## 2. Domain Events vs Integration Events

```
DOMAIN EVENTS                          INTEGRATION EVENTS
(publicados pelo aggregate)            (publicados pelo handler após persistência)
─────────────────────────              ─────────────────────────
WorkflowStartedEvent                   WorkflowStartedIntegrationEvent
StageChangedEvent                      StageChangedIntegrationEvent
ApprovalRequestedEvent                 ApprovalRequestedIntegrationEvent
ApprovalGrantedEvent                   ApprovalGrantedIntegrationEvent
ApprovalRejectedEvent                  ApprovalRejectedIntegrationEvent
TaskAssignedEvent                      TaskAssignedIntegrationEvent
TaskCompletedEvent                     TaskCompletedIntegrationEvent
WorkflowCompletedEvent                 WorkflowCompletedIntegrationEvent
WorkflowCancelledEvent                 WorkflowCancelledIntegrationEvent

- Puro TypeScript                       - CloudEvents 1.0 compliant
- Sem serialização                     - JSON serializado
- Consumido internamente               - Publicado no message broker
- Idempotente por eventId              - Idempotente por eventId
- Roteado por aggregateId              - Roteado por tenantId + eventType
```

---

## 3. 9 Eventos — Payloads e Versionamento

### 3.1 WorkflowStarted — v1
```typescript
// Type: com.bidflow.workflow.instance.started.v1
// Routing Key: {tenantId}.workflow.instance.started

interface WorkflowStartedPayload {
  instanceId: string;           // UUID
  workflowDefinitionId: string; // UUID
  workflowSlug: string;         // "aprovacao-rfp"
  workflowVersion: number;      // 1
  entityType: string;           // "bidding.rfp"
  entityId: string;             // UUID
  title: string;                // "Aprovação RFP #001"
  initialStage: string;         // "rascunho"
  assignedTo: string | null;    // UUID
  priority: string;             // "HIGH"
  startedBy: string;            // UUID
}
```

### 3.2 StageChanged — v1
```typescript
// Type: com.bidflow.workflow.stage.changed.v1
// Routing Key: {tenantId}.workflow.stage.changed

interface StageChangedPayload {
  instanceId: string;
  fromStage: string;            // "rascunho"
  fromStageName: string;        // "Rascunho"
  toStage: string;              // "revisao"
  toStageName: string;          // "Em Revisão"
  transitionSlug: string;       // "enviar_revisao"
  executedBy: string;
  isAutomatic: boolean;
  comment: string | null;
  deadlineAt: string | null;    // ISO 8601
}
```

### 3.3 ApprovalRequested — v1
```typescript
// Type: com.bidflow.workflow.approval.requested.v1
// Routing Key: {tenantId}.workflow.approval.requested

interface ApprovalRequestedPayload {
  approvalId: string;
  workflowInstanceId: string;
  stageSlug: string;            // "aprovacao_diretor"
  approvalMode: string;         // "ANY" | "ALL" | "SEQUENTIAL"
  assignedTo: string;
  assignedRole: string | null;
  deadlineAt: string | null;
  order: number;
}
```

### 3.4 ApprovalGranted — v1
```typescript
// Type: com.bidflow.workflow.approval.granted.v1
// Routing Key: {tenantId}.workflow.approval.granted

interface ApprovalGrantedPayload {
  approvalId: string;
  workflowInstanceId: string;
  decidedBy: string;
  comment: string | null;
  remainingApprovals: number;   // 0 = all resolved
}
```

### 3.5 ApprovalRejected — v1
```typescript
// Type: com.bidflow.workflow.approval.rejected.v1
// Routing Key: {tenantId}.workflow.approval.rejected

interface ApprovalRejectedPayload {
  approvalId: string;
  workflowInstanceId: string;
  decidedBy: string;
  comment: string;              // Obrigatório
}
```

### 3.6 TaskAssigned — v1
```typescript
// Type: com.bidflow.workflow.task.assigned.v1
// Routing Key: {tenantId}.workflow.task.assigned

interface TaskAssignedPayload {
  taskId: string;
  workflowInstanceId: string;
  title: string;
  taskType: string;             // "ACTION" | "UPLOAD" | "FORM" | "VALIDATION" | "NOTIFICATION"
  assignedTo: string;
  assignedBy: string;
  isMandatory: boolean;
  dueDate: string | null;
}
```

### 3.7 TaskCompleted — v1
```typescript
// Type: com.bidflow.workflow.task.completed.v1
// Routing Key: {tenantId}.workflow.task.completed

interface TaskCompletedPayload {
  taskId: string;
  workflowInstanceId: string;
  completedBy: string;
  completedData: Record<string, unknown> | null;
}
```

### 3.8 WorkflowCompleted — v1
```typescript
// Type: com.bidflow.workflow.instance.completed.v1
// Routing Key: {tenantId}.workflow.instance.completed

interface WorkflowCompletedPayload {
  instanceId: string;
  workflowSlug: string;
  workflowVersion: number;
  entityType: string;
  entityId: string;
  title: string;
  finalStage: string;
  totalTransitions: number;
  totalElapsedMs: number;
  completedBy: string;
  result: "COMPLETED" | "REJECTED" | "CANCELLED";
}
```

### 3.9 WorkflowCancelled — v1
```typescript
// Type: com.bidflow.workflow.instance.cancelled.v1
// Routing Key: {tenantId}.workflow.instance.cancelled

interface WorkflowCancelledPayload {
  instanceId: string;
  reason: string;
  cancelledBy: string;
}
```

---

## 4. Versionamento

```yaml
event_versioning:
  strategy: "type-based"
  pattern: "com.bidflow.workflow.{event}.v{version}"
  current: 1

  breaking_change_policy:
    - "Adição de campo opcional:  NON-breaking (sem nova versão)"
    - "Remoção de campo:          BREAKING → nova versão"
    - "Renomeio de campo:         BREAKING → nova versão"
    - "Mudança de tipo:           BREAKING → nova versão"

  lifecycle:
    v1: "active"
    v2: "deprecated"    # 90 dias de paralelismo
    v3: "removed"       # apenas para referência histórica

  parallel_publish:
    enabled: true       # v1 e v2 publicados simultaneamente por 90 dias
    duration_days: 90
```

---

## 5. Envelope CloudEvents 1.0

```json
{
  "specversion": "1.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "/api/v1/workflow/instances/990e8400",
  "type": "com.bidflow.workflow.stage.changed.v1",
  "subject": "990e8400-e29b-41d4-a716-446655440000",
  "time": "2026-05-15T10:30:00.000Z",
  "datacontenttype": "application/json",
  "tenantid": "770e8400-e29b-41d4-a716-446655440000",
  "userid": "880e8400-e29b-41d4-a716-446655440000",
  "correlationid": "aa0e8400-e29b-41d4-a716-446655440000",
  "data": {
    "instanceId": "990e8400",
    "fromStage": "rascunho",
    "toStage": "revisao",
    "transitionSlug": "enviar_revisao",
    "executedBy": "880e8400",
    "isAutomatic": false
  }
}
```

---

## 6. Publishers (3 implementações)

### ConsoleWorkflowEventPublisher
```typescript
// Log estruturado no console. Usado em development/test.
async publishStageChanged(event: StageChangedEvent): Promise<void> {
  this.logger.log(`[${event.type}] ${event.fromStageName} → ${event.toStageName}`, {
    eventId: event.eventId, instanceId: event.instanceId,
  });
}
```

### RabbitMqWorkflowEventPublisher
```typescript
// Publica no RabbitMQ. Usado em produção.
async publishStageChanged(event: StageChangedEvent): Promise<void> {
  const routingKey = `${event.tenantId}.${event.type}`;
  const message = this.toCloudEvent(event);
  await this.amqp.publish('bidflow.domain', routingKey, message);
}
```

### CompositeWorkflowEventPublisher
```typescript
// Compõe múltiplos publishers. Executa todos com fallback individual.
async publishStageChanged(event: StageChangedEvent): Promise<void> {
  for (const publisher of this.publishers) {
    try { await publisher.publishStageChanged(event); }
    catch (e) { this.logger.error(`Publisher failed: ${(e as Error).message}`); }
  }
}
```

---

## 7. Retry Strategy

```yaml
workflow_events:
  retry:
    max_attempts: 3
    initial_interval: 1s
    multiplier: 2                # 1s → 2s → 4s
    max_interval: 60s

    retryable_errors:
      - TIMEOUT
      - SERVICE_UNAVAILABLE
      - DB_CONNECTION_ERROR
      - RATE_LIMITED
      - NETWORK_ERROR

    non_retryable_errors:
      - VALIDATION_ERROR         # Payload inválido
      - ENTITY_NOT_FOUND         # Instância não existe mais
      - TENANT_MISMATCH          # TenantId não corresponde
      - DUPLICATE_EVENT          # Evento já processado
```

---

## 8. Dead Letter Queue (DLQ) Strategy

```yaml
dlq:
  exchange: "bidflow.dlq.workflow"
  type: "fanout"
  queue: "dlq.workflow.all"
  ttl: 30_dias

  alerts:
    - condition: "message_count > 0"
      severity: "P3"
      notify: "workflow-team"
      channel: "#alerts-workflow"

  replay:
    tool: "RabbitMQ Management UI"
    max_retries_before_dlq: 3
    requires_manual_review: true

  routing:
    - event: "StageChanged"
      dlq_reason: "InstanceNotFoundException"
    - event: "ApprovalGranted"
      dlq_reason: "ApprovalNotFoundException"
    - event: "WorkflowCompleted"
      dlq_reason: "EntityNotFoundException"
```

---

## 9. Idempotência

```typescript
// Garantir que cada evento seja processado exatamente uma vez
@Injectable()
export class IdempotencyService {
  private readonly processed = new Set<string>(); // Redis em produção

  async isProcessed(eventId: string): Promise<boolean> {
    return this.processed.has(eventId);
  }

  async markProcessed(eventId: string, ttl: number = 86400): Promise<void> {
    this.processed.add(eventId);
    // Em produção: redis.set(`event:processed:${eventId}`, '1', 'EX', ttl);
  }
}

// Uso no consumer:
async handle(event: CloudEvent): Promise<void> {
  if (await this.idempotency.isProcessed(event.id)) return;
  await this.process(event);
  await this.idempotency.markProcessed(event.id);
}
```

---

## 10. Outbox Pattern

```typescript
@Injectable()
export class OutboxService {
  async publish(events: DomainEvent[]): Promise<void> {
    // 1. Salvar na tabela outbox dentro da mesma transação do aggregate
    await this.prisma.outbox.createMany({
      data: events.map(e => ({
        id: e.eventId,
        type: e.type,
        aggregateId: e.aggregateId,
        tenantId: e.tenantId,
        payload: JSON.stringify(e),
        status: 'PENDING',
        createdAt: new Date(),
      })),
    });

    // 2. Publicar no broker (fora da transação — eventual consistency)
    for (const event of events) {
      try {
        await this.bus.publish(event);
        await this.prisma.outbox.update({
          where: { id: event.eventId },
          data: { status: 'PUBLISHED', publishedAt: new Date() },
        });
      } catch (error) {
        await this.prisma.outbox.update({
          where: { id: event.eventId },
          data: { status: 'FAILED', error: (error as Error).message },
        });
      }
    }
  }
}
```

---

## 11. Event Tracing (OpenTelemetry)

```typescript
@Injectable()
export class WorkflowEventTracingService {
  private readonly tracer = trace.getTracer('workflow-events');

  async tracePublish<T>(event: DomainEvent, fn: () => Promise<T>): Promise<T> {
    const span = this.tracer.startSpan(`event.publish.${event.type}`, {
      attributes: {
        'event.id': event.eventId,
        'event.type': event.type,
        'event.tenant_id': event.tenantId,
        'event.aggregate_id': event.aggregateId,
      },
    });

    try {
      return await fn();
    } finally {
      span.end();
    }
  }

  async traceConsume<T>(event: CloudEvent, fn: () => Promise<T>): Promise<T> {
    const span = this.tracer.startSpan(`event.consume.${event.type}`, {
      attributes: {
        'event.id': event.id,
        'event.type': event.type,
        'event.tenant_id': event.tenantid,
      },
    });
    try { return await fn(); } finally { span.end(); }
  }
}
```

---

## 12. Observabilidade de Eventos

```typescript
// Métricas Prometheus
const workflowEventCounter = new Counter({
  name: 'bidflow_workflow_events_total',
  help: 'Total de eventos publicados',
  labelNames: ['event_type', 'status', 'tenant_id'],
});

const workflowEventDuration = new Histogram({
  name: 'bidflow_workflow_event_publish_duration_seconds',
  help: 'Duração da publicação de evento',
  labelNames: ['event_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

// Logging estruturado de eventos
this.logger.log('Event published', {
  eventId: event.eventId,
  type: event.type,
  tenantId: event.tenantId,
  aggregateId: event.aggregateId,
  duration: `${duration}ms`,
  routingKey,
});
```

---

## 13. Matriz Completa de Eventos

| Evento | Domain Event | Integration Event | Publisher | Consumidores | Retry | DLQ |
|--------|-------------|-------------------|-----------|-------------|-------|-----|
| WorkflowStarted | ✅ | ✅ | InstanceFactory | Notifications, Analytics | 3x | ✅ |
| StageChanged | ✅ | ✅ | ExecuteTransition | Timeline, Notifications, Bidding | 3x | ✅ |
| ApprovalRequested | ✅ | ✅ | ExecuteTransition | Notifications, Scheduler | 3x | ✅ |
| ApprovalGranted | ✅ | ✅ | ApproveHandler | Workflow Engine, Notifications | 3x | ✅ |
| ApprovalRejected | ✅ | ✅ | RejectHandler | Workflow Engine, Notifications | 3x | ✅ |
| TaskAssigned | ✅ | ✅ | WorkflowTaskFactory | Notifications, CRM Tasks | 3x | ✅ |
| TaskCompleted | ✅ | ✅ | CompleteTaskHandler | Workflow Engine, Timeline | 3x | ✅ |
| WorkflowCompleted | ✅ | ✅ | ExecuteTransition | Bidding, CRM, Notifications | 3x | ✅ |
| WorkflowCancelled | ✅ | ✅ | CancelInstanceHandler | Bidding, Notifications | 3x | ✅ |

---

## 14. Consumer Exemplo (completo)

```typescript
@Injectable()
export class StageChangedConsumer {
  constructor(
    private readonly instanceRepo: WorkflowInstanceRepository,
    private readonly timelineRepo: WorkflowTimelineEntryRepository,
    private readonly idempotency: IdempotencyService,
    private readonly tracing: WorkflowEventTracingService,
    private readonly logger: Logger,
  ) {}

  @RabbitSubscribe({
    exchange: 'bidflow.domain',
    routingKey: '#.workflow.stage.changed',
    queue: 'bidflow.workflow.stage-changed.timeline',
  })
  async onStageChanged(event: CloudEvent): Promise<void> {
    await this.tracing.traceConsume(event, async () => {
      // 1. Idempotência
      if (await this.idempotency.isProcessed(event.id)) return;

      // 2. Processar
      const { instanceId, fromStage, toStage, transitionSlug } = event.data;
      this.logger.log(`Stage changed: ${fromStage} → ${toStage}`, { instanceId });

      // 3. Marcar como processado
      await this.idempotency.markProcessed(event.id);
    });
  }
}
```

A arquitetura de eventos está preparada para microserviços futuros com versionamento, idempotência, outbox pattern, retry com backoff exponencial, DLQ com TTL de 30 dias e tracing via OpenTelemetry.
