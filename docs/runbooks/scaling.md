# Runbook: Scaling — BidFlow Platform

> **Propósito:** Procedimentos de escalabilidade horizontal e vertical.
> **Responsável:** DevOps / SRE

---

## 1. Quando Escalar

| Métrica | Threshold | Ação |
|---------|-----------|------|
| CPU (API) | > 70% por 5 min | Adicionar réplica |
| Memory (API) | > 80% por 5 min | Adicionar réplica |
| Conexões DB | > 80% do pool | Aumentar pool + PgBouncer |
| RabbitMQ queue | > 10.000 msgs | Aumentar consumers |
| Redis memory | > 80% usado | Aumentar maxmemory + cluster |

## 2. Escala Horizontal (API)

```bash
# Kubernetes
kubectl scale deployment bidflow-api --replicas=5

# Docker Compose
docker compose up -d --scale api=3 --scale web=2

# Verificar distribuição
kubectl get pods -l app=bidflow-api
kubectl top pods -l app=bidflow-api
```

## 3. Escala de Workers

```yaml
# docker-compose.yml (workers)
workers:
  auto-transition:
    image: bidflow-api
    command: "node dist/workers/auto-transition.js"
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  notifications:
    image: bidflow-api
    command: "node dist/workers/notifications.js"
    deploy:
      replicas: 5
```

## 4. Escala de Banco

```sql
-- Identificar gargalos
SELECT pg_size_pretty(pg_database_size('bidflow_db'));
SELECT count(*) FROM pg_stat_activity;

-- Aumentar pool de conexões (postgresql.conf)
max_connections = 200
shared_buffers = '4GB'
effective_cache_size = '12GB'

-- PgBouncer config
[databases]
bidflow_db = host=localhost port=5432 dbname=bidflow_db pool_size=50

[pgbouncer]
pool_mode = transaction
max_client_conn = 200
default_pool_size = 50
```

## 5. Health Check Prévio

```bash
# Antes de escalar, verificar capacidade atual
curl http://localhost:3001/health
curl http://localhost:3001/metrics | grep bidflow_requests_total

# Verificar limites
kubectl describe node | grep -A5 "Allocated resources"
df -h /var/lib/postgresql
```
