# Event-Driven Architecture — BidFlow Platform

> **Propósito:** Documentar arquitetura de eventos, brokers, fluxos e padrões.

---

## Visão Geral

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Publisher    │────→│   RabbitMQ       │────→│   Consumer(s)    │
│  (NestJS)     │     │  bidflow.domain  │     │  (NestJS/Worker) │
│              │     │  (topic)         │     │                  │
│  Aggregate   │     │  tenantId.event  │     │  Idempotent      │
│  → Event     │     │                  │     │  Retry 3x → DLQ  │
└──────────────┘     └──────────────────┘     └──────────────────┘
```

## Domain Events vs Integration Events

| Tipo | Característica | Exemplo |
|------|---------------|---------|
| **Domain Event** | Ocorre dentro do aggregate. Publicado pelo handler após persistência. | `WorkflowStartedEvent` |
| **Integration Event** | Publicado no broker. Consumido por outros contextos. | `TenderCapturedIntegrationEvent` |

## Fluxo de Publicação

```
1. Aggregate executa método de negócio
2. Aggregate adiciona DomainEvent a _domainEvents[]
3. Handler salva aggregate (transação)
4. Handler coleta domain events
5. OutboxService salva eventos na tabela outbox (mesma transação)
6. OutboxService publica no RabbitMQ (fora da transação)
7. Evento entra na fila do consumidor
8. Consumidor verifica idempotência (eventId)
9. Consumidor processa evento
10. Consumidor marca como processado (Redis/DB)
```

## Exchanges RabbitMQ

| Exchange | Type | Routing Key | Propósito |
|----------|------|-------------|-----------|
| `bidflow.domain` | topic | `{tenantId}.{context}.{eventType}` | Eventos de domínio |
| `bidflow.dlx` | direct | `{tenantId}.{context}.{eventType}.retry` | Retry (após falha) |
| `bidflow.dlq` | fanout | — | Dead letter queue |

## Retry Strategy

```yaml
retry:
  max_attempts: 3
  backoff: exponential
  initial_interval: 1s
  multiplier: 2
  max_interval: 60s

  retryable_errors:
    - TIMEOUT
    - SERVICE_UNAVAILABLE
    - DB_CONNECTION_ERROR

  non_retryable_errors:
    - VALIDATION_ERROR
    - ENTITY_NOT_FOUND
    - DUPLICATE_EVENT
```

## Catálogo de Eventos por Contexto

### Auth (3 eventos)
| Evento | Type | Publisher |
|--------|------|-----------|
| `UserLoggedIn` | `com.bidflow.saas.user.logged_in.v1` | AuthService |
| `UserLoggedOut` | `com.bidflow.saas.user.logged_out.v1` | AuthService |
| `PasswordChanged` | `com.bidflow.saas.password.changed.v1` | AuthService |

### Tenant (5 eventos)
| Evento | Type | Publisher |
|--------|------|-----------|
| `TenantRegistered` | `com.bidflow.saas.tenant.registered.v1` | TenantService |
| `TenantActivated` | `com.bidflow.saas.tenant.activated.v1` | TenantService |
| `TenantSuspended` | `com.bidflow.saas.tenant.suspended.v1` | TenantService |
| `SubscriptionChanged` | `com.bidflow.saas.subscription.changed.v1` | SubscriptionService |
| `QuotaExceeded` | `com.bidflow.saas.quota.exceeded.v1` | QuotaService |

### CRM (5 eventos)
| Evento | Type | Publisher |
|--------|------|-----------|
| `LeadCaptured` | `com.bidflow.crm.lead.captured.v1` | LeadService |
| `LeadConverted` | `com.bidflow.crm.lead.converted.v1` | LeadService |
| `OpportunityCreated` | `com.bidflow.crm.opportunity.created.v1` | OpportunityService |
| `OpportunityWon` | `com.bidflow.crm.opportunity.won.v1` | OpportunityService |
| `OpportunityLost` | `com.bidflow.crm.opportunity.lost.v1` | OpportunityService |

### Workflow Engine (7 eventos)
| Evento | Type | Publisher |
|--------|------|-----------|
| `WorkflowStarted` | `com.bidflow.workflow.instance.started.v1` | InstanceFactory |
| `StageChanged` | `com.bidflow.workflow.stage.changed.v1` | ExecuteTransitionHandler |
| `ApprovalRequested` | `com.bidflow.workflow.approval.requested.v1` | ExecuteTransitionHandler |
| `ApprovalGranted` | `com.bidflow.workflow.approval.granted.v1` | ApproveHandler |
| `ApprovalRejected` | `com.bidflow.workflow.approval.rejected.v1` | RejectHandler |
| `TaskAssigned` | `com.bidflow.workflow.task.assigned.v1` | WorkflowTaskFactory |
| `WorkflowCompleted` | `com.bidflow.workflow.instance.completed.v1` | ExecuteTransitionHandler |

### Tender (5 eventos)
| Evento | Type | Publisher |
|--------|------|-----------|
| `TenderCaptured` | `com.bidflow.tender.captured.v1` | TenderService |
| `TenderProposalSubmitted` | `com.bidflow.tender.proposal.submitted.v1` | ProposalService |
| `TenderDisputeBid` | `com.bidflow.tender.dispute.bid.v1` | DisputeService |
| `TenderWon` | `com.bidflow.tender.won.v1` | ResultService |
| `TenderLost` | `com.bidflow.tender.lost.v1` | ResultService |

## Dead Letter Queue (DLQ)

```yaml
dlq:
  exchange: bidflow.dlq.{context}
  queue: dlq.{context}.all
  ttl: 30_days
  alert: P3
  replay: manual (RabbitMQ Management UI)
```

## Observabilidade de Eventos

```promql
# Métricas
rate(bidflow_events_published_total[5m])
rate(bidflow_events_consumed_total[5m])
rate(bidflow_events_dlq_total[1h])

# Alertas
bidflow_events_dlq_total > 0  → P3
bidflow_events_consumer_lag > 1000 → P2
```
