# Runbook: Rollback — BidFlow Platform

> **Propósito:** Procedimento de rollback para cada ambiente.
> **Responsável:** DevOps / SRE
> **Tempo alvo:** < 10 min para detectar e reverter

---

## 1. Critérios para Rollback Imediato

| Critério | Threshold | Severidade |
|----------|-----------|------------|
| Error rate | > 1% em 5 min | **P1** |
| p95 latency | > 3s em 5 min | **P1** |
| Health check | 3 falhas consecutivas | **P1** |
| Bug crítico | Qualquer usuário afetado | **P1** |

## 2. Rollback — Deployment

```bash
# Identificar versão atual e anterior
kubectl rollout history deployment/api
kubectl rollout history deployment/web

# Rollback para versão anterior
kubectl rollout undo deployment/api
kubectl rollout undo deployment/web

# Verificar status
kubectl rollout status deployment/api
kubectl rollout status deployment/web
```

## 3. Rollback — Migration

```bash
# 1. Identificar migration problemática
npx prisma migrate status

# 2. Reverter migration
npx prisma migrate resolve --rolled-back "migration_name"

# 3. Se necessário, restaurar backup
pg_restore -d bidflow_db /backups/pre-deploy.dump
```

## 4. Rollback — RabbitMQ

```bash
# Republicar eventos da outbox (caso necessário)
# Acessar fila DLQ e reenfileirar
rabbitmqadmin get queue=dlq.workflow.all requeue=true

# Ou limpar filas problemáticas
rabbitmqadmin purge queue name=bidflow.workflow.stage-changed
```

## 5. Pós-rollback

```bash
# 1. Verificar health
curl -f http://localhost:3001/health

# 2. Verificar métricas
curl http://localhost:3001/metrics | grep error_total

# 3. Notificar equipe
# Slack / Email / On-call
```

## 6. Checklist de Rollback

- [ ] Causa identificada
- [ ] Versão anterior identificada
- [ ] Rollback executado
- [ ] Health check OK
- [ ] Erro zero por 5 min
- [ ] Notificação enviada
- [ ] Post-mortem agendado
