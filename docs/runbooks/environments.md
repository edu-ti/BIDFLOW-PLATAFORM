# Runbook: Environments — BidFlow Platform

> **Propósito:** Documentar ambientes, variáveis e configurações.
> **Responsável:** DevOps

---

## 1. Ambientes

| Ambiente | URL | Database | Propósito |
|----------|-----|----------|-----------|
| **Development** | `http://localhost:3001` | Local Docker | Desenvolvimento individual |
| **Staging** | `https://staging.bidflow.com` | Staging PostgreSQL | QA + testes integrados |
| **Production** | `https://app.bidflow.com` | Production PostgreSQL | Operação real |

## 2. Variáveis de Ambiente

```bash
# Obrigatórias
DATABASE_URL=postgresql://user:pass@host:5432/bidflow_db
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672
JWT_SECRET=<secret>
JWT_EXPIRES_IN=15m
NODE_ENV=development|staging|production

# Opcionais
PORT=3001
CORS_ORIGIN=http://localhost:3000
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
LOG_LEVEL=info
```

## 3. Profiles Docker Compose

```bash
# Desenvolvimento (tudo local)
docker compose up -d

# Apenas infraestrutura
docker compose up -d postgres redis rabbitmq

# Com analytics
docker compose --profile analytics up -d
```

## 4. ConfigMap (Kubernetes Futuro)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bidflow-api-config
data:
  NODE_ENV: "production"
  REDIS_HOST: "redis-service"
  RABBITMQ_URL: "amqp://rabbitmq-service:5672"
  LOG_LEVEL: "info"
  CORS_ORIGIN: "https://app.bidflow.com"
```

## 5. Checklist de Ambiente

- [ ] Variáveis de ambiente configuradas
- [ ] Database acessível (`psql` test)
- [ ] Redis acessível (`redis-cli ping`)
- [ ] RabbitMQ acessível ( Management UI )
- [ ] Migrations executadas (`npx prisma migrate deploy`)
- [ ] Health check OK (`curl /health`)
- [ ] Logs sendo emitidos
