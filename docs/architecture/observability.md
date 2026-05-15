# Observabilidade — BidFlow Platform

> **Propósito:** Documentar estratégia de logs, métricas, tracing e alertas.

---

## Pilha de Observabilidade

| Componente | Tecnologia | Função |
|-----------|-----------|--------|
| **Logs** | Pino / Logger NestJS | Logging estruturado JSON |
| **Métricas** | Prometheus + @nestjs/metrics | Métricas RED + negócio |
| **Tracing** | OpenTelemetry | Distributed tracing |
| **Dashboards** | Grafana | Visualização |
| **Alertas** | Grafana Alerting / PagerDuty | Notificações |
| **Agregação de logs** | Loki (planejado) | Centralização de logs |

## Logging Estruturado

```json
{
  "level": "info",
  "message": "Transition executed",
  "timestamp": "2026-05-15T10:00:00.000Z",
  "tenantId": "770e8400-e29b-41d4-a716-446655440000",
  "userId": "880e8400-e29b-41d4-a716-446655440000",
  "instanceId": "990e8400-e29b-41d4-a716-446655440000",
  "transition": "avancar",
  "duration": 42,
  "correlationId": "aa0e8400-e29b-41d4-a716-446655440000"
}
```

### Níveis

| Nível | Uso |
|-------|-----|
| `debug` | Desenvolvimento — não ligado em produção |
| `info` | Operações de negócio concluídas |
| `warn` | Comportamento inesperado não-crítico |
| `error` | Falha em operação, exceção não tratada |

### Campos Sensíveis (NUNCA logar)

```
password, passwordHash, token, accessToken, refreshToken,
mfaSecret, mfaCode, apiKey, keyHash, secret, authorization,
creditCard, taxId (em logs não-anonimizados)
```

## Métricas (Prometheus)

### RED Metrics (Rate, Errors, Duration)

```promql
# Rate por endpoint
sum(rate(http_requests_total[5m])) by (method, path)

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m])) * 100

# p95 latency
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

### Métricas de Negócio

```promql
bidflow_tenants_active                    # Tenants ativos
bidflow_wf_instances_active               # Workflows ativos
bidflow_crm_leads_total                   # Leads (por status)
bidflow_tenders_total{status="won"}       # Licitações vencidas
bidflow_events_published_total            # Eventos publicados
```

### Métricas Técnicas

```promql
pg_connection_count                       # Conexões PostgreSQL
redis_memory_used_bytes                   # Memória Redis
rabbitmq_queue_messages                   # Mensagens em fila
```

## Tracing (OpenTelemetry)

```yaml
tracing:
  exporter: OTLP (Jaeger / Grafana Tempo)
  sampling: 0.5  # 50% das requisições em produção

  attributes:
    - tenant.id
    - user.id
    - http.method
    - http.url
    - db.system
    - messaging.system

  spans:
    - HTTP request
    - Command/Query handler
    - Repository operation
    - Event publish/consume
    - External API call
```

## Alertas

### P1 — Crítico (resposta imediata)

| Alerta | Condição | Canal |
|--------|----------|-------|
| ApiDown | Health check falha 3x | PagerDuty + Slack |
| HighErrorRate | error_rate > 5% em 5 min | PagerDuty + Slack |
| HighLatency | p95 > 3s em 5 min | Slack |

### P2 — Alto (resposta em 1h)

| Alerta | Condição | Canal |
|--------|----------|-------|
| DbConnectionsHigh | conexões > 80% | Slack |
| QueueBacklog | fila > 10000 mensagens | Slack |
| TenantProvisioningFailure | provisioning falha | Slack |

### P3 — Médio (resposta em 24h)

| Alerta | Condição | Canal |
|--------|----------|-------|
| EventsInDLQ | DLQ > 0 | Slack |
| QuotaExceeded | quota > 90% | Slack |
| WorkflowOverdue | deadline vencido | Slack |

## Dashboards (Grafana)

| Dashboard | Métricas | Responsável |
|-----------|----------|-------------|
| **BidFlow — RED** | Rate, Errors, Duration por endpoint | SRE |
| **BidFlow — Business** | Tenants, workflows, tenders | PM |
| **BidFlow — Database** | Conexões, slow queries, tamanho | DBA |
| **BidFlow — RabbitMQ** | Filas, consumers, DLQ | DevOps |
| **BidFlow — Tenants** | Ativos, provisionamento, quotas | SRE |
