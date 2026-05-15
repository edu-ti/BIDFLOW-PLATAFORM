# AI Development Workflow — BidFlow Platform

> **Propósito:** Este documento define o workflow de desenvolvimento assistido por IA do BidFlow Platform. Estabelece como a IA é usada em cada etapa do ciclo SDD, critérios de aceite, gates de qualidade e responsabilidades. Todo desenvolvimento deve seguir este fluxo.

---

## Sumário

1. [Visão Geral do Workflow](#1-visão-geral-do-workflow)
2. [Fase 0: Discovery & Concepção](#2-fase-0-discovery--concepção)
3. [Fase 1: Spec-Driven Specification](#3-fase-1-spec-driven-specification)
4. [Fase 2: AI-Assisted Planning](#4-fase-2-ai-assisted-planning)
5. [Fase 3: AI-Generated Implementation](#5-fase-3-ai-generated-implementation)
6. [Fase 4: AI-Generated Tests](#6-fase-4-ai-generated-tests)
7. [Fase 5: Architecture Review Board](#7-fase-5-architecture-review-board)
8. [Fase 6: CI/CD & Quality Gates](#8-fase-6-cicd--quality-gates)
9. [Fase 7: Security & Compliance](#9-fase-7-security--compliance)
10. [Fase 8: Deploy & Observability](#10-fase-8-deploy--observability)
11. [Estratégia de Prompts](#11-estratégia-de-prompts)
12. [Governança de IA](#12-governança-de-ia)
13. [Métricas do Workflow](#13-métricas-do-workflow)
14. [Fluxograma Resumido](#14-fluxograma-resumido)

---

## 1. Visão Geral do Workflow

### 1.1 Ciclo SDD com IA

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                        BIDFLOW AI DEVELOPMENT WORKFLOW                                │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────────┐   │
│  │ Fase 0   │   │ Fase 1   │   │ Fase 2   │   │ Fase 3   │   │     Fase 4       │   │
│  │ Discovery│──→│  Spec    │──→│  Plan    │──→│  Code    │──→│      Tests       │   │
│  │ (humano) │   │ (IA+hum) │   │ (IA+hum) │   │  (IA)    │   │    (IA+hum)      │   │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └────────┬─────────┘   │
│                                                                        │              │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐    │              │
│  │     Fase 8       │   │     Fase 7       │   │     Fase 6       │    │              │
│  │  Deploy & Obs    │←──│  Security Check  │←──│  CI/CD + Gates   │←───┘              │
│  │  (automated)     │   │  (IA+automated)  │   │  (automated)     │                   │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘                    │
│                                    │                                                   │
│                                    ▼                                                   │
│                          ┌──────────────────┐                                          │
│                          │     Fase 5       │  (parallel / async)                      │
│                          │  Architecture    │                                          │
│                          │  Review Board    │                                          │
│                          └──────────────────┘                                          │
│                                                                                        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Responsabilidades

| Papel              | Responsabilidade no workflow                              |
|---------------------|-----------------------------------------------------------|
| **Product Manager** | Discovery, user stories, critérios de aceite              |
| **Architecture Board** | Revisão arquitetural, ADRs, aprovação de spec         |
| **Dev (IA Driver)** | Operar ferramentas de IA, revisar output, decisões finais |
| **Dev (Reviewer)**  | Code review, quality gates, segurança                     |
| **QA**              | Testes E2E, validação funcional, cenários de borda        |
| **DevOps**          | CI/CD, quality gates automatizados, deploy                |

### 1.3 Regras Obrigatórias

| Regra | Descrição |
|-------|-----------|
| **R1** | Toda funcionalidade deve passar por todas as 9 fases sequencialmente |
| **R2** | Nenhuma fase pode ser pulada — exceto Fase 5 (Arch Review) que pode ser assíncrona |
| **R3** | IA é assistente, não autor. Toda decisão final é humana |
| **R4** | Todo output de IA deve ser revisado antes de commit |
| **R5** | Nenhum código gerado por IA vai para produção sem teste escrito e passando |

---

## 2. Fase 0: Discovery & Concepção

**Input:** Requisito de negócio (problema, não solução).
**Output:** User story map + critérios de sucesso.
**Responsável:** Product Manager.
**IA:** Proibida — fase exclusivamente humana.

### 2.1 Atividades

| Atividade | Descrição | Duração esperada |
|-----------|-----------|------------------|
| Definição do problema | Descrever o problema de negócio em 1-2 parágrafos | 1 dia |
| Mapeamento de stakeholders | Quem será afetado pela mudança | 2 horas |
| User story mapping | Histórias priorizadas (P1, P2, P3) | 2 dias |
| Definição de critérios de sucesso | Métricas mensuráveis (ex: "redução de 30% no tempo de resposta") | 1 dia |
| Draft de acceptance criteria | Given/When/Then por história | 1 dia |

### 2.2 Artefatos de entrada para Fase 1

- `docs/features/<feature-name>/problem-statement.md`
- `docs/features/<feature-name>/user-stories.md`
- Métricas de sucesso definidas e acordadas

### 2.3 Quality Gate (G0)

| Critério | Exigência |
|----------|-----------|
| Problema está claramente definido? | Sim |
| Stakeholders identificados? | Sim |
| User stories priorizadas (P1/P2/P3)? | Sim |
| Critérios de sucesso são mensuráveis? | Sim |
| Acceptance criteria draft existe? | Sim |
| **Decisão:** Seguir para Fase 1? | Aprovado pelo PM |

---

## 3. Fase 1: Spec-Driven Specification

**Input:** Problem statement + user stories (Fase 0).
**Output:** Spec formal (.specify/) + OpenAPI + schemas de eventos.
**Responsável:** Dev (IA Driver).
**IA:** Geração do spec via `speckit.specify` + revisão humana.

### 3.1 Fluxo

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Input:      │────→│  speckit.specify │────→│  Spec gerado      │
│  User stories│     │  (IA generation)  │     │  (markdown)       │
└──────────────┘     └──────────────────┘     └─────────┬─────────┘
                                                         │
                                                         ▼
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Output:     │←────│  Revisão humana  │←────│  Revisor lê spec  │
│  Spec final  │     │  (G1 gate)       │     │  + ajustes IA     │
└──────────────┘     └──────────────────┘     └───────────────────┘
```

### 3.2 Geração de Spec

```bash
# Comando
speckit.specify "Implementar módulo de disputa eletrônica com
prorrogação automática nos últimos 30 segundos. Modalidade:
menor preço. Decremento mínimo: 0.5%."
```

### 3.3 Prompt Engineering para Spec

```
CONTEXTO: BidFlow Platform — ERP/CRM SaaS de licitações.
PAPEL: Analista de sistemas sênior especialista em DDD.
TAREFA: Gerar spec no template .specify/templates/spec-template.md
para a feature descrita abaixo.

REGRAS:
- Use linguagem ubíqua do domínio de licitações
- Crie user stories independentes e testáveis (P1, P2, P3)
- Defina acceptance criteria em Gherkin (Given/When/Then)
- Liste FR-XXX funcionais
- Defina entidades com atributos essenciais
- Inclua edge cases

FEATURE: {user_story_description}

FORMATO: Markdown, template spec-template.md.
```

### 3.4 Artefatos gerados

| Artefato | Ferramenta | Localização |
|----------|------------|-------------|
| Spec markdown | `speckit.specify` | `.specify/specs/<context>/<feature>/spec.md` |
| OpenAPI contract | Manual + IA | `docs/openapi/<context>/<feature>.yml` |
| Event schemas | Manual + IA | `.specify/events/schemas/<context>/` |
| Data model | IA + humano | `.specify/specs/<context>/<feature>/data-model.md` |
| ADR (se aplicável) | Manual | `docs/adr/<feature>-adr-001.md` |

### 3.5 Quality Gate (G1)

| Critério | Exigência |
|----------|-----------|
| Spec segue template `.specify/templates/spec-template.md` | Obrigatório |
| User stories são independentes e testáveis | Obrigatório |
| Acceptance criteria em Gherkin | Obrigatório |
| Entidades e atributos definidos | Obrigatório |
| Edge cases mapeados | Obrigatório |
| OpenAPI contract gerado (se aplicável) | Obrigatório |
| Eventos definidos (se aplicável) | Obrigatório |
| **Aprovação necessária:** Dev líder + Autor original | Ambos |

---

## 4. Fase 2: AI-Assisted Planning

**Input:** Spec (Fase 1).
**Output:** Plano de implementação + tasks + estimativas.
**Responsável:** Dev (IA Driver).
**IA:** `speckit.plan` + `speckit.tasks`.

### 4.1 Fluxo

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Input:      │────→│  speckit.plan    │────→│  Plano gerado     │
│  Spec        │     │  (IA)            │     │  + tasks          │
└──────────────┘     └──────────────────┘     └─────────┬─────────┘
                                                         │
                                                         ▼
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Output:     │←────│  Revisão humana  │←────│  Verificar tasks  │
│  Plan + Task │     │  (G2 gate)       │     │  + dependências   │
└──────────────┘     └──────────────────┘     └───────────────────┘
```

### 4.2 Geração de Plano

```bash
# Comando
speckit.plan ".specify/specs/bidding/electronic-dispute/spec.md"
speckit.tasks ".specify/specs/bidding/electronic-dispute/spec.md"
```

### 4.3 Estrutura do Plano

```
docs/plans/<context>/<feature>/
├── plan.md              # Plano geral de implementação
├── tasks.md             # Tasks individuais com dependências
└── phases/
    ├── phase-1-setup.md
    ├── phase-2-domain.md
    ├── phase-3-infrastructure.md
    └── phase-4-tests.md
```

### 4.4 Template de Task

```markdown
## T042 [P1] [US1] Implementar Auction Entity no domínio

**Arquivos:**
- `apps/api/src/auctions/domain/auction.entity.ts` (CRIAR)
- `apps/api/src/auctions/domain/value-objects/money.ts` (CRIAR)

**Dependências:** T041 (Auction Value Objects)
**Paralelizável:** Não
**Testes:** T043 (unit), T044 (integration)

**Instruções para IA:**
1. Criar AuctionEntity no domínio puro (sem dependências de infra)
2. Implementar invariantes: startDate < endDate, startPrice > 0
3. Value Object Money = amount + currency
4. Método placeBid() com validação de regras de negócio
5. Não importar Prisma ou qualquer dependência de infraestrutura
```

### 4.5 Quality Gate (G2)

| Critério | Exigência |
|----------|-----------|
| Tasks mapeadas para user stories (US1, US2...) | Obrigatório |
| Dependências entre tasks claras | Obrigatório |
| Tasks paralelizáveis identificadas [P] | Obrigatório |
| Caminho crítico identificado | Obrigatório |
| Estimativa de esforço por task | Recomendado |
| **Aprovação necessária:** Dev líder | Sim |

---

## 5. Fase 3: AI-Generated Implementation

**Input:** Plano + tasks (Fase 2).
**Output:** Código implementado + testes unitários.
**Responsável:** Dev (IA Driver).
**IA:** Geração de código via `speckit.implement` + comandos específicos.

### 5.1 Fluxo

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Task T042   │────→│  Prompt IA       │────→│  Código gerado    │
│  (do plano)  │     │  + coding-       │     │  + testes         │
│              │     │  standards.md    │     │                   │
└──────────────┘     └──────────────────┘     └─────────┬─────────┘
                                                         │
                                                         ▼
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Commit      │←────│  Ajustes manuais │←────│  Revisão +        │
│  + PR        │     │  (se necessário) │     │  validação (G3)   │
└──────────────┘     └──────────────────┘     └───────────────────┘
```

### 5.2 Ordem de Implementação

```
FASE 3a — Value Objects (domínio puro)
├── Money.ts, AuctionStatus.ts, TenantId.ts...
└── SEM dependências de infra

FASE 3b — Entities & Aggregates (domínio puro)
├── AuctionEntity.ts, RfpEntity.ts, ProposalEntity.ts...
└── Depende apenas de VOs

FASE 3c — Repository Interfaces (domínio)
├── AuctionRepository.ts (interface — port)
└── SEM dependências de infra

FASE 3d — Application Services (CQRS)
├── Commands: CreateAuctionHandler, PlaceBidHandler...
├── Queries: GetAuctionHandler, ListAuctionsHandler...
└── Depende de repositories (via DI)

FASE 3e — Infrastructure Adapters
├── PrismaAuctionRepository.ts
├── RabbitMqEventPublisher.ts
├── Controllers REST
└── Depende de interfaces do domínio

FASE 3f — Module Assembly
├── auctions.module.ts
├── DTOs
└── Config DI
```

### 5.3 Prompt Engineering para Código

```markdown
## Contexto
Projeto: BidFlow Platform
Stack: NestJS + TypeScript + Prisma + PostgreSQL
Padrão: DDD + CQRS + Hexagonal Architecture
Arquivo de referência: .specify/events/schemas/bidding/bid-placed-v1.json

## Tarefa
Implementar {TASK_DESCRIPTION}

## Arquivos a serem criados
{ARQUIVOS}

## Regras Obrigatórias (do coding-standards.md)
1. Naming: PascalCase para classes, camelCase para métodos/variáveis
2. DDD: domínio puro não importa nada de infra
3. Repository Pattern: interface no domínio, implementação na infra
4. CQRS: separar commands de queries
5. Tenant isolation: todo repositório filtra por tenantId
6. Error handling: DomainException para regras de negócio
7. Validation: class-validator nos DTOs
8. Eventos: CloudEvents 1.0
9. Logging: Logger do NestJS com objeto estruturado
10. TODO: evitar comentários no código

## Entrada
{DADOS_DE_ENTRADA}

## Saída Esperada
{ARQUIVOS} completos, lintados, com comentários mínimos
```

### 5.4 Quality Gate (G3) — Code Review com IA

```bash
# Gate automatizado antes do commit
npm run lint              # ESLint
npm run format:check      # Prettier
npm run typecheck         # TypeScript strict
npm run test:unit         # Testes unitários
npm run build             # Compilação
```

| Critério | Exigência | Ferramenta |
|----------|-----------|------------|
| Compila sem erros | Obrigatório | `nest build` |
| Lint sem warnings | Obrigatório | ESLint |
| Tipagem correta | Obrigatório | TypeScript strict |
| Testes unitários passam | Obrigatório | Jest (80% cobertura) |
| Sem console.log | Obrigatório | ESLint rule |
| Sem secrets hardcoded | Obrigatório | GitLeaks / review |
| Segue coding-standards | Obrigatório | Revisão humana |
| **Aprovação necessária:** Dev que não implementou | Sim |

---

## 6. Fase 4: AI-Generated Tests

**Input:** Código implementado (Fase 3).
**Output:** Testes unitários, integração, contrato + E2E.
**Responsável:** Dev (IA Driver + QA).
**IA:** Geração de testes via prompts específicos.

### 6.1 Pirâmide de Testes

```
         ╱╲
        ╱  ╲       E2E (5%)
       ╱    ╲       Playwright / Cypress
      ╱──────╲
     ╱        ╲     Integration (25%)
    ╱          ╲    Supertest + Prisma + RabbitMQ
   ╱────────────╲
  ╱              ╲  Unit (70%)
 ╱                ╲ Jest + mocks
╱──────────────────╲
```

### 6.2 Geração de Testes Unitários

```markdown
## Prompt para Testes Unitários

CONTEXTO: BidFlow Platform — NestJS + Jest
PAPEL: QA Engineer especialista em TDD

TAREFA: Gerar testes unitários para {ARQUIVO}

REGRAS:
1. Testar nomeados em português descritivo
2. Cobrir: sucesso, validação, edge cases, exceptions
3. Mocar todas as dependências de infra
4. Usar describe/it padrão do Jest
5. Coverage mínimo: 90% para domínio, 80% para application

ARQUIVO: {caminho_do_arquivo}

EXEMPLO DE TESTE ESPERADO:
describe('AuctionEntity', () => {
  it('deve criar um leilão válido', () => { ... })
  it('deve rejeitar criação com startDate >= endDate', () => { ... })
  it('deve aceitar lance válido', () => { ... })
  it('deve rejeitar lance em leilão não-ativo', () => { ... })
})
```

### 6.3 Geração de Testes de Integração

```markdown
## Prompt para Testes de Integração

CONTEXTO: NestJS E2E com Supertest + Prisma + banco de teste
PAPEL: QA Engineer

TAREFA: Gerar teste de integração para o endpoint {ENDPOINT}

REGRAS:
1. Usar testcontainers para PostgreSQL
2. Setup: criar tenant + seed data via Prisma
3. Validar fluxo completo: request → DB → response
4. Validar tenant isolation (tenant A não vê dados de B)
5. Validar idempotência (mesmo request duas vezes)
6. Limpar dados entre testes

ENDPOINT: {method} {path}
DTO: {CreateDto}
RESPONSE: {ResponseDto}
```

### 6.4 Testes Obrigatórios por Camada

| Camada | Obrigatório? | Framework | Coverage mínimo |
|--------|-------------|-----------|-----------------|
| Value Objects | Sim | Jest | 100% |
| Domain Entities | Sim | Jest | 90% |
| Domain Services | Sim | Jest | 90% |
| Application Handlers | Sim | Jest | 80% |
| Repository (integração) | Sim | Jest + Prisma | 70% |
| Controllers (integração) | Sim | Supertest | 70% |
| Event Handlers | Sim | Jest + mocks | 80% |
| E2E | Recomendado | Playwright | — |
| Contract | Sim | Pactum | — |

### 6.5 Quality Gate (G4)

| Critério | Exigência |
|----------|-----------|
| Testes unitários passam | 100% |
| Coverage domínio >= 90% | Obrigatório |
| Coverage application >= 80% | Obrigatório |
| Testes de integração do endpoint principal passam | Obrigatório |
| Testes de tenant isolation incluídos | Obrigatório |
| Testes de idempotência incluídos | Recomendado |
| **Aprovação necessária:** QA | Sim |

---

## 7. Fase 5: Architecture Review Board

**Input:** Spec + código + testes.
**Output:** ADR + aprovação arquitetural.
**Responsável:** Architecture Review Board.
**IA:** Apoio na análise (não substitui decisão humana).

### 7.1 Quando acionar

| Situação | Revisão obrigatória? |
|----------|---------------------|
| Novo bounded context | Sim |
| Mudança em aggregate root existente | Sim |
| Novo padrão de comunicação entre contextos | Sim |
| Mudança em schema de evento público | Sim |
| Feature P1 (core domain) | Sim |
| Feature P2/P3 com impacto arquitetural | A critério |
| Bug fix sem impacto estrutural | Não |

### 7.2 Checklist da Revisão Arquitetural

```
┌─────────────────────────────────────────────┐
│ ARCHITECTURE REVIEW CHECKLIST                │
├─────────────────────────────────────────────┤
│                                              │
│ [ ] 1. Spec está alinhada com a linguagem    │
│        ubíqua do domínio?                     │
│ [ ] 2. Aggregate boundaries estão corretos?   │
│ [ ] 3. Invariantes estão no aggregate root?   │
│ [ ] 4. Eventos seguem CloudEvents 1.0?        │
│ [ ] 5. Versionamento de eventos definido?     │
│ [ ] 6. Consumidores identificados?            │
│ [ ] 7. Tenant isolation implementado?         │
│ [ ] 8. ACL foi criada onde necessário?        │
│ [ ] 9. Sagas têm compensação definida?        │
│ [ ] 10. ADR foi escrito?                      │
│ [ ] 11. Performance estimada é adequada?      │
│ [ ] 12. Segurança: RBAC + validação OK?       │
│                                              │
│ RESULTADO: [APROVADO] [APROVADO C/ RESSALVAS] │
│            [REJEITADO]                        │
└─────────────────────────────────────────────┘
```

### 7.3 ADR Template

```markdown
# ADR-XXX: [Título da Decisão Arquitetural]

**Status:** [Proposto | Aceito | Deprecado | Substituído]
**Data:** 2026-05-15
**Autor:** [Nome]
**Contexto:** {problema arquitetural + forças atuantes}
**Decisão:** {o que foi decidido}
**Consequências:** {impactos positivos e negativos}
**Alternativas consideradas:**
- Alternativa 1: {prós e contras}
- Alternativa 2: {prós e contras}
```

### 7.4 Quality Gate (G5)

| Critério | Exigência |
|----------|-----------|
| Architecture Review realizada | Quando aplicável |
| ADR escrito | Quando aplicável |
| Checklist preenchido | Obrigatório |
| **Aprovação necessária:** Architecture Board | Sim |

---

## 8. Fase 6: CI/CD & Quality Gates

**Input:** Código + testes aprovados.
**Output:** Pipeline verde + artifact pronto para deploy.
**Responsável:** DevOps.
**IA:** Automação de pipeline, análise de falhas.

### 8.1 Pipeline CI/CD

```yaml
# .github/workflows/feature-pipeline.yml
name: BidFlow CI/CD

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

env:
  NODE_VERSION: "20.x"
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  quality-gates:
    name: Quality Gates (G1-G5)
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: bidflow_test
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: G1 — Spec validation
        run: npm run spec:validate
        # Valida se spec existe e segue template

      - name: G2 — Lint
        run: npm run lint

      - name: G2 — Format check
        run: npm run format:check

      - name: G3 — TypeScript typecheck
        run: npm run typecheck

      - name: G3 — Build
        run: npm run build

      - name: G3 — Security scan
        run: npm audit --audit-level=high

      - name: G4 — Unit tests
        run: npm run test:unit -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/bidflow_test

      - name: G4 — Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/bidflow_test

      - name: G4 — Coverage check
        uses: VeryGoodOpenSource/coverage-check-action@v2
        with:
          path: ./coverage/lcov.info
          threshold: 80

      - name: G4 — SonarQube analysis
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  deploy-staging:
    name: Deploy to Staging
    needs: [quality-gates]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker images
        run: docker compose build

      - name: Push to registry
        run: |
          docker tag bidflow-api ${{ secrets.REGISTRY }}/bidflow-api:${{ github.sha }}
          docker push ${{ secrets.REGISTRY }}/bidflow-api:${{ github.sha }}

      - name: Deploy staging
        run: |
          # kubectl set image deployment/api api=${{ secrets.REGISTRY }}/bidflow-api:${{ github.sha }}
          # ArgoCD sync
```

### 8.2 Quality Gates Automatizados Resumo

```
G0 ── Discovery (humano)
 │
G1 ── Spec validation ──────── lint + template check
 │
G2 ── Plan review ───────────── tasks + dependências
 │
G3 ── Code review ──────────── lint + typecheck + build + security scan
 │
G4 ── Test gates ───────────── unit + integration + coverage + sonarqube
 │
G5 ── Architecture review ──── checklist + ADR
 │
G6 ── Staging deploy ───────── smoke tests + integration E2E
 │
G7 ── Production deploy ────── canary + health check + rollback
```

### 8.3 Quality Gate (G6 — Staging)

| Critério | Exigência |
|----------|-----------|
| Todos os testes passam no CI | Obrigatório |
| Cobertura >= 80% | Obrigatório |
| Vulnerabilidades críticas = 0 | Obrigatório |
| SonarQube quality gate = PASS | Obrigatório |
| Smoke test do endpoint principal | Obrigatório |
| Health check do serviço OK | Obrigatório |
| **Decisão:** Promover para produção? | Dev líder |

---

## 9. Fase 7: Security & Compliance

**Input:** Código + artifact.
**Output:** Relatório de segurança + compliance check.
**Responsável:** Dev + Security Team.
**IA:** SAST, DAST, análise de dependências.

### 9.1 Gatilhos de Segurança

```
security/
├── sast/              # Static Analysis (SonarQube, Semgrep)
│   └── rules/         # Regras customizadas NestJS/Prisma
├── dast/              # Dynamic Analysis (OWASP ZAP)
├── secrets/           # GitLeaks / truffleHog
├── dependencies/      # Snyk / Dependabot
└── compliance/        # LGPD / ISO 27001 checks
```

### 9.2 Security Checks Automatizados

| Ferramenta | O que verifica | Gatilho |
|------------|---------------|---------|
| **GitLeaks** | Secrets no código (senhas, tokens, keys) | Pre-commit + CI |
| **Snyk** | Vulnerabilidades em dependências | CI (diário) |
| **Semgrep** | Regras SAST customizadas (NestJS, Prisma) | CI (PR) |
| **SonarQube** | Security hotspots, code smells | CI (PR) |
| **OWASP ZAP** | DAST em staging | CI (deploy staging) |
| **Trivy** | Vulnerabilidades em imagens Docker | CI (build) |

### 9.3 Regras Semgrep Customizadas

```yaml
# security/sast/rules/nestjs-injection.yml
rules:
  - id: nestjs-no-console-log
    patterns:
      - pattern: console.log(...)
    message: "Use Logger do NestJS em vez de console.log"
    severity: WARNING

  - id: prisma-no-raw-queries
    patterns:
      - pattern: prisma.$queryRaw(...)
      - pattern: prisma.$executeRaw(...)
    message: "Evite queries raw no Prisma; use o query builder"
    severity: WARNING
    paths:
      exclude:
        - "*/migrations/*"

  - id: no-hardcoded-secrets
    patterns:
      - pattern-regex: (password|secret|apiKey|token)\s*=\s*["'][^"']+["']
    severity: ERROR
```

### 9.4 Quality Gate (G7 — Security)

| Critério | Exigência |
|----------|-----------|
| Vulnerabilidades CRITICAL = 0 | Obrigatório |
| Vulnerabilidades HIGH = 0 | Obrigatório |
| Secrets scan = 0 findings | Obrigatório |
| SAST sem erros | Obrigatório |
| DAST sem falhas críticas | Recomendado |
| Dependências atualizadas | Recomendado |
| **Decisão:** Seguir para produção? | Security Team |

---

## 10. Fase 8: Deploy & Observabilidade

**Input:** Artifact aprovado.
**Output:** Feature em produção + dashboards + alertas.
**Responsável:** DevOps + SRE.
**IA:** Análise de métricas, anomalias, sugestão de rollback.

### 10.1 Estratégia de Deploy

| Ambiente | Estratégia | Health Check | Rollback |
|----------|-----------|--------------|----------|
| **Development** | Deploy automático ao merge em `develop` | Básico | git revert |
| **Staging** | Deploy automático após CI verde | Completo | Redeploy anterior |
| **Production** | Canary (10% → 50% → 100%) | Métricas RED | Automático se p95 > threshold |

### 10.2 Canary Release

```yaml
# config/deploy/canary.yml
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

  rollback:
    trigger: error_rate > 1% OR p95_latency > 3s
    action: automatic
```

### 10.3 Observability Checklist

```markdown
## Observability Checklist (pós-deploy)

### Logs
[ ] Logs estruturados (JSON) estão sendo emitidos?
[ ] tenantId presente em toda entrada?
[ ] Sem sensitive fields (PII, tokens)?

### Métricas
[ ] RED metrics (Rate, Errors, Duration) configuradas?
[ ] Métricas específicas da feature registradas?
[ ] Dashboards no Grafana atualizados?

### Tracing
[ ] OpenTelemetry spans propagados?
[ ] Attributes mínimos (tenantId, userId, featureName)?

### Alertas
[ ] Alertas P1/P2/P3 configurados?
[ ] Thresholds definidos com base no baseline?
[ ] On-call notificado?

### Health
[ ] GET /health responde 200?
[ ] Dependências (DB, Redis, RabbitMQ) saudáveis?
[ ] Readiness + Liveness probes configurados?
```

### 10.4 Quality Gate (G8 — Production)

| Critério | Exigência |
|----------|-----------|
| Canary aprovado em 10% e 50% | Obrigatório |
| Error rate < 1% em 5 minutos | Obrigatório |
| p95 latency < threshold | Obrigatório |
| Health check = pass | Obrigatório |
| Dashboards atualizados | Recomendado |
| Alertas configurados | Obrigatório |
| **Decisão:** Feature disponível para 100%? | SRE |

---

## 11. Estratégia de Prompts

### 11.1 Template Universal de Prompt

```
## ROLE
{papel: Desenvolvedor NestJS sênior / QA Engineer / Arquiteto de Software}

## CONTEXT
Projeto: BidFlow Platform
Stack: {tecnologias}
Padrões: DDD + CQRS + Hexagonal Architecture
Documentos de referência:
  - docs/architecture-principles.md
  - docs/ddd-enterprise.md
  - docs/coding-standards.md
  - docs/domain-events-catalog.md
  - docs/ai-development-workflow.md

## TASK
{tarefa específica}

## CONSTRAINTS
{restrições específicas}

## OUTPUT FORMAT
{formato esperado}
```

### 11.2 Prompts por Papel

| Papel | Prompt Base |
|-------|-------------|
| **Spec Analyst** | `speckit.specify + template spec-template.md + DDD + linguagem ubíqua` |
| **Backend Dev** | `NestJS + TypeScript + Prisma + DDD + CQRS + Hexagonal + coding-standards` |
| **QA Engineer** | `Jest + TDD + testcontainers + cobertura + cenários de borda` |
| **Architect** | `DDD + event storming + aggregate design + invariants + ADR` |
| **DevOps** | `GitHub Actions + Docker + Turborepo + canary + health check` |

---

## 12. Governança de IA

### 12.1 Regras de Uso

| Regra | Descrição |
|-------|-----------|
| **GOV-01** | Toda interação com IA é registrada (ferramenta, modelo, prompt, output) |
| **GOV-02** | Nenhum dado de produção real é enviado para IA externa sem anonimização |
| **GOV-03** | Código gerado por IA é tratado como código de terceiros — revisão obrigatória |
| **GOV-04** | O desenvolvedor é responsável pelo output da IA, não a ferramenta |
| **GOV-05** | IA não pode tomar decisões arquiteturais — apenas sugerir |
| **GOV-06** | Licenciamento de código gerado por IA deve ser verificado |

### 12.2 Log de Interações

```typescript
// common/audit/ai-interaction-log.ts
interface AiInteractionLog {
  id: string;
  timestamp: Date;
  developer: string;
  tool: string;                    // "speckit" | "copilot" | "chatgpt" | "claude"
  model: string;                   // "gpt-4o" | "claude-3.5" | "codestral"
  phase: string;                   // "spec" | "plan" | "code" | "test"
  taskId: string;                  // referência à task
  promptHash: string;              // hash do prompt (não armazena raw)
  outputFiles: string[];           // arquivos gerados/modificados
  reviewedBy: string;              // revisor humano
  reviewStatus: "approved" | "rejected" | "modified";
  duration: number;                // segundos
  tokensIn: number;
  tokensOut: number;
}
```

### 12.3 Proibições

- ❌ Usar IA para gerar código de autenticação/autorização sem revisão de segurança.
- ❌ Usar IA para modificar regras de negócio sem especificação.
- ❌ Usar IA para gerar queries SQL sem revisão de performance.
- ❌ Enviar dados reais de produção para LLMs externos.
- ❌ Commitar código gerado por IA sem passar por quality gates.

---

## 13. Métricas do Workflow

### 13.1 Métricas do Processo

| Métrica | Definição | Alvo | Coleta |
|---------|-----------|------|--------|
| **Cycle Time** | Dias entre G0 e G8 | ≤ 10 dias úteis | GitHub Projects |
| **Spec-to-Code Ratio** | Tempo spec / tempo total | ≥ 20% | speckit logs |
| **AI Acceptance Rate** | % de código IA aceito sem alterações | ≥ 70% | AI Interaction Log |
| **Test Coverage** | Cobertura de testes | ≥ 80% | SonarQube |
| **Bug Escape Rate** | Bugs em produção / total stories | ≤ 5% | Sentry + Jira |
| **Rework Rate** | PRs rejeitados / PRs totais | ≤ 10% | GitHub |
| **Deploy Frequency** | Deploys em produção por semana | ≥ 3 | CI/CD |

### 13.2 Métricas de IA

| Métrica | Definição | Alvo | Coleta |
|---------|-----------|------|--------|
| **Tokens/Sprint** | Consumo médio de tokens | Monitorar | AI Interaction Log |
| **Code Generation Ratio** | Linhas geradas por IA / total | ≤ 70% | git attribution |
| **Prompt Effectiveness** | % de prompts que geram output válido | ≥ 85% | speckit logs |
| **Review Time** | Tempo médio de revisão de código IA | ≤ 2h | GitHub |

---

## 14. Fluxograma Resumido

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FASE 0: DISCOVERY                              │
│  PM define problema, user stories, critérios de sucesso (sem IA)    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ G0: PM aprova
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FASE 1: SPEC (IA + humano)                     │
│  speckit.specify → revisão → ajustes → G1: spec aprovada           │
│  Artefatos: spec.md, openapi.yml, event-schemas, data-model.md     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ G1: Dev líder + autor aprovam
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FASE 2: PLAN (IA + humano)                     │
│  speckit.plan + speckit.tasks → revisão → G2: tasks aprovadas      │
│  Artefatos: plan.md, tasks.md, phases/                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ G2: Dev líder aprova
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FASE 3: CODE (IA-assisted)                        │
│  VOs → Entities → Repositories → Application → Infrastructure      │
│  speckit.implement + prompts específicos                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ G3: lint + typecheck + build + review
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FASE 4: TESTS (IA-generated)                      │
│  Testes unitários (70%) + integração (25%) + contrato (5%)         │
│  Prompts específicos por camada                                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ G4: QA aprova (coverage + testes OK)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FASE 5: ARCHITECTURE REVIEW (async)               │
│  Checklist + ADR → G5: Architecture Board aprova                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ G5: ARB aprova
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FASE 6: CI/CD (automated)                         │
│  GitHub Actions: lint → typecheck → build → test → security → push │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ G6: Pipeline verde
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FASE 7: SECURITY (automated + humano)             │
│  SAST + DAST + secrets + dependency scan → G7: Security OK        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ G7: Security Team aprova
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FASE 8: DEPLOY (automated)                        │
│  Canary 10% → 50% → 100% + observability + dashboards             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ G8: SRE aprova → FEATURE LIVE
                               ▼
                    ┌─────────────────────┐
                    │  MONITORAMENTO       │
                    │  Métricas RED        │
                    │  Alertas             │
                    │  Feedback loop       │
                    └─────────────────────┘
```

---

> **Revisão:** Este documento deve ser revisado trimestralmente ou quando nova versão de LLM significativa surgir.
> **Treinamento:** Todo novo desenvolvedor deve ler este documento antes de usar IA no projeto.
> **Violações:** Desvios documentados e revisados pelo Architecture Board. Reincidência = bloqueio de acesso a ferramentas de IA.
