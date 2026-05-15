# BidFlow Platform — Documentação Enterprise

> **Estrutura** baseada em DDD + Spec-Driven Development + Clean Architecture + Event-Driven Architecture
> **Última atualização:** 2026-05-15

---

## Estrutura de Pastas

```
docs/
├── README.md                          # Índice geral da documentação
│
├── specs/                             # Specs por bounded context (SDD YAML)
│   ├── foundation/                    # Princípios fundamentais
│   │   ├── architecture-principles.md # Princípios arquiteturais obrigatórios
│   │   ├── ddd-enterprise.md          # Modelo de domínio DDD enterprise
│   │   └── coding-standards.md        # Padrões de código TypeScript/NestJS
│   │
│   ├── saas/                          # Bounded Context: SaaS Multi-tenant
│   │   ├── auth-module.yml            # Spec YAML: Autenticação e Autorização
│   │   └── tenant-module.yml          # Spec YAML: Gestão de Tenants
│   │
│   ├── crm/                           # Bounded Context: CRM
│   │   ├── crm-module.yml             # Spec YAML: CRM completo
│   │   └── crm-architecture.md        # Arquitetura enterprise do CRM
│   │
│   ├── workflow/                      # Bounded Context: Workflow Engine
│   │   ├── workflow-engine.yml        # Spec YAML: Workflow Engine
│   │   ├── workflow-architecture.md   # Arquitetura enterprise do WF
│   │   ├── workflow-domain-layer.md   # Domain Layer completa
│   │   ├── workflow-application-layer.md  # Application Layer
│   │   └── workflow-api-layer.md      # API Layer
│   │
│   ├── licitacoes/                    # Bounded Context: Licitações Core
│   │   ├── tender-core.yml            # Spec YAML: Licitações V1
│   │   └── tender-core-v2.yml         # Spec YAML: Licitações V2 (completa)
│   │
│   └── ai/                            # Bounded Context: IA
│       └── (reservado para specs futuras)
│
├── adr/                               # Architecture Decision Records
│   ├── ADR-001-multi-tenant.md        # Estratégia multi-tenant
│   ├── ADR-002-ddd.md                # Adoção de DDD
│   ├── ADR-003-event-driven.md        # Arquitetura event-driven
│   ├── ADR-004-workflow-engine.md     # Motor de workflows
│   └── ADR-005-monorepo.md           # Estrutura monorepo
│
├── events/                            # Catálogo de eventos
│   ├── workflow-events.md             # Eventos do Workflow Engine
│   ├── workflow-events-architecture.md # Arquitetura de eventos do WF
│   ├── domain-events-catalog.md       # Catálogo global de domain events
│   └── schemas/                       # Schemas JSON/Event
│       └── ... (link para .specify/events/schemas/)
│
├── contracts/                         # Contratos de integração
│   ├── api/                           # Contratos de API
│   │   └── (reservado para OpenAPI/Swagger)
│   ├── events/                        # Contratos de eventos
│   │   └── (reservado para CloudEvents schemas)
│   └── dto/                           # Contratos de DTOs
│       └── (reservado para schemas compartilhados)
│
├── diagrams/                          # Diagramas arquiteturais
│   ├── architecture/                  # Diagramas de arquitetura geral
│   ├── workflows/                     # Diagramas de fluxo
│   └── domain/                        # Diagramas de domínio
│
├── reference/                         # Material de referência
│   └── ai-development-workflow.md     # Workflow de desenvolvimento com IA
│
├── operations/                        # Documentação operacional
│   └── (reservado para runbooks, deploy, monitoramento)
│
└── guides/                            # Guias de desenvolvimento
    └── (reservado para onboarding, guias de contribuição)
```

## Arquivo de Índice (docs/README.md)

Cada `specs/{context}/README.md` deve conter:
- Lista de specs do contexto
- Dependências entre specs
- Responsável pelo contexto
- Status (Draft, Review, Approved)

## Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Spec YAML | `{context}-{module}.yml` | `crm-module.yml` |
| Documento | `{context}-{description}.md` | `workflow-architecture.md` |
| ADR | `ADR-{NNN}-{titulo}.md` | `ADR-001-multi-tenant.md` |
| Event schema | `{context}-{event}-v{version}.json` | `workflow-stage-changed-v1.json` |
| Diagrama | `{context}-{tipo}.{ext}` | `crm-domain-model.puml` |

---

## Plano de Reorganização

