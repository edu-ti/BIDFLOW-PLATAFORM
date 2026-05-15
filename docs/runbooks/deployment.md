# Runbook: Deployment — BidFlow Platform

> **Propósito:** Procedimento de deploy para ambientes de desenvolvimento, staging e produção.
> **Responsável:** DevOps / SRE
> **Frequência:** Sob demanda (múltiplas vezes ao dia)

---

## 1. Ambientes

| Ambiente | URL | Estratégia | Health Check |
|----------|-----|------------|--------------|
| **Development** | `http://localhost:3001` | Docker Compose local | `GET /health` |
| **Staging** | `https://staging.bidflow.com` | Deploy automático ao merge em `develop` | `GET /health` |
| **Production** | `https://app.bidflow.com` | Canary (10% → 50% → 100%) | Métricas RED |

## 2. Pré-requisitos

```bash
# Verificar versões
node --version    # >= 20.x
npm --version     # >= 9.x
docker --version  # >= 24.x
docker compose version  # >= 2.x

# Verificar variáveis de ambiente obrigatórias
required_vars=("DATABASE_URL" "REDIS_HOST" "RABBITMQ_URL" "JWT_SECRET")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then echo "MISSING: $var"; exit 1; fi
done
```

## 3. Deploy — Development

```bash
# 1. Subir infraestrutura
docker compose up -d postgres redis rabbitmq

# 2. Instalar dependências
npm ci

# 3. Gerar Prisma client
npm run db:generate

# 4. Rodar migrations
npm run db:migrate

# 5. Iniciar em modo dev
npm run dev
```

## 4. Deploy — Staging (Automático)

```yaml
# .github/workflows/deploy-staging.yml
# Trigger: push to develop
# Pipeline: build → test → docker build → push → deploy via ArgoCD
```

## 5. Deploy — Production (Canary)

```yaml
canary:
  stages:
    - percentage: 10
      duration: 5m
      watch:
        - error_rate < 1%
        - p95_latency < 2s
        - health_check = pass

    - percentage: 50
      duration: 10m
      watch:
        - error_rate < 0.5%
        - p95_latency < 1.5s

    - percentage: 100
      duration: 0
      promotion: auto
```

## 6. Pós-deploy

```bash
# 1. Verificar health check
curl -f http://localhost:3001/health

# 2. Verificar migrations
curl http://localhost:3001/health | jq '.database'

# 3. Verificar workers
curl http://localhost:3001/health | jq '.rabbitmq'

# 4. Verificar métricas
curl http://localhost:3001/metrics | grep bidflow_requests_total
```

## 7. Troubleshooting de Deploy

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| Build falha | dependências corrompidas | `rm -rf node_modules && npm ci` |
| Migration falha | schema desatualizado | `npm run db:push` ou revert |
| Health check falha | env vars ausentes | Verificar `.env` |
| Canary reject | error rate > 1% | `kubectl rollout undo deployment/api` |
