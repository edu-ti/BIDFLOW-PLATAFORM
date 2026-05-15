# Arquitetura BidFlow Platform - Resumo Executive

## Visão Geral

Arquitetura **Enterprise DDD** para plataforma **SaaS Multi-tenant** com 7 bounded contexts.

---

## Bounded Contexts

| Contexto | Domínio | Responsabilidade |
|----------|---------|------------------|
| **Tenant** | Multitenancy | Isolamento, autenticação, configurações |
| **CRM** | Relacionamento | Contatos, empresas, pipeline de vendas |
| **ERP** | Gestão empresarial | Projetos, finanças, contratos |
| **Licitações** | Core Business | Licitações públicas/privadas, propostas |
| **IA** | Inteligência | Análises, predições, NLP |
| **Workflow** | Automação | Orquestração de processos |
| **SaaS** | Billing | Planos, faturas, cobranças |

---

## Aggregate Roots Principais

```
Tenant Context:
├── Tenant
└── Subscription

CRM:
├── Company
├── Contact
├── Deal
└── SalesPipeline

ERP:
├── Project
├── FinancialTransaction
├── Invoice
└── CostCenter

Bidding (Core):
├── Bidding
├── BiddingProposal
└── BiddingAnalysis

Workflow:
├── Workflow
└── WorkflowInstance

SaaS:
├── Subscription
├── Invoice
└── Plan
```

---

## Stack Tecnológica

- **Backend**: NestJS (Micro-serviços)
- **AI**: Python FastAPI
- **Frontend**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Message Broker**: RabbitMQ
- **Auth**: JWT + Passport

---

## Arquitetura de Comunicação

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│ API Gateway │────▶│  Services   │
│   (Web)     │     │   (NestJS)  │     │  (NestJS)   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────┐
                    │                          │                      │
               ┌────▼────┐              ┌────▼────┐           ┌────▼────┐
               │ PostgreSQL              │  Redis  │           │RabbitMQ │
               └─────────┘              └─────────┘           └─────────┘
                                                                   │
                                                            ┌────▼────┐
                                                            │FastAPI  │
                                                            │  (IA)   │
                                                            └─────────┘
```

---

## Event-Driven Ready

- **Domain Events**: Publicados em cada operação
- **Event Bus**: RabbitMQ com tópicos por contexto
- **Handlers**: Assíncronos para automação
- **Sagas**: Para transações distribuídas

---

## Estrutura de Diretórios Criados

```
docs/architecture/
├── DDD-ARCHITECTURE.md       # Arquitetura completa
├── MODULE-STRUCTURE.md       # Estrutura de módulos
└── IMPLEMENTATION-EXAMPLES.md # Exemplos de código

packages/database/
└── prisma/
    └── schema.prisma         # Schema completo multi-tenant
```

---

## Próximos Passos

1. **Setup inicial**: Criar projeto NestJS com estrutura modular
2. **Infraestrutura**: Docker Compose com todos os serviços
3. **Kernel DDD**: Implementar base classes (Aggregate, Entity, VO)
4. **Tenant Context**: Implementar primeiro contexto
5. **Bidding Context**: Implementar contexto core