# Containers — BidFlow Platform

> **Nível C4:** Container (aplicações e armazenamento)
> **Propósito:** Mostrar os containers/aplicações que compõem o BidFlow Platform e suas responsabilidades.

---

## Diagrama de Containers

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          BIDFLOW PLATFORM                                 │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   Web App    │    │   API Core   │    │  Analytics   │               │
│  │  (Next.js)   │───▶│  (NestJS)   │───▶│  (FastAPI)   │               │
│  │  Port 3000   │    │  Port 3001   │    │  Port 3002   │               │
│  └──────────────┘    └──────┬───────┘    └──────┬───────┘               │
│                             │                    │                       │
│                             ▼                    ▼                       │
│  ┌────────────────────────────────────────────────────────┐              │
│  │                    PostgreSQL 16                         │              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │              │
│  │  │ Tenants  │  │  Bidding │  │   CRM    │  │  WF    │ │              │
│  │  │ Schema   │  │  Schema  │  │  Schema  │  │ Schema │ │              │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │              │
│  └────────────────────────────────────────────────────────┘              │
│                             │                                            │
│                             ▼                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │    Redis     │    │   RabbitMQ   │    │  MinIO/S3    │               │
│  │  Cache/Sess  │    │   Event Bus  │    │   Storage    │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Aplicações

### Web App (Next.js 14)
| Atributo | Valor |
|----------|-------|
| **Tecnologia** | Next.js 14 + React 18 + TypeScript |
| **Porta** | 3000 |
| **Responsabilidade** | Interface de usuário, SSR, ISR, Server Components |
| **Pacote** | `@bidflow/web` |
| **Depende de** | API Core (HTTP) |

### API Core (NestJS 10)
| Atributo | Valor |
|----------|-------|
| **Tecnologia** | NestJS 10 + TypeScript + Prisma |
| **Porta** | 3001 |
| **Responsabilidade** | API REST, WebSocket, Webhooks, toda lógica de negócio |
| **Pacote** | `@bidflow/api` |
| **Depende de** | PostgreSQL, Redis, RabbitMQ |

### Analytics (FastAPI)
| Atributo | Valor |
|----------|-------|
| **Tecnologia** | FastAPI + Python 3.11 + SQLAlchemy |
| **Porta** | 3002 |
| **Responsabilidade** | ML, predição, relatórios, detecção de fraude |
| **Pacote** | `@bidflow/analytics` |
| **Depende de** | PostgreSQL, RabbitMQ |

## Pacotes Compartilhados

| Pacote | Tecnologia | Conteúdo |
|--------|-----------|----------|
| `@bidflow/config` | TypeScript + Zod | Schemas de configuração (app, DB, Redis, auth, CORS) |
| `@bidflow/types` | TypeScript | Tipos compartilhados (User, Auction, Bid, ApiResponse) |
| `@bidflow/ui` | React + TypeScript | Componentes UI compartilhados |

## Armazenamento

| Container | Tecnologia | Dados |
|-----------|-----------|-------|
| **PostgreSQL** | 1 instância, schemas por tenant | Todos os dados operacionais |
| **Redis** | Cache + sessões + filas | Cache de queries, sessões JWT, lock |
| **RabbitMQ** | Mensageria | Eventos de domínio, filas de integração |
| **MinIO** | S3-compatible | Documentos, anexos de licitações |
