# Runbook: Observability — BidFlow Platform

> **Propósito:** Procedimentos de monitoramento, métricas, logs e tracing.
> **Responsável:** SRE / DevOps
> **Stack:** Prometheus + Grafana + OpenTelemetry + Pino Logger

---

## 1. Dashboards (Grafana)

| Dashboard | Descrição | Refresh |
|-----------|-----------|---------|
| **BidFlow — RED Metrics** | Rate, Errors, Duration por endpoint | 1 min |
| **BidFlow — Tenants** | Tenants ativos por plano, provisioning | 5 min |
| **BidFlow — Workflows** | Instâncias ativas, transições, approvals | 1 min |
| **BidFlow — CRM** | Leads, conversão, pipeline | 5 min |
| **BidFlow — Database** | Conexões, slow queries, tamanho | 1 min |
| **BidFlow — RabbitMQ** | Filas, consumers, mensagens em DLQ | 1 min |

## 2. Métricas RED (Rate, Errors, Duration)

```promql
# Rate de requisições por endpoint
sum(rate(http_requests_total[5m])) by (method, path, status)

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# p95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

## 3. Métricas de Negócio

```promql
# Tenants ativos
bidflow_tenants_active

# Workflows ativos
sum(bidflow_wf_instances_active) by (workflow_slug)

# Leads capturados
rate(bidflow_crm_leads_total[24h])

# Licitações vencidas
rate(bidflow_tenders_total{status="won"}[30d])
```

## 4. Logs Estruturados (JSON)

```json
// Formato padrão de log
{
  "level": "info",
  "message": "Transition executed",
  "timestamp": "2026-05-15T10:00:00.000Z",
  "tenantId": "uuid",
  "userId": "uuid",
  "instanceId": "uuid",
  "transition": "avancar",
  "duration": 42,
  "correlationId": "uuid"
}
```

## 5. Alertas Críticos (P1)

| Alerta | Condição | Ação |
|--------|----------|------|
| **ApiDown** | Health check falha 3x | Rollback imediato |
| **HighErrorRate** | error_rate > 5% em 5 min | Rollback ou feature flag |
| **HighLatency** | p95 > 3s em 5 min | Verificar DB + Redis |
| **DbConnectionsHigh** | conexões > 80% do pool | Verificar slow queries |
| **QueueBacklog** | RabbitMQ fila > 10000 | Escalar consumers |

## 6. Alertas de Negócio (P2/P3)

| Alerta | Condição | Ação |
|--------|----------|------|
| **TenderClosingSoon** | closingDate < 24h | Notificar equipe |
| **WorkflowOverdue** | deadlineAt < now() | Reatribuir tarefa |
| **LowConversion** | lead_conv_rate < 10% | Revisar processo |
| **QuotaExceeded** | quota > 90% | Notificar tenant |

## 7. Distributed Tracing (OpenTelemetry)

```yaml
tracing:
  exporter: OTLP (Jaeger / Grafana Tempo)
  sampling_rate: 0.5 (50% das requisições)
  attributes:
    - tenant.id
    - user.id
    - http.method
    - http.url
    - db.system
    - messaging.system
```

## 8. Health Checks

```bash
# Verificar todos os serviços
curl http://localhost:3001/health
# Response: { "status": "ok", "database": "ok", "redis": "ok", "rabbitmq": "ok" }

curl http://localhost:3002/health
# Response: { "status": "healthy", "service": "analytics" }
```
