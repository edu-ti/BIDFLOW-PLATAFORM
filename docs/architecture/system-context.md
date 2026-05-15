# Contexto do Sistema — BidFlow Platform

> **Nível C4:** Context (visão geral do sistema)
> **Propósito:** Mostrar o BidFlow Platform como uma caixa preta, seus usuários e sistemas externos.

---

## Diagrama de Contexto

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   BIDFLOW PLATFORM                                       │
│  Sistema SaaS enterprise para gestão de licitações, CRM e ERP           │
│                                                                          │
│  [Usuários]  ──▶  [BidFlow Platform]  ◀──  [Integrações Externas]       │
│      │                     │                            │                │
│      ▼                     ▼                            ▼                │
│  Administradores        Web App                      GovBr Systems       │
│  Analistas              API REST                     ComprasNet          │
│  Fornecedores           Mobile (futuro)               DOU                │
│  Gestores                                             Azure AD/SSO       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Atores (Personas)

| Ator | Descrição | Sistemas utilizados |
|------|-----------|---------------------|
| **Administrador do Tenant** | Gerencia usuários, planos, configurações | Web App, API |
| **Analista de Licitações** | Opera o ciclo de licitações | Web App, API |
| **Gestor/Coordenador** | Aprova propostas, acompanha resultados | Web App |
| **Fornecedor Externo** | Participa de licitações como convidado | Portal do Fornecedor |
| **Administrador Global** | Suporte interno, gerencia multiplus tenants | Admin Panel |

## Sistemas Externos

| Sistema | Integração | Descrição |
|---------|-----------|-----------|
| **GovBr/ComprasNet** | API/Scraping | Captura automática de licitações públicas |
| **DOU (Diário Oficial)** | RSS/Scraping | Captura de publicações oficiais |
| **Azure AD / Google SSO** | OIDC/SAML | Login social via provedor de identidade |
| **Stripe / Asaas** | API REST | Processamento de pagamentos (futuro) |
| **Amazon S3 / MinIO** | S3 API | Armazenamento de documentos |
| **RabbitMQ** | AMQP | Barramento de eventos entre módulos |
| **Redis** | TCP | Cache, sessões, rate limiting |

## Fluxo Principal

```
Usuário → Web App (Next.js) → API (NestJS) → PostgreSQL + Redis + RabbitMQ
                                                     │
                                                     ▼
                                              Analytics (FastAPI)
                                              Workflows, ML, Relatórios
```

## Tecnologias por Contexto

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| Frontend | Next.js 14 + React 18 | Web App SSR/SPA |
| API Core | NestJS 10 + TypeScript | API REST + WebSocket |
| Analytics/ML | FastAPI + Python 3.11 | IA, ML, relatórios |
| Database | PostgreSQL 16 | Dados relacionais |
| Cache | Redis 7 | Sessões, cache, rate-limit |
| Message Broker | RabbitMQ | Eventos assíncronos |
| Storage | MinIO / S3 | Documentos e anexos |
| Container | Docker + Compose | Desenvolvimento local |
| Monorepo | Turborepo + npm | Gerenciamento do monorepo |
