# Runbook: Monitoring — BidFlow Platform

> **Propósito:** Procedimentos de monitoramento ativo e health checks.
> **Responsável:** SRE

---

## 1. Health Checks

```bash
# API principal
curl -f http://localhost:3001/health
# Response: {"status":"ok","database":"ok","redis":"ok","rabbitmq":"ok","uptime":12345}

# Analytics
curl -f http://localhost:3002/health
# Response: {"status":"healthy","service":"analytics"}

# Web App
curl -f http://localhost:3000/api/health
```

## 2. Endpoints de Health Check

| Endpoint | Serviço | Verifica |
|----------|---------|----------|
| `GET /health` | API Core | DB + Redis + RabbitMQ |
| `GET /health/db` | API Core | Conexão PostgreSQL |
| `GET /health/redis` | API Core | Conexão Redis |
| `GET /health/rabbitmq` | API Core | Conexão RabbitMQ |
| `GET /health` | Analytics | DB + serviços internos |

## 3. Liveness & Readiness (Kubernetes)

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 4. Checklist Diário

```bash
# 1. Verificar health de todos os serviços
for svc in api web analytics; do
  curl -f "http://localhost:3001/health" && echo "$svc OK" || echo "$svc FAIL"
done

# 2. Verificar disco
df -h | grep -E "(postgres|redis|/data)"

# 3. Verificar backups recentes
ls -la /backups/daily/ | tail -5

# 4. Verificar filas RabbitMQ
rabbitmqadmin list queues name messages | grep -v "^$"

# 5. Verificar conexões de banco
psql -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```
