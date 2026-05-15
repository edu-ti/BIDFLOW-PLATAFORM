# Escalabilidade — BidFlow Platform

> **Propósito:** Documentar estratégias de escalabilidade para crescimento SaaS enterprise.

---

## Cenários de Carga

| Cenário | Tenants | Usuários | Workflows/dia | Requisições/s |
|---------|---------|----------|---------------|---------------|
| **Atual** | 1-10 | 50-500 | 100 | 10 |
| **Crescimento** | 50-200 | 1K-10K | 5K | 100 |
| **Enterprise** | 1K-5K | 50K-500K | 100K | 1K |
| **Hiper-escala** | 10K+ | 1M+ | 1M+ | 10K+ |

## Gargalos Identificados

| Componente | Gargalo | Impacto | Mitigação |
|-----------|---------|---------|-----------|
| **PostgreSQL** | Schemas por tenant (muitos schemas) | Consultas ao `information_schema` lentas | Pool de conexões, PgBouncer |
| **Prisma** | Geração de cliente + pool | Consumo de memória | Pool por schema, lazy loading |
| **RabbitMQ** | Filas por tenant | Gerenciamento de exchanges | Routing key, não fila por tenant |
| **Redis** | Cache de sessão + rate limit | Memória | Cluster Redis, TTL agressivo |
| **NestJS** | CPU-bound em handlers | Latência | Cluster mode, workers |

## Estratégias de Escala

### 1. Database: Schema-per-Tenant + Pool

```
Problema: 5.000 schemas em 1 instância PostgreSQL
Solução:
├── PgBouncer para pool de conexões
├── Particionamento de tabelas append-only (timeline, logs)
├── Índices GIN para campos JSON (data, metadata)
├── VACUUM tuning por tabela
└── Leitura em réplicas para relatórios
```

### 2. API: Stateless Horizontal Scale

```
Problema: 1 instância NestJS
Solução:
├── Deploy com múltiplas réplicas (k8s)
├── Rate limiting distribuído (Redis)
├── Cache de queries (Redis, TTL por query)
├── Sessões em Redis (não em memória)
└── Health check + readiness probe
```

### 3. Eventos: RabbitMQ + Consumers

```
Problema: Workers sobrecarregados
Solução:
├── Múltiplos consumers por fila (concorrência)
├── Dead letter + retry com backoff
├── Filas separadas por prioridade
└── Auto-scaling de workers (k8s HPA)
```

### 4. Cache: Redis em Cluster

```
Problema: Cache local não escala
Solução:
├── Redis Cluster (sharding automático)
├── TTL por tipo de cache
│   ├── tenant lookup: 5 min
│   ├── user profile: 1 min
│   └── query cache: 30-300s
├── Prefixo por tenant
└── Invalidação por evento
```

## Plano de Migração para Microservices (Futuro)

```
Fase 1 — Monólito Modular (atual)
  ├── API Core (NestJS) com bounded contexts em módulos
  └── Analytics (FastAPI) separado

Fase 2 — Contextos em Serviços Separados (planejado)
  ├── Auth Service
  ├── Tenant Service
  ├── Workflow Service
  ├── Tender Service
  ├── CRM Service
  └── API Gateway (Kong / Apisix)

Fase 3 — Event Sourcing Parcial (planejado)
  ├── Event Store (EventStoreDB / PostgreSQL)
  ├── CQRS com projeções
  ├── Replay de eventos
  └── Sagas coreografadas
```

## Recomendações para 10K+ Tenants

```yaml
database:
  pgBouncer: true
  connection_pool: 200
  replicas:
    - primary (write)
    - replica-1 (read, reports)
    - replica-2 (read, analytics)
  partitioning:
    - workflow_timeline_events: monthly
    - workflow_transition_logs: monthly
    - audit_logs: monthly

cache:
  redis_cluster: true
  nodes: 3
  max_memory: 4GB

workers:
  auto_transition:
    concurrency: 5
    max_queue: 10000
  notifications:
    concurrency: 10

monitoring:
  sampling: 0.1  # 10% em hiper-escala
  logs_retention: 7d
  metrics_retention: 30d
```
