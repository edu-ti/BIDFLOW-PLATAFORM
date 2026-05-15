# Components — BidFlow Platform

> **Nível C4:** Component (módulos internos da API Core)
> **Propósito:** Mostrar bounded contexts e componentes do NestJS.

---

## Diagrama de Componentes (API Core)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         API CORE (NestJS 10)                              │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │     Auth     │  │    Tenant    │  │     CRM      │  │   Bidding    │ │
│  │  Bounded     │  │  Bounded     │  │  Bounded     │  │  Bounded     │ │
│  │  Context     │  │  Context     │  │  Context     │  │  Context     │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                  │                 │         │
│         └─────────────────┼──────────────────┼─────────────────┘         │
│                           ▼                  ▼                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │   Workflow       │  │    Tender        │  │      ERP        │       │
│  │   Engine         │  │  (Licitações)    │  │   (Financeiro)  │       │
│  │   Bounded        │  │   Bounded        │  │    Bounded      │       │
│  │   Context        │  │   Context        │  │    Context      │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    Cross-Cutting Concerns                           │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │  │
│  │  │ Guards │ │Filters │ │Intercpt│ │ Middle │ │  Pipes  │          │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Bounded Contexts (API Core)

| Contexto | Módulo NestJS | Prioridade | Aggregate Roots |
|----------|--------------|------------|-----------------|
| **Auth** | `AuthModule` | Core | User, Session, Role, ApiKey |
| **Tenant** | `TenantModule` | Core | Tenant, Plan, Subscription, Invoice |
| **CRM** | `CrmModule` | Supporting | Lead, Customer, Pipeline, Opportunity, Task |
| **Bidding** | `BiddingModule` | Core | Auction, Bid (legado) |
| **Workflow Engine** | `WorkflowModule` | Supporting | WorkflowDefinition, WorkflowInstance, Approval |
| **Tender** | `TenderModule` | Core Domain | Tender, TenderProposal, TenderDispute, TenderResult |
| **ERP** | `ErpModule` | Supporting | Supplier, BudgetAllocation, Invoice |

## Arquitetura por Contexto (Clean Architecture)

```
{context}/
├── domain/           # Entidades, VOs, interfaces, regras de negócio
│   └── ({aggregate}.entity.ts, *.repository.ts, events/)
├── application/      # Casos de uso, commands, queries, handlers, DTOs
│   └── (commands/, queries/, dto/, services/)
├── infrastructure/   # Prisma, RabbitMQ, controllers, mappers
│   └── (controllers/, persistence/, event-publishers/)
├── api/              # Controllers REST, guards, filters, DTOs HTTP
│   └── (controllers/, dto/, guards/, filters/)
└── {context}.module.ts
```

## Fluxo de Dados entre Contextos

```
[Tender] ──evento──▶ [Workflow Engine] ──evento──▶ [Notifications]
    │                                                      │
    │                                                      ▼
    └──evento──▶ [CRM]                              [Email/Push/SMS]
```

## Estratégia de Comunicação

| Tipo | Mecanismo | Casos de uso |
|------|-----------|--------------|
| **Síncrono** | REST (NestJS controllers) | CRUD, queries, commands imediatos |
| **Assíncrono** | RabbitMQ (eventos) | Reações em cascata, notificações |
| **Streaming** | WebSocket | Disputas em tempo real, notificações push |
| **Dados massivos** | Banco compartilhado (read-only) | Analytics, relatórios |
