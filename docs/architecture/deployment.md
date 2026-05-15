# Deployment — BidFlow Platform

> **Nível C4:** Deployment (implantação)
> **Propósito:** Mostrar como o sistema é implantado em desenvolvimento e produção.

---

## Arquitetura de Deployment (Desenvolvimento)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          docker-compose.yml                               │
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │  bidflow-web  │   │ bidflow-api  │   │  analytics   │                │
│  │  Node 20      │   │ Node 20      │   │ Python 3.11  │                │
│  │  Next.js 14   │   │ NestJS 10    │   │ FastAPI      │                │
│  │  :3000        │   │ :3001        │   │ :3002        │                │
│  └──────┬────────┘   └──────┬────────┘   └──────┬────────┘              │
│         │                  │                    │                        │
│         └──────────────────┼────────────────────┘                        │
│                            ▼                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │  PostgreSQL  │   │    Redis     │   │   RabbitMQ   │                │
│  │  16-alpine   │   │  7-alpine    │   │  3.12-alpine │                │
│  │  :5432       │   │  :6379       │   │  :5672      │                │
│  └──────────────┘   └──────────────┘   └──────────────┘                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Estratégia Multi-tenant (Schema-per-tenant)

```
PostgreSQL Instance
├── Schema: public          ← Tabelas globais (tenants, plans, subscriptions)
├── Schema: tenant_{uuid}   ← Schema isolado para cada tenant
│   ├── users, roles, permissions
│   ├── leads, customers, opportunities
│   ├── auctions, bids
│   ├── rfps, proposals, contracts
│   └── workflows, instances, approvals
├── Schema: tenant_{uuid}   ← Outro tenant
└── Schema: tenant_{uuid}   ← Outro tenant
```

## Ambientes

| Ambiente | Infraestrutura | Propósito |
|----------|---------------|-----------|
| **Desenvolvimento** | Docker Compose local | Desenvolvimento individual |
| **Staging** | Docker Compose / k8s | Testes integrados, QA |
| **Produção** | Kubernetes (planejado) | Operação real |

## Estratégia de Deploy (Futuro)

```
Git push → CI/CD (GitHub Actions)
    │
    ├── develop branch → Deploy automático em Staging
    │   ├── Build images Docker
    │   ├── Push para registry
    │   └── Deploy via ArgoCD
    │
    └── main branch → Deploy em Produção (canary)
        ├── 10% traffic → 5 min health check
        ├── 50% traffic → 10 min watch
        └── 100% traffic → promoção automática
```

## Infraestrutura Futura

| Componente | Tecnologia Prevista | Quando |
|-----------|-------------------|--------|
| Orquestração | Kubernetes (EKS / k3s) | 50+ tenants |
| API Gateway | Kong / Apisix | Múltiplos serviços |
| Service Mesh | Istio | Observabilidade avançada |
| Monitoring | Prometheus + Grafana | Desde o início |
| Logging | Loki + Vector | Desde o início |
| Tracing | Jaeger / Tempo | Desde o início |
