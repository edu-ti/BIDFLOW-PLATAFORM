# Runbook: Alerts — BidFlow Platform

> **Propósito:** Catálogo completo de alertas, thresholds e ações.
> **Responsável:** SRE

---

## 1. P1 — Critical (Resposta Imediata)

| Alerta | Condição | Janela | Ação | Canal |
|--------|----------|--------|------|-------|
| **ApiDown** | Health check falha 3x consecutivas | 30s | Rollback imediato | PagerDuty + Slack |
| **ApiHighErrorRate** | `error_rate > 5%` | 5 min | Rollback ou feature flag | PagerDuty + Slack |
| **ApiHighLatency** | `p95_latency > 3s` | 5 min | Verificar DB + Redis | PagerDuty + Slack |
| **DbDown** | PostgreSQL não responde | 10s | Failover | PagerDuty + Slack |
| **DataLoss** | WAL archive fails | 5 min | Restore backup | PagerDuty + Slack |

## 2. P2 — High (Resposta em 1h)

| Alerta | Condição | Janela | Ação | Canal |
|--------|----------|--------|------|-------|
| **DbConnectionsHigh** | `connections > 80%` | 5 min | Aumentar pool | Slack |
| **RedisMemoryHigh** | `used_memory > 80%` | 5 min | Aumentar maxmemory | Slack |
| **QueueBacklog** | `messages > 10.000` | 5 min | Escalar consumers | Slack |
| **ProvisioningFail** | `provisioning_failures > 0` | 1h | Reprovisionar tenant | Slack |
| **CertExpiring** | `SSL cert < 7 days` | — | Renew cert | Slack |

## 3. P3 — Medium (Resposta em 24h)

| Alerta | Condição | Janela | Ação | Canal |
|--------|----------|--------|------|-------|
| **EventsInDLQ** | `DLQ message count > 0` | 1h | Reprocessar | Slack |
| **QuotaExceeded** | `quota_usage > 90%` | 1h | Notificar tenant | Slack |
| **WorkflowOverdue** | `overdue_instances > 100` | 1h | Reatribuir tarefas | Slack |
| **SlowQuery** | `query_time > 1s` | 5 min | Otimizar índice | Slack |
| **DiskUsageHigh** | `disk > 85%` | 5 min | Limpar logs/backups | Slack |
| **TenderClosingSoon** | `closingDate < 24h` | 1h | Notificar equipe | Slack |
| **LowConversion** | `lead_conv < 10%` | 7d | Revisar processo | Slack |

## 4. Configuração Prometheus

```yaml
# alerts.yml
groups:
  - name: bidflow-p1
    rules:
      - alert: ApiDown
        expr: probe_success{job="api"} == 0
        for: 30s
        labels: { severity: critical }
        annotations:
          summary: "API is down"
          runbook: "docs/runbooks/rollback.md"

  - name: bidflow-p2
    rules:
      - alert: DbConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        labels: { severity: high }
        annotations:
          summary: "Database connections > 80%"
          runbook: "docs/runbooks/scaling.md"
```

## 5. Resolvedores Designados

| Alerta | Resolvedor | Escalação |
|--------|-----------|-----------|
| ApiDown | DevOps (on-call) | Tech Lead |
| DbDown | DBA | DevOps Lead |
| DataLoss | DBA + SRE | CTO |
| SecurityBreach | Security Team | CTO |
