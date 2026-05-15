# Architecture Principles — BidFlow Platform

> **Propósito:** Este documento define os princípios arquiteturais obrigatórios que regem todas as decisões técnicas no ecossistema BidFlow. Cada princípio deve ser seguido sem exceção, salvo decisão formal do Architecture Review Board.

---

## 1. Princípios Obrigatórios (Mandatory Principles)

### 1.1 Domain-Driven Design (DDD) como dogma arquitetural
- Todo código deve ser organizado por domínio de negócio (*bounded context*), nunca por camada técnica.
- Cada módulo no NestJS (`apps/api/src/<domain>/`) representa um *bounded context*.
- Entidades, Agregados, Value Objects, Domain Events, Repository Interfaces e Application Services devem estar claramente separados dentro de cada contexto.
- A camada de domínio **nunca** pode depender de infraestrutura (Prisma, HTTP, filas).
- Use `@nestjs/cqrs` para separação entre comandos e queries no domínio.

### 1.2 Spec-Driven Development (SDD)
- **Toda** funcionalidade deve começar com uma especificação formal em `.specify/`.
- Endpoints REST devem ser documentados via OpenAPI/Swagger **antes** da implementação.
- Contratos entre serviços (eventos RabbitMQ, APIs internas) devem ser versionados e validados com schemas.
- O diretório `.specify/` é a fonte da verdade para especificações, workflows e templates.

### 1.3 Multi-tenant nativo
- Toda entidade no banco de dados deve conter `tenantId` (string, UUID) como parte da chave primária ou índice obrigatório.
- Isolamento por *row-level security (RLS)* no PostgreSQL: cada query deve ser filtrada por `tenantId`.
- O `tenantId` deve ser extraído do JWT no middleware e injetado no contexto da requisição sem intervenção manual nos serviços.

### 1.4 Event-Driven Architecture (EDA)
- Toda mudança de estado relevante no domínio deve publicar um **Domain Event**.
- RabbitMQ é o barramento de eventos obrigatório para comunicação assíncrona entre serviços.
- Eventos devem seguir o formato CloudEvents 1.0.
- Produtores não conhecem consumidores — acoplamento zero via mensageria.

### 1.5 AI-First
- Toda decisão de design deve considerar a IA como first-class citizen.
- Modelos de linguagem (LLMs) devem ser acessados exclusivamente via camada de abstração no `apps/api` ou `apps/analytics`, nunca diretamente do frontend.
- Dados de treinamento e inferência devem passar por pipeline de anonimização e governança.
- Logs de interações com IA devem ser persistidos para auditoria e fine-tuning.

---

## 2. Separação de Responsabilidades (Separation of Concerns)

### 2.1 Estrutura Monorepo (Turborepo)

```
bidflow-platform/
├── apps/
│   ├── api/              # NestJS — API principal (REST + WebSocket)
│   ├── web/              # Next.js — Frontend SPA/SSR
│   └── analytics/        # Python FastAPI — ML, relatórios, ETL
├── packages/
│   ├── config/           # Configurações compartilhadas (env, constants)
│   ├── types/            # Tipos TypeScript compartilhados (interfaces, enums)
│   └── ui/               # Componentes React compartilhados
├── .specify/             # Especificações (SDD)
└── docker-compose.yml    # Orchestação local
```

### 2.2 Responsabilidades por app

| App       | Stack        | Responsabilidade                                           |
|-----------|--------------|------------------------------------------------------------|
| `api`     | NestJS       | Bounded contexts, commands, queries, auth, webhooks, SSE   |
| `web`     | Next.js      | Interface de usuário, SSR, ISR, roteamento                  |
| `analytics` | FastAPI    | ML, predição de lances, detecção de fraude, relatórios     |

### 2.3 Regras de dependência
- `apps/` pode importar `packages/*`, mas nunca o contrário.
- `apps/web` nunca importa `apps/api` diretamente — apenas via HTTP ou WebSocket.
- `apps/analytics` nunca importa `apps/api` — apenas via banco compartilhado ou eventos RabbitMQ.

---

## 3. Modularização (Modularization)

### 3.1 Estrutura de um bounded context (NestJS)

```
src/auctions/
├── application/          # Casos de uso (use-cases)
│   ├── commands/
│   │   ├── create-auction.handler.ts
│   │   └── place-bid.handler.ts
│   ├── queries/
│   │   └── get-auction.handler.ts
│   └── events/
│       └── auction-closed.handler.ts
├── domain/               # Entidades, Agregados, Value Objects
│   ├── auction.entity.ts
│   ├── auction.repository.ts      # Interface (port)
│   ├── value-objects/
│   │   ├── money.ts
│   │   └── auction-status.ts
│   └── events/
│       ├── auction-created.event.ts
│       └── bid-placed.event.ts
├── infrastructure/       # Implementações concretas (adapters)
│   ├── prisma-auction.repository.ts
│   ├── rabbitmq-auction.publisher.ts
│   └── controllers/
│       └── auctions.controller.ts
├── dto/                  # Data Transfer Objects (validação via class-validator)
├── auctions.module.ts    # NestJS Module
└── index.ts              # Barrel export
```

