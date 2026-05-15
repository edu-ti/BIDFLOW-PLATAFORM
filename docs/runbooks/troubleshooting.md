# Runbook: Troubleshooting — BidFlow Platform

> **Propósito:** Guia rápido de diagnóstico e solução de problemas comuns.
> **Responsável:** Time de desenvolvimento / DevOps

---

## 1. API — Erros Comuns

| Erro | Causa | Diagnóstico | Solução |
|------|-------|------------|---------|
| **401 Unauthorized** | Token ausente/expirado | Verificar `Authorization` header | Refresh token ou login |
| **403 Forbidden** | Sem permissão | Verificar RBAC do usuário | Atribuir role correta |
| **404 Not Found** | Entidade não existe | Verificar ID + tenantId | Confirmar dados |
| **422 Unprocessable** | Regra de negócio violada | Ler `code` no response | Seguir regra do domínio |
| **429 Too Many Requests** | Rate limit excedido | Verificar `Retry-After` header | Aguardar e retentar |
| **500 Internal Server** | Erro não tratado | Verificar logs | Reportar ao time |

## 2. Database — Problemas Comuns

| Problema | Diagnóstico | Solução |
|----------|-------------|---------|
| Conexões esgotadas | `SELECT count(*) FROM pg_stat_activity` | Aumentar `max_connections` ou fechar conexões ociosas |
| Query lenta | `EXPLAIN ANALYZE` na query | Adicionar índice ou reescrever query |
| Deadlock | `SELECT * FROM pg_locks WHERE granted = false` | Matar processo: `SELECT pg_terminate_backend(pid)` |
| Tabela bloat | `SELECT pg_size_pretty(pg_total_relation_size('table'))` | `VACUUM FULL` ou `REINDEX` |
| Migration falha | `npx prisma migrate status` | `prisma migrate resolve --rolled-back` |

## 3. Redis — Problemas Comuns

```bash
# Verificar uso de memória
redis-cli info | grep used_memory_human

# Verificar chaves por padrão
redis-cli --bigkeys

# Limpar cache de tenant específico
redis-cli KEYS "tenant_uuid:*" | xargs redis-cli DEL

# Verificar taxa de acerto (hit rate)
redis-cli info stats | grep keyspace_hits
```

## 4. RabbitMQ — Problemas Comuns

```bash
# Verificar filas com backlog
rabbitmqadmin list queues name messages

# Verificar consumers ausentes
rabbitmqadmin list consumers

# Resetar conexão (emergência)
rabbitmqadmin close connection name=<connection_name>

# Mover da DLQ para fila original
rabbitmqadmin get queue=dlq.workflow.all requeue=true count=50
```

## 5. Prisma — Problemas Comuns

```bash
# Schema desatualizado
npx prisma generate    # Regenerar client
npx prisma db push     # Sincronizar schema

# Migration pendente
npx prisma migrate dev --name descricao

# Reset de database (local apenas!)
npx prisma migrate reset --force
```

## 6. Docker — Problemas Comuns

```bash
# Container não inicia
docker compose logs api

# Porta já em uso
netstat -ano | findstr :3001

# Volume corrompido
docker compose down -v && docker compose up -d

# Pouco espaço em disco
docker system prune -af
```

## 7. Autenticação — Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| Login falha | Credenciais inválidas | Reset de senha |
| Token expirado | Access token > 15 min | Usar refresh token |
| Tenant mismatch | Header `x-tenant-id` diferente do JWT | Verificar header |
| Sessão revogada | Admin revogou | Novo login |

## 8. Performance — Checklist Rápido

```bash
# 1. Verificar CPU/memória
docker compose stats

# 2. Verificar queries lentas
SELECT query, calls, total_time / calls AS avg_time
FROM pg_stat_statements
ORDER BY total_time DESC LIMIT 10;

# 3. Verificar conexões ativas
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

# 4. Verificar tamanho do banco
SELECT pg_size_pretty(pg_database_size('bidflow_db'));

# 5. Verificar cache Redis
redis-cli info stats | grep keyspace_hits_rate
```

## 9. Contatos de Plantão

| Função | Responsável | Contato |
|--------|-------------|---------|
| DevOps/SRE | Plantão PagerDuty | on-call@bidflow.com |
| Backend Lead | [Nome] | [Slack/Email] |
| Database | [Nome] | [Slack/Email] |
| Segurança | [Nome] | [Slack/Email] |
