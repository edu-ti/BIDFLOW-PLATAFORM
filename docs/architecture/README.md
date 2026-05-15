# Arquitetura — BidFlow Platform

> **Modelo:** C4 (Context → Container → Component → Code)
> **Versão:** 1.0.0
> **Última atualização:** 2026-05-15

---

## Índice da Arquitetura

| Documento | Nível C4 | Descrição |
|-----------|----------|-----------|
| [`system-context.md`](./system-context.md) | **Context (L1)** | Visão geral do sistema, atores, sistemas externos |
| [`containers.md`](./containers.md) | **Container (L2)** | Aplicações, pacotes, armazenamento, infraestrutura |
| [`components.md`](./components.md) | **Component (L3)** | Bounded contexts, módulos NestJS, camadas |
| [`deployment.md`](./deployment.md) | **Deployment** | Deploy, ambientes, schema-per-tenant, canary |
| [`integrations.md`](./integrations.md) | **Integrações** | Matriz entre contextos, eventos, filas, WebSocket |
| [`technology-stack.md`](./technology-stack.md) | **Stack** | Tecnologias, versões, justificativas |
| [`bounded-contexts.md`](./bounded-contexts.md) | **DDD** | Mapa de contextos, relações, linguagem ubíqua |
| [`multi-tenant.md`](./multi-tenant.md) | **Cross-cutting** | Estratégia schema-per-tenant, isolamento |
| [`event-driven.md`](./event-driven.md) | **Cross-cutting** | Arquitetura de eventos, brokers, fluxos |
| [`security.md`](./security.md) | **Cross-cutting** | Autenticação, autorização, guards, compliance |
| [`observability.md`](./observability.md) | **Cross-cutting** | Logs, métricas, tracing, alertas |
| [`scalability.md`](./scalability.md) | **Cross-cutting** | Estratégias de escala, gargalos, futuro |

## Stack Resumido

```
Frontend:  Next.js 14 + React 18 + TypeScript
API:       NestJS 10 + TypeScript + Prisma 5
Analytics: FastAPI + Python 3.11 + SQLAlchemy
Database:  PostgreSQL 16 (schema-per-tenant)
Cache:     Redis 7
Broker:    RabbitMQ 3.12
Monorepo:  Turborepo + npm workspaces
```

## Bounded Contexts (atuais + planejados)

| Contexto | Status | Módulo NestJS | Prioridade |
|----------|--------|---------------|------------|
| Auth | ✅ Implementado | `AuthModule` | Core |
| Tenant | ✅ Spec | `TenantModule` | Core |
| CRM | ✅ Spec + Arquitetura | `CrmModule` | Supporting |
| Workflow Engine | ✅ Implementado | `WorkflowModule` | Generic |
| Tender (Licitações) | 📋 Spec | `TenderModule` | Core Domain |
| ERP/Financeiro | 📋 Planejado | `ErpModule` | Supporting |
| IA/Analytics | 📋 Planejado | `AiModule` | Supporting |
| Notifications | 📋 Planejado | `NotificationModule` | Generic |

## Convenções

- **Código:** TypeScript first, DDD, Clean Architecture
- **Eventos:** CloudEvents 1.0, RabbitMQ, domain → integration
- **Banco:** PostgreSQL schema-per-tenant, Prisma ORM
- **Testes:** Jest + Supertest, TDD, coverage > 80%
- **Documentação:** Spec-Driven (YAML) → Arquitetura (MD) → ADR