### 3.2 Regras de modularização
- Um módulo **não pode** importar arquivos de outro módulo por caminho relativo — use `@bidflow/...` ou módulo NestJS.
- Cada módulo expõe apenas `index.ts`; todo o resto é `private`.
- Módulo só pode acessar banco via repositório — proibido acesso direto a Prisma fora da camada `infrastructure/`.

---

## 4. Desacoplamento (Decoupling)

### 4.1 Ports & Adapters (Hexagonal Architecture)
- **Ports** (interfaces) vivem em `domain/` — sem dependências externas.
- **Adapters** (implementações) vivem em `infrastructure/` — concretizam as ports.
- Nenhum adaptador pode ser importado por outro módulo; a DI do NestJS injeta as implementações via tokens.

### 4.2 Comunicação entre contextos
| Tipo            | Mecanismo              | Quando usar                                      |
|-----------------|------------------------|--------------------------------------------------|
| Síncrono        | GraphQL / REST         | Queries e comandos que exigem resposta imediata  |
| Assíncrono      | RabbitMQ (eventos)     | Notificações, reações em cascata, workflows       |
| Streaming       | WebSocket / SSE        | Bids em tempo real, notificações push             |
| Dados massivos  | Banco compartilhado    | Analytics lê dados via SQLAlchemy (read-only)     |

### 4.3 Anti-corruption Layer (ACL)
- Sempre que um contexto consumir dados de outro contexto, deve passar por uma ACL.
- A ACL traduz o modelo do contexto origem para o modelo do contexto destino.

---

## 5. Padrões Enterprise (Enterprise Patterns)

### 5.1 Repository Pattern
- Toda entidade de domínio tem uma interface `XxxRepository` em `domain/`.
- A implementação concreta (Prisma) fica em `infrastructure/`.
- Repositórios retornam entidades de domínio, nunca DTOs ou Prisma models.

### 5.2 Unit of Work
- Commands que modificam múltiplos agregados devem usar Prisma Transaction (`$transaction`).
- Eventos de domínio só podem ser publicados **após** o commit da transação.

### 5.3 CQRS
- **Commands**: mutação (Create, Update, Delete) — validados, transacionais.
- **Queries**: leitura (Find, Get) — podem usar views materializadas, cache Redis, projeções.
- Use `@nestjs/cqrs` com `CommandBus` e `QueryBus`.

### 5.4 Saga / Process Manager
- Workflows longos (ex: "Criar Leilão → Notificar Usuários → Iniciar") são orquestrados por Sagas.
- Implementação via filas RabbitMQ com dead-letter e retry.

### 5.5 Domain Events
- Eventos nomeados no passado: `AuctionCreated`, `BidPlaced`, `AuctionClosed`.
- Cada evento carrega `eventId`, `aggregateId`, `tenantId`, `timestamp`, `data`.
- Consumidores são idempotentes (verificar `eventId` antes de processar).

### 5.6 Specification Pattern
- Regras de negócio complexas (ex: "leilão elegível para cancelamento") são encapsuladas em Specification objects no domínio.

---

## 6. Estratégia IA (AI Strategy)

### 6.1 Arquitetura de IA

```
apps/analytics (FastAPI)
├── services/
│   ├── prediction/         # Modelos de previsão de lance
│   ├── fraud-detection/    # Detecção de lances fraudulentos
│   ├── recommendation/     # Recomendação de leilões
│   └── nlp/                # Processamento de linguagem natural
├── pipelines/
│   └── training/           # Pipelines de treino (MLflow)
├── gateways/
│   ├── openai.gateway.py   # Abstraction sobre LLM providers
│   └── huggingface.gateway.py
└── models/                 # Modelos serializados (ONNX, pickle)
```

### 6.2 Princípios de IA
- **LLM Abstraction Layer**: Nunca chamar OpenAI / Anthropic diretamente. Usar gateway em `apps/analytics` que abstrai provider e versão do modelo.
- **Feedback Loop**: Toda predição deve ter mecanismo de feedback (ex: "útil" / "não útil") para fine-tuning contínuo.
- **Privacidade**: Dados de tenant nunca podem vazar entre tenants via prompts ou datasets compartilhados.
- **Observabilidade**: Toda chamada de IA deve ser logada com `prompt`, `response`, `latency`, `tokens_used`, `tenantId`.
- **Fallback**: Se o serviço de IA estiver indisponível, o sistema deve operar em modo degradado (sem quebra de fluxo).

### 6.3 Integração com o core
- `apps/api` solicita inferência via RabbitMQ (evento `PredictionRequested`) ou HTTP para `apps/analytics`.
- Resultados de IA voltam via evento `PredictionCompleted` ou callback HTTP.
- Nunca bloquear uma requisição síncrona aguardando inferência de IA.

---

## 7. Multi-tenant

### 7.1 Modelo de dados
- Toda tabela tem coluna `tenant_id` como `UUID` com `NOT NULL`.
- Chaves primárias compostas ou índice composto: `(tenant_id, id)`.
- Schemas do PostgreSQL por tenant é **proibido** — todos os tenants compartilham o mesmo schema, isolados por `tenant_id`.

