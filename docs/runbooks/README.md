# Runbooks — BidFlow Platform

> **Propósito:** Procedimentos operacionais padronizados para operação SaaS enterprise.
> **Responsável:** DevOps / SRE
> **Atualização:** 2026-05-15

---

## Estrutura

| Runbook | Descrição | Público | Prioridade |
|---------|-----------|---------|------------|
| [`deployment.md`](./deployment.md) | Deploy em dev/staging/production | DevOps | Alta |
| [`rollback.md`](./rollback.md) | Rollback de versão, migration, dados | DevOps/SRE | **Crítica** |
| [`database-recovery.md`](./database-recovery.md) | Recovery de schema/banco completo | DBA/SRE | **Crítica** |
| [`backups.md`](./backups.md) | Backup full, WAL, tenant | DevOps | Alta |
| [`incident-response.md`](./incident-response.md) | Fluxo de resposta a incidentes | Time todo | **Crítica** |
| [`observability.md`](./observability.md) | Dashboards, métricas, logs, tracing | SRE | Alta |
| [`troubleshooting.md`](./troubleshooting.md) | Diagnóstico rápido de problemas comuns | Devs/DevOps | Alta |
| [`workers.md`](./workers.md) | Workers, filas, schedulers | Backend/DevOps | Média |
| [`scaling.md`](./scaling.md) | Escalabilidade horizontal/vertical | DevOps/SRE | Média |
| [`environments.md`](./environments.md) | Ambientes, configurações, variáveis | DevOps | Média |
| [`monitoring.md`](./monitoring.md) | Monitoramento ativo, health checks | SRE | Alta |
| [`alerts.md`](./alerts.md) | Catálogo de alertas e thresholds | SRE | Alta |
| [`disaster-recovery.md`](./disaster-recovery.md) | DR plan, RTO/RPO, failover | SRE | **Crítica** |

## SLA Targets

| Métrica | Target | Monitor |
|---------|--------|---------|
| **Uptime** | 99.9% (8.76h downtime/ano) | Health check |
| **API Latency (p95)** | < 500ms | Prometheus |
| **API Error Rate** | < 0.1% | Prometheus |
| **Recovery Time (RTO)** | < 30 min | Incident response |
| **Recovery Point (RPO)** | < 5 min | Backup/WAL |
| **Incident Response (P1)** | < 15 min | PagerDuty |

## Canais de Comunicação

| Canal | Uso |
|-------|-----|
| `#incidentes` (Slack) | Coordenação de incidentes |
| `#alerts` (Slack) | Alertas automáticos (Grafana) |
| `#deploy` (Slack) | Notificações de deploy |
| PagerDuty | On-call rotation (P1/P2) |
| Status page | Status público (planejado) |

## Contatos de Plantão

| Função | Responsável | Cobertura |
|--------|-------------|-----------|
| SRE / DevOps | On-call PagerDuty | 24/7 |
| Backend Lead | Tech Lead | Horário comercial |
| Database | DBA | Horário comercial |
| Segurança | Security Team | Horário comercial |

## Convenções

- **Severidade:** P1 (crítico) < 15 min / P2 (alto) < 1h / P3 (médio) < 24h
- **Post-mortem:** Obrigatório para P1/P2, prazo de 24h
- **Runbook update:** Atualizar após todo incidente
- **Teste de recovery:** Mensal (restore de backup em ambiente de teste)
- **DR test:** Trimestral (failover completo)
