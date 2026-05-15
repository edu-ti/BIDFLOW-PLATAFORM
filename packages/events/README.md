# @bidflow/events

> Pacote compartilhado de eventos para a arquitetura event-driven do BidFlow Platform.

---

## Visão Geral

Centraliza contratos, payloads, schemas, serializers e utilitários para publish/consume de eventos em toda a plataforma. Abstrai sobre RabbitMQ e Kafka, preparado para event sourcing parcial e replay.

## Estrutura

```
src/
├── contracts/         → CloudEventEnvelope<T>, interfaces base
├── payloads/          → 15+ interfaces de payload tipadas por contexto
├── schemas/           → Zod schemas para validação runtime
├── serializers/       → JSON + Avro (futuro) serializers
├── publishers/        → IEventPublisher, PublishOptions, PublishResult
├── consumers/         → EventHandler, ConsumerConfig, IIdempotencyChecker
├── versioning/        → EventVersionRegistry, extractVersion, baseEventType
├── constants/         → 30+ constantes de tipos de evento
├── tracing/           → OpenTelemetry span attributes, trace propagation
├── observability/     → Métricas, observability entries, processing result
└── utils/             → buildEnvelope, routingKey, eventContext, generateCorrelationId
```

## Uso

```typescript
import { EventTypes } from '@bidflow/events/constants';
import { buildEnvelope, routingKey } from '@bidflow/events/utils';
import { WorkflowStartedPayload } from '@bidflow/events/payloads';
import { IEventPublisher, PublishOptions } from '@bidflow/events/publishers';

const payload: WorkflowStartedPayload = {
  instanceId: 'uuid',
  workflowDefinitionId: 'uuid',
  workflowSlug: 'aprovacao',
  workflowVersion: 1,
  entityType: 'tender.tender',
  entityId: 'uuid',
  title: 'Aprovação RFP #001',
  initialStage: 'rascunho',
  assignedTo: null,
  priority: 'HIGH',
  startedBy: 'uuid',
};

const envelope = buildEnvelope(EventTypes.WORKFLOW_STARTED, payload, {
  tenantId: 'uuid',
  userId: 'uuid',
  source: '/api/v1/workflow/instances',
  subject: payload.instanceId,
});

const key = routingKey(envelope.tenantid, envelope.type);
await publisher.publish(envelope);
```

## Convenções

### Naming

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Event type | `com.bidflow.{context}.{entity}.{action}.v{version}` | `com.bidflow.workflow.stage.changed.v1` |
| Routing key | `{tenantId}.{context}.{entity}.{action}` | `770e...workflow.stage.changed` |
| File name | `kebab-case` | `workflow-stage-changed.ts` |
| Class name | `PascalCase` | `WorkflowStartedEvent` |
| Payload interface | `{EventName}Payload` | `WorkflowStartedPayload` |

### Versioning

- `v1` = active
- `v2` = deprecated (90 dias de paralelismo)
- `v3` = removed
- Breaking: remoção/renomeio de campo → nova versão
- Non-breaking: adição de campo opcional → mesma versão

## Entry Points

```json
{
  "@bidflow/events": "src/index.ts",
  "@bidflow/events/contracts": "src/contracts/cloud-event.ts",
  "@bidflow/events/payloads": "src/payloads/index.ts",
  "@bidflow/events/schemas": "src/schemas/index.ts",
  "@bidflow/events/publishers": "src/publishers/index.ts",
  "@bidflow/events/consumers": "src/consumers/index.ts",
  "@bidflow/events/versioning": "src/versioning/index.ts",
  "@bidflow/events/constants": "src/constants/event-types.ts",
  "@bidflow/events/tracing": "src/tracing/index.ts",
  "@bidflow/events/observability": "src/observability/index.ts",
  "@bidflow/events/utils": "src/utils/index.ts"
}
```