### 7.2 Contexto de tenant
```typescript
// Extraído do JWT no middleware global
interface TenantContext {
  tenantId: string;
  userId: string;
  role: 'admin' | 'manager' | 'user';
}
```
- O `TenantContext` é injetado via `ExecutionContext` do NestJS (request-scoped).
- `PrismaService` deve aplicar filtro `tenantId` automaticamente via extension.

### 7.3 Isolamento
- Dados de tenants diferentes **nunca** se misturam em queries.
- Cache (Redis) deve usar chave prefixada por `tenantId`.
- Filas RabbitMQ devem usar `Routing Key` contendo `tenantId` para isolamento.

---

## 8. Segurança (Security)

### 8.1 Autenticação e Autorização
- **Autenticação**: JWT (RS256) com curta expiração (15 min) + Refresh Token (7 dias).
- **Autorização**: RBAC + ABAC via `@nestjs/casl` ou `@casl/ability`.
- Toda rota protegida deve ter `@UseGuards(AuthGuard, TenantGuard)`.

### 8.2 Validação e Sanitização
- Toda entrada de usuário validada com `class-validator` + `whitelist: true` + `forbidNonWhitelisted: true`.
- SQL Injection: prevenido pelo Prisma (parameterized queries).
- XSS: prevenido pelo Next.js (auto-escaping) e sanitização de HTML com DOMPurify.

### 8.3 Infraestrutura
- TLS obrigatório em todas as comunicações externas.
- Secrets gerenciados via vault (Hashicorp Vault ou AWS Secrets Manager), nunca no `.env` versionado.
- Rate limiting por tenant + por usuário via `@nestjs/throttler`.

---

## 9. Observabilidade (Observability)

### 9.1 Logging estruturado
- Formato JSON obrigatório em produção.
- Logs em `apps/api` via `@nestjs/common/Logger` ou Pino, com campos: `timestamp`, `level`, `tenantId`, `requestId`, `service`, `message`.
- Logs em `apps/analytics` via `structlog` (Python) no mesmo formato.
- Nunca logar dados sensíveis (senhas, tokens, PII).

### 9.2 Distributed Tracing (OpenTelemetry)
- Trace propagado via headers `traceparent` entre todos os serviços.
- Spans para: HTTP request, comando CQRS, evento de domínio, query no banco, mensagem RabbitMQ, chamada de IA.
- Exportador OTLP para Jaeger ou Grafana Tempo.

### 9.3 Métricas
- Métricas padrão RED (Rate, Errors, Duration) para todo endpoint e comando.
- Dashboards no Grafana: visão por tenant, por serviço, por contexto.
- Alertas: P1 (serviço fora do ar), P2 (latência > 1s no p95), P3 (erro > 1%).

### 9.4 Health Checks
- `GET /health` em todos os serviços: status do banco, Redis, RabbitMQ, dependências externas.
- Readiness probe: serviço aceita tráfego.
- Liveness probe: serviço está rodando.

---

## 10. Decisões Tecnológicas (Technology Decisions)

| Camada          | Tecnologia       | Justificativa                                    |
|-----------------|------------------|--------------------------------------------------|
| API Core        | NestJS + TS      | Suporte nativo a módulos DDD, DI, CQRS, Swagger  |
| Frontend        | Next.js 14       | SSR, ISR, App Router, Server Components          |
| Analytics/ML    | FastAPI + Python 3.11 | Ecossistema ML (pandas, numpy, scikit-learn) |
| ORM (TS)        | Prisma           | Type-safe, migrations, multi-tenant via extensions|
| ORM (Python)    | SQLAlchemy 2.0   | Async support, mature ORM para analytics         |
| Message Broker  | RabbitMQ         | Dead-letter, routing, confiabilidade enterprise  |
| Cache           | Redis 7          | Sessão, rate-limit, cache de queries             |
| Banco           | PostgreSQL 16    | RLS, JSONB, índices parciais, performance        |
| Container       | Docker + Compose | Desenvolvimento local replicando produção        |
| Monorepo        | Turborepo        | Cache distribuído, paralelismo, orquestração     |

---

## 11. Glossário

| Termo              | Definição                                                    |
|--------------------|--------------------------------------------------------------|
| Bounded Context    | Limite explícito de um domínio com modelo e linguagem próprios |
| Port               | Interface que define contrato entre domínio e infraestrutura |
| Adapter            | Implementação concreta de uma Port                           |
| Domain Event       | Evento atômico que representa algo que aconteceu no domínio  |
| Saga               | Coreografia de eventos distribuídos para workflow longo      |
| ACL                | Anti-corruption Layer — tradutor entre contextos             |
| RLS                | Row-Level Security — política de segurança no PostgreSQL     |
| CloudEvents        | Especificação CNCF para formato padronizado de eventos       |

---

> **Revisão:** Este documento deve ser revisado trimestralmente pelo Architecture Review Board.
> **Violações:** Desvios destes princípios devem ser documentados como Architecture Decision Records (ADR) em `docs/adr/`.