### Fase 1: Fundação (completa)
- [x] `docs/specs/foundation/architecture-principles.md`
- [x] `docs/specs/foundation/ddd-enterprise.md`
- [x] `docs/specs/foundation/coding-standards.md`
- [x] `docs/specs/workflow/workflow-engine.yml`
- [x] `docs/specs/workflow/workflow-architecture.md`
- [x] `docs/specs/workflow/workflow-domain-layer.md`
- [x] `docs/specs/workflow/workflow-application-layer.md`
- [x] `docs/specs/workflow/workflow-api-layer.md`

### Fase 2: Eventos (completa)
- [x] `docs/events/workflow-events.md`
- [x] `docs/events/workflow-events-architecture.md`
- [x] `docs/events/domain-events-catalog.md`
- [x] `.specify/events/schemas/` (schemas JSON dos eventos)

### Fase 3: ADRs (pendente — criar templates)
- [ ] `docs/adr/ADR-001-multi-tenant.md`
- [ ] `docs/adr/ADR-002-ddd.md`
- [ ] `docs/adr/ADR-003-event-driven.md`
- [ ] `docs/adr/ADR-004-workflow-engine.md`
- [ ] `docs/adr/ADR-005-monorepo.md`

### Fase 4: CRM + Licitações (parcial)
- [x] `docs/specs/crm/crm-module.yml`
- [x] `docs/specs/crm/crm-architecture.md`
- [x] `docs/specs/licitacoes/tender-core.yml`
- [x] `docs/specs/licitacoes/tender-core-v2.yml`

### Fase 5: Migração de arquivos (aplicar)

```bash
# workflow docs → specs/workflow/
cp docs/workflow-architecture.md docs/specs/workflow/
cp docs/workflow-domain-layer.md docs/specs/workflow/
cp docs/workflow-application-layer.md docs/specs/workflow/
cp docs/workflow-api-layer.md docs/specs/workflow/
rm docs/workflow-architecture.md
rm docs/workflow-domain-layer.md
rm docs/workflow-application-layer.md
rm docs/workflow-api-layer.md

# Events → docs/events/
mv docs/workflow-events.md docs/events/
mv docs/workflow-events-architecture.md docs/events/

# Foundation → docs/specs/foundation/
mv docs/architecture-principles.md docs/specs/foundation/
mv docs/ddd-enterprise.md docs/specs/foundation/
mv docs/coding-standards.md docs/specs/foundation/

# CRM → docs/specs/crm/
mv docs/crm-architecture.md docs/specs/crm/

# Reference
mv docs/ai-development-workflow.md docs/reference/
mv docs/domain-events-catalog.md docs/events/
```

---

## Responsabilidades de Cada Pasta

| Pasta | Responsabilidade | Público-alvo |
|-------|-----------------|--------------|
| `docs/specs/{context}/` | Specs YAML (+ documentação) de cada bounded context | Devs, Arquiteto |
| `docs/adr/` | Decisões arquiteturais (imutáveis após aprovação) | Arquiteto, Tech Lead |
| `docs/events/` | Catálogo completo de eventos + schemas | Devs, Integradores |
| `docs/contracts/` | Contratos formais entre módulos/serviços | Equipes, Integradores |
| `docs/diagrams/` | Diagramas (C4, UML, arquitetura) | Todos |
| `docs/reference/` | Guias e workflows de desenvolvimento | Devs |
| `docs/operations/` | Runbooks, deploy, monitoramento | DevOps, SRE |
| `docs/guides/` | Onboarding, contribuição, boas práticas | Novos devs |

---

## Governança Arquitetural

1. **ADR obrigatório** para toda decisão arquitetural relevante
2. **Spec-first**: nova funcionalidade começa com spec YAML em `docs/specs/{context}/`
3. **Event-first**: novo evento registrado em `docs/events/` antes da implementação
4. **Review trimestral**: Architecture Review Board revisa a documentação
5. **Versionamento**: docs versionadas junto com o código (mesmo repositório)

---

## Sugestões para o Futuro

1. **Gerar site estático** via MkDocs ou Docusaurus a partir desta estrutura
2. **Automatizar validação** de ADRs (template check) no CI
3. **Integrar OpenAPI** gerado das specs YAML em `docs/contracts/api/`
4. **Criar diagramas C4** em `docs/diagrams/architecture/` usando PlantUML
5. **Adicionar `docs/specs/README.md`** como índice navegável por contexto
6. **Migrar `.specify/templates/`** para aproveitar a geração de código
