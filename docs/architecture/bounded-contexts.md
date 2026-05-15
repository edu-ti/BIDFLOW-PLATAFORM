# Bounded Contexts — BidFlow Platform

> **Propósito:** Mapear todos os bounded contexts, suas responsabilidades, relações e linguagem ubíqua.

---

## Mapa de Contextos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BIDFLOW PLATFORM                            │
│                                                                          │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │      Tender         │◀───event──▶│  Workflow Engine   │                │
│  │   (Core Domain)     │         │   (Generic)         │                │
│  │   Licitações        │◀───event──▶│  Approvals, Stages │                │
│  └─────────┬───────────┘         └─────────────────────┘                │
│            │                                                             │
│            ▼                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │        CRM          │         │   ERP/Financeiro    │                │
│  │   (Supporting)      │◀───────▶│   (Supporting)      │                │
│  │   Leads, Oportun.   │         │   Suppliers, NFs    │                │
│  └─────────────────────┘         └─────────────────────┘                │
│            │                                                             │
│            ▼                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │    Notifications    │         │     IA/Analytics    │                │
│  │   (Generic)         │◀────────│   (Supporting)      │                │
│  │   Email, Push, SMS  │         │   ML, Predição     │                │
│  └─────────────────────┘         └─────────────────────┘                │
│                                                                          │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │       Auth          │         │      Tenant         │                │
│  │   (Core)            │─────────│   (Core)            │                │
│  │   JWT, RBAC, MFA    │         │   Multi-tenant      │                │
│  └─────────────────────┘         └─────────────────────┘                │
└──────────────────────────────────────────────────────────────────────────┘
```

## Detalhamento por Contexto

### Auth (Core)
| Atributo | Valor |
|----------|-------|
| **Responsabilidade** | Autenticação, autorização, RBAC, ACL, sessões, MFA |
| **Aggregates** | User, Session, Role, ApiKey |
| **Tecnologia** | NestJS, JWT RS256, Redis |
| **Eventos** | `UserLoggedIn`, `PermissionDenied` |
| **Depende de** | Tenant |

### Tenant (Core)
| Atributo | Valor |
|----------|-------|
| **Responsabilidade** | Gestão de inquilinos, planos, assinaturas, quotas |
| **Aggregates** | Tenant, Plan, Subscription, Invoice |
| **Tecnologia** | NestJS, PostgreSQL (schema public) |
| **Eventos** | `TenantRegistered`, `TenantSuspended`, `QuotaExceeded` |
| **Depende de** | — |

### CRM (Supporting)
| Atributo | Valor |
|----------|-------|
| **Responsabilidade** | Gestão de leads, clientes, pipeline de vendas |
| **Aggregates** | Lead, Customer, Pipeline, Opportunity, Task |
| **Tecnologia** | NestJS, Prisma, PostgreSQL |
| **Eventos** | `LeadCaptured`, `OpportunityWon` |
| **Depende de** | Auth, Workflow Engine |

### Workflow Engine (Generic)
| Atributo | Valor |
|----------|-------|
| **Responsabilidade** | Motor de workflows configuráveis |
| **Aggregates** | WorkflowDefinition, WorkflowInstance, Approval |
| **Tecnologia** | NestJS, Prisma, PostgreSQL, RabbitMQ |
| **Eventos** | `WorkflowStarted`, `StageChanged`, `ApprovalGranted` |
| **Depende de** | Auth |

### Tender / Licitações (Core Domain)
| Atributo | Valor |
|----------|-------|
| **Responsabilidade** | Ciclo de vida completo de licitações |
| **Aggregates** | Tender, TenderProposal, TenderDispute, TenderResult |
| **Tecnologia** | NestJS, Prisma, PostgreSQL, RabbitMQ |
| **Eventos** | `TenderCaptured`, `TenderProposalSubmitted`, `TenderWon` |
| **Depende de** | Auth, Workflow Engine, CRM |

### ERP/Financeiro (Supporting — Planejado)
| Atributo | Valor |
|----------|-------|
| **Responsabilidade** | Fornecedores, notas fiscais, orçamentos, pagamentos |
| **Aggregates** | Supplier, BudgetAllocation, Invoice |

### IA/Analytics (Supporting — Planejado)
| Atributo | Valor |
|----------|-------|
| **Responsabilidade** | ML, predição, detecção de fraude, recomendação |
| **Tecnologia** | FastAPI, Python, scikit-learn, OpenAI |

## Linguagem Ubíqua

| Termo | Contexto | Significado |
|-------|----------|-------------|
| Licitação | Tender | Processo competitivo para aquisição de bens/serviços |
| Workflow | Workflow | Conjunto de estágios e transições configuráveis |
| Approval | Workflow | Aprovação individual (ANY/ALL/SEQUENTIAL) |
| Lead | CRM | Contato comercial não qualificado |
| Tenant | SaaS | Organização cliente da plataforma |
| Stage | Workflow | Estágio dentro de um workflow |
| Proposal | Tender | Proposta comercial submetida |
| Dispute | Tender | Disputa eletrônica em tempo real |

## Regras de Dependência

```
1. Core Domain (Tender)  → pode depender de Supporting + Generic
2. Supporting (CRM, ERP) → pode depender de Generic
3. Generic (WF Engine)   → não depende de domínios de negócio
4. Cross-cutting (Auth)  → todos dependem, depende de nenhum
5. Comunicação: eventos assíncronos优先, REST síncrono apenas quando necessário
```
