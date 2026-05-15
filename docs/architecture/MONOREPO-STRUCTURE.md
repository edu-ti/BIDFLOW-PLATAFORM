# BidFlow Platform - Enterprise Monorepo

## Visão Geral da Estrutura

```
bidflow-platform/
├── apps/                          # Aplicações executáveis
│   ├── api-gateway/               # API Gateway NestJS
│   ├── crm-service/               # Microsserviço CRM
│   ├── erp-service/               # Microsserviço ERP
│   ├── bidding-service/           # Microsserviço Licitações
│   ├── workflow-service/          # Microsserviço Workflow
│   ├── saas-service/              # Microsserviço SaaS/Billing
│   ├── ai-service/                # FastAPI Python - AI/ML
│   └── web-app/                   # Next.js 14 Frontend
│
├── packages/                     # Pacotes compartilhados
│   ├── shared/                    # Tipos, enums, utils
│   ├── kernel/                   # DDD Kernel (Events, CQRS)
│   ├── database/                  # Prisma schemas e migrations
│   ├── ui/                        # Componentes React compartilhados
│   ├── tsconfig/                  # TSConfig base
│   └── eslint/                    # ESLint config base
│
├── infrastructure/                # Infraestrutura
│   ├── docker/                    # Dockerfiles e compose
│   ├── kubernetes/                # K8s manifests
│   ├── terraform/                 # IaC
│   └── ci-cd/                     # GitHub Actions
│
├── docs/                          # Documentação
│   ├── architecture/
│   ├── api/
│   └── functional/
│
├── turbo.json                     # Turborepo config
├── package.json                   # Root package.json
├── tsconfig.json                  # Base TSConfig
├── .eslintrc.js                   # Root ESLint
├── .prettierrc                    # Prettier config
├── .gitignore
└── README.md
```

---

## Estrutura Detalhada de Arquivos

```
bidflow-platform/
│
├── apps/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── bootstrap.ts
│   │   │   ├── config/
│   │   │   │   ├── configuration.ts
│   │   │   │   └── validation.ts
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   ├── tenant.guard.ts
│   │   │   │   │   └── roles.guard.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── logging.interceptor.ts
│   │   │   │   │   ├── transform.interceptor.ts
│   │   │   │   │   └── error.interceptor.ts
│   │   │   │   ├── filters/
│   │   │   │   │   ├── http-exception.filter.ts
│   │   │   │   │   └── validation.filter.ts
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── current-user.decorator.ts
│   │   │   │   │   └── tenant.decorator.ts
│   │   │   │   └── middleware/
│   │   │   │       ├── tenant.middleware.ts
│   │   │   │       └── correlation-id.middleware.ts
│   │   │   │
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── strategies/
│   │   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   │   └── local.strategy.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── login.dto.ts
│   │   │   │   │       └── register.dto.ts
│   │   │   │   │
│   │   │   │   ├── health/
│   │   │   │   │   ├── health.controller.ts
│   │   │   │   │   ├── health.module.ts
│   │   │   │   │   └── indicators/
│   │   │   │   │       ├── database.indicator.ts
│   │   │   │   │       ├── redis.indicator.ts
│   │   │   │   │       └── rabbitmq.indicator.ts
│   │   │   │   │
│   │   │   │   └── proxy/
│   │   │   │       ├── proxy.module.ts
│   │   │   │       ├── proxy.service.ts
│   │   │   │       └── proxy.controller.ts
│   │   │   │
│   │   │   └── filters/
│   │   │
│   │   ├── test/
│   │   │   ├── app.e2e-spec.ts
│   │   │   └── jest-e2e.json
│   │   │
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   └── .env.example
│   │
│   ├── crm-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── contact.entity.ts
│   │   │   │   │   ├── company.entity.ts
│   │   │   │   │   ├── deal.entity.ts
│   │   │   │   │   └── activity.entity.ts
│   │   │   │   ├── aggregates/
│   │   │   │   │   ├── company.aggregate.ts
│   │   │   │   │   └── deal.aggregate.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── email.vo.ts
│   │   │   │   │   └── phone.vo.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── company.repository.interface.ts
│   │   │   │   │   └── contact.repository.interface.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── crm-domain.service.ts
│   │   │   │   │   └── lead-scoring.service.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── contact-created.event.ts
│   │   │   │   │   ├── deal-won.event.ts
│   │   │   │   │   └── company-converted.event.ts
│   │   │   │   └── errors/
│   │   │   │       └── domain.exception.ts
│   │   │   │
│   │   │   ├── application/
│   │   │   │   ├── commands/
│   │   │   │   │   ├── contacts/
│   │   │   │   │   │   ├── create-contact.command.ts
│   │   │   │   │   │   └── update-contact.command.ts
│   │   │   │   │   └── companies/
│   │   │   │   │       ├── create-company.command.ts
│   │   │   │   │       └── convert-to-client.command.ts
│   │   │   │   ├── queries/
│   │   │   │   │   ├── contacts/
│   │   │   │   │   │   ├── get-contact-by-id.query.ts
│   │   │   │   │   │   └── list-contacts.query.ts
│   │   │   │   │   └── companies/
│   │   │   │   │       └── get-company-by-id.query.ts
│   │   │   │   ├── handlers/
│   │   │   │   │   ├── commands/
│   │   │   │   │   └── queries/
│   │   │   │   ├── dto/
│   │   │   │   │   ├── input/
│   │   │   │   │   │   ├── create-contact.dto.ts
│   │   │   │   │   │   └── create-company.dto.ts
│   │   │   │   │   └── output/
│   │   │   │   │   │   ├── contact-response.dto.ts
│   │   │   │   │   │   └── company-response.dto.ts
│   │   │   │   └── services/
│   │   │   │       └── crm-application.service.ts
│   │   │   │
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── prisma/
│   │   │   │   │   │   ├── repositories/
│   │   │   │   │   │   │   ├── prisma-company.repository.ts
│   │   │   │   │   │   │   └── prisma-contact.repository.ts
│   │   │   │   │   │   └── mappers/
│   │   │   │   │   │       ├── company.mapper.ts
│   │   │   │   │   │       └── contact.mapper.ts
│   │   │   │   │   ├── repositories/
│   │   │   │   │   │   ├── company.repository.ts
│   │   │   │   │   │   └── contact.repository.ts
│   │   │   │   │   └── seeders/
│   │   │   │   │       └── crm.seeder.ts
│   │   │   │   │
│   │   │   │   ├── messaging/
│   │   │   │   │   ├── rabbitmq/
│   │   │   │   │   │   ├── publishers/
│   │   │   │   │   │   │   └── crm-event.publisher.ts
│   │   │   │   │   │   └── consumers/
│   │   │   │   │   │       └── crm-event.consumer.ts
│   │   │   │   │   └── events/
│   │   │   │   │       └── crm.events.ts
│   │   │   │   │
│   │   │   │   ├── cache/
│   │   │   │   │   ├── redis-cache.service.ts
│   │   │   │   │   └── keys/
│   │   │   │   │       └── crm.cache-keys.ts
│   │   │   │   │
│   │   │   │   └── external/
│   │   │   │       └── email.service.ts
│   │   │   │
│   │   │   └── presentation/
│   │   │       ├── controllers/
│   │   │       │   ├── contacts.controller.ts
│   │   │       │   ├── companies.controller.ts
│   │   │       │   └── deals.controller.ts
│   │   │       ├── guards/
│   │   │       │   └── ownership.guard.ts
│   │   │       └── interceptors/
│   │   │           └── response.interceptor.ts
│   │   │
│   │   ├── test/
│   │   │   ├── unit/
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   └── infrastructure/
│   │   │   └── e2e/
│   │   │       ├── contacts.e2e-spec.ts
│   │   │       └── companies.e2e-spec.ts
│   │   │
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   ├── bidding-service/           # Mesmo padrão do CRM
│   │
│   ├── erp-service/              # Mesmo padrão do CRM
│   │
│   ├── workflow-service/         # Mesmo padrão do CRM
│   │
│   ├── saas-service/            # Mesmo padrão do CRM
│   │
│   ├── ai-service/
│   │   ├── src/
│   │   │   ├── main.py
│   │   │   ├── app.py
│   │   │   ├── api/
│   │   │   │   ├── routes/
│   │   │   │   │   ├── analysis.routes.py
│   │   │   │   │   ├── prediction.routes.py
│   │   │   │   │   └── nlp.routes.py
│   │   │   │   ├── deps.py
│   │   │   │   └── exceptions.py
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── bidding_analyzer.py
│   │   │   │   ├── suitability_calculator.py
│   │   │   │   ├── price_predictor.py
│   │   │   │   ├── nlp_processor.py
│   │   │   │   └── recommendation_engine.py
│   │   │   │
│   │   │   ├── models/
│   │   │   │   ├── transformer/
│   │   │   │   │   └── classifier.py
│   │   │   │   ├── sklearn/
│   │   │   │   │   └── regressor.py
│   │   │   │   └── llm/
│   │   │   │       └── generator.py
│   │   │   │
│   │   │   ├── schemas/
│   │   │   │   ├── request.py
│   │   │   │   └── response.py
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── cache.py
│   │   │       ├── logger.py
│   │   │       └── metrics.py
│   │   │
│   │   ├── models/               # Modelos treinados
│   │   │   ├── bidding_classifier/
│   │   │   ├── price_predictor/
│   │   │   └── nlp_model/
│   │   │
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   │
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── pyproject.toml
│   │   ├── uv.lock
│   │   └── .env.example
│   │
│   └── web-app/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/
│       │   │   │   ├── login/
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── components/
│       │   │   │   └── register/
│       │   │   │       ├── page.tsx
│       │   │   │       └── components/
│       │   │   │
│       │   │   ├── (dashboard)/
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── dashboard/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── crm/
│       │   │   │   │   ├── contacts/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── companies/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── deals/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   └── analytics/
│       │   │   │   │       └── page.tsx
│       │   │   │   │
│       │   │   │   ├── erp/
│       │   │   │   │   ├── projects/
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── invoices/
│       │   │   │   │   └── finances/
│       │   │   │   │       └── page.tsx
│       │   │   │   │
│       │   │   │   ├── bidding/
│       │   │   │   │   ├── list/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── proposals/
│       │   │   │   │   └── analytics/
│       │   │   │   │       └── page.tsx
│       │   │   │   │
│       │   │   │   ├── workflow/
│       │   │   │   │   ├── workflows/
│       │   │   │   │   ├── instances/
│       │   │   │   │   └── tasks/
│       │   │   │   │
│       │   │   │   └── settings/
│       │   │   │       ├── profile/
│       │   │   │       ├── tenant/
│       │   │   │       ├── billing/
│       │   │   │       └── team/
│       │   │   │
│       │   │   └── api/
│       │   │       └── [...trpc]/
│       │   │
│       │   ├── components/
│       │   │   ├── ui/                    # Componentes base
│       │   │   │   ├── button.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   ├── select.tsx
│       │   │   │   ├── modal.tsx
│       │   │   │   ├── table.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── avatar.tsx
│       │   │   │   └── badge.tsx
│       │   │   │
│       │   │   ├── layout/                # Componentes de layout
│       │   │   │   ├── sidebar.tsx
│       │   │   │   ├── header.tsx
│       │   │   │   ├── tenant-selector.tsx
│       │   │   │   └── breadcrumbs.tsx
│       │   │   │
│       │   │   ├── crm/                   # Componentes CRM
│       │   │   │   ├── contact-card.tsx
│       │   │   │   ├── company-form.tsx
│       │   │   │   ├── deal-pipeline.tsx
│       │   │   │   └── activity-timeline.tsx
│       │   │   │
│       │   │   ├── bidding/               # Componentes Bidding
│       │   │   │   ├── bidding-card.tsx
│       │   │   │   ├── bidding-filters.tsx
│       │   │   │   ├── proposal-builder.tsx
│       │   │   │   └── analysis-panel.tsx
│       │   │   │
│       │   │   ├── erp/                   # Componentes ERP
│       │   │   │   ├── project-card.tsx
│       │   │   │   ├── invoice-form.tsx
│       │   │   │   └── gantt-chart.tsx
│       │   │   │
│       │   │   └── shared/                # Componentes compartilhados
│       │   │       ├── data-table.tsx
│       │   │       ├── date-picker.tsx
│       │   │       └── file-upload.tsx
│       │   │
│       │   ├── hooks/
│       │   │   ├── use-auth.ts
│       │   │   ├── use-tenant.ts
│       │   │   ├── use-mutation.ts
│       │   │   ├── use-query.ts
│       │   │   └── use-notification.ts
│       │   │
│       │   ├── services/
│       │   │   ├── api/
│       │   │   │   ├── client.ts
│       │   │   │   ├── bidding.service.ts
│       │   │   │   ├── crm.service.ts
│       │   │   │   ├── erp.service.ts
│       │   │   │   └── workflow.service.ts
│       │   │   │
│       │   │   └── realtime/
│       │   │       └── websocket.ts
│       │   │
│       │   ├── store/
│       │   │   ├── auth-store.ts
│       │   │   ├── tenant-store.ts
│       │   │   └── ui-store.ts
│       │   │
│       │   ├── lib/
│       │   │   ├── trpc/
│       │   │   │   ├── client.ts
│       │   │   │   ├── server.ts
│       │   │   │   └── routers/
│       │   │   │       ├── _app.ts
│       │   │   │       ├── bidding.ts
│       │   │   │       └── crm.ts
│       │   │   │
│       │   │   ├── utils.ts
│       │   │   └── constants.ts
│       │   │
│       │   └── types/
│       │       ├── domain/
│       │       │   ├── bidding.types.ts
│       │       │   ├── crm.types.ts
│       │       │   └── erp.types.ts
│       │       └── shared/
│       │           ├── api.types.ts
│       │           └── ui.types.ts
│       │
│       ├── public/
│       │   ├── images/
│       │   └── icons/
│       │
│       ├── test/
│       │   ├── e2e/
│       │   └── visual/
│       │
│       ├── Dockerfile
│       ├── docker-compose.yml
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── .env.example
│
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── common/
│   │   │   │   │   ├── tenant.types.ts
│   │   │   │   │   ├── user.types.ts
│   │   │   │   │   ├── pagination.types.ts
│   │   │   │   │   └── api-response.types.ts
│   │   │   │   │
│   │   │   │   └── domain/
│   │   │   │       ├── bidding.types.ts
│   │   │   │       ├── crm.types.ts
│   │   │   │       ├── erp.types.ts
│   │   │   │       └── workflow.types.ts
│   │   │   │
│   │   │   ├── enums/
│   │   │   │   ├── tenant-status.enum.ts
│   │   │   │   ├── user-role.enum.ts
│   │   │   │   ├── bidding-status.enum.ts
│   │   │   │   ├── deal-stage.enum.ts
│   │   │   │   └── subscription-status.enum.ts
│   │   │   │
│   │   │   ├── constants/
│   │   │   │   ├── http-status.ts
│   │   │   │   ├── error-codes.ts
│   │   │   │   └── pagination.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── validation.ts
│   │   │   │   ├── formatting.ts
│   │   │   │   ├── currency.ts
│   │   │   │   ├── date.ts
│   │   │   │   └── string.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── kernel/
│   │   ├── src/
│   │   │   ├── events/
│   │   │   │   ├── domain-event.interface.ts
│   │   │   │   ├── event-bus.interface.ts
│   │   │   │   ├── event-handler.interface.ts
│   │   │   │   └── impl/
│   │   │   │       ├── event-bus.ts
│   │   │   │       └── domain-event.ts
│   │   │   │
│   │   │   ├── commands/
│   │   │   │   ├── command.interface.ts
│   │   │   │   ├── command-bus.interface.ts
│   │   │   │   ├── command-handler.interface.ts
│   │   │   │   └── impl/
│   │   │   │       ├── command-bus.ts
│   │   │   │       └── command.ts
│   │   │   │
│   │   │   ├── queries/
│   │   │   │   ├── query.interface.ts
│   │   │   │   ├── query-bus.interface.ts
│   │   │   │   ├── query-handler.interface.ts
│   │   │   │   └── impl/
│   │   │   │       ├── query-bus.ts
│   │   │   │       └── query.ts
│   │   │   │
│   │   │   ├── exceptions/
│   │   │   │   ├── domain.exception.ts
│   │   │   │   ├── validation.exception.ts
│   │   │   │   ├── not-found.exception.ts
│   │   │   │   └── forbidden.exception.ts
│   │   │   │
│   │   │   ├── base/
│   │   │   │   ├── aggregate.ts
│   │   │   │   ├── entity.ts
│   │   │   │   ├── value-object.ts
│   │   │   │   ├── repository.ts
│   │   │   │   └── identifier.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── test/
│   │
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   ├── seeders/
│   │   │   │   ├── tenant.seeder.ts
│   │   │   │   ├── plan.seeder.ts
│   │   │   │   └── user.seeder.ts
│   │   │   └── clients/
│   │   │       ├── crm.client.ts
│   │   │       ├── erp.client.ts
│   │   │       └── bidding.client.ts
│   │   │
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── modal.tsx
│   │   │   ├── hooks/
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   └── cn.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tailwind.config.ts
│   │
│   ├── tsconfig/
│   │   ├── base.json
│   │   ├── next.json
│   │   └── node.json
│   │
│   └── eslint/
│       └── index.js
│
├── infrastructure/
│   ├── docker/
│   │   ├── services/
│   │   │   ├── postgres/
│   │   │   │   └── Dockerfile
│   │   │   ├── redis/
│   │   │   │   └── Dockerfile
│   │   │   ├── rabbitmq/
│   │   │   │   └── Dockerfile
│   │   │   └── nginx/
│   │   │       └── Dockerfile
│   │   │
│   │   ├── development/
│   │   │   └── docker-compose.yml
│   │   │
│   │   └── production/
│   │       └── docker-compose.yml
│   │
│   ├── kubernetes/
│   │   ├── base/
│   │   ├── services/
│   │   └── overlays/
│   │
│   ├── terraform/
│   │   ├── modules/
│   │   ├── environments/
│   │   └── main.tf
│   │
│   └── ci-cd/
│       ├── github/
│       │   ├── workflows/
│       │   │   ├── ci.yml
│       │   │   ├── cd-staging.yml
│       │   │   └── cd-production.yml
│       │   └── actions/
│       │       ├── docker-build/
│       │       └── test/
│       │
│       └── jenkins/
│           └── Jenkinsfile
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── functional/
│
├── turbo.json
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── .gitignore
└── README.md
```

---

## Arquivos de Configuração

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env*", "tsconfig.json"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.ts", "test/**/*.ts", "*.config.*"]
    },
    "test:e2e": {
      "dependsOn": ["build", "db:seed"],
      "outputs": []
    },
    "db:generate": {
      "dependsOn": ["^db:generate"]
    },
    "db:migrate": {
      "dependsOn": ["db:generate"]
    },
    "db:seed": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Root package.json

```json
{
  "name": "bidflow-platform",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "clean": "turbo run clean",
    "db:generate": "turbo run db:generate",
    "db:migrate": "turbo run db:migrate",
    "db:seed": "turbo run db:seed",
    "docker:build": "docker compose -f infrastructure/docker/development/docker-compose.yml build",
    "docker:up": "docker compose -f infrastructure/docker/development/docker-compose.yml up -d",
    "docker:down": "docker compose -f infrastructure/docker/development/docker-compose.yml down"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### tsconfig/base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": true,
    "noEmit": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@bidflow/shared": ["packages/shared/src"],
      "@bidflow/kernel": ["packages/kernel/src"],
      "@bidflow/database": ["packages/database/prisma"],
      "@bidflow/ui": ["packages/ui/src"]
    }
  },
  "exclude": ["node_modules", "dist", "build", ".turbo"]
}
```

### Docker Compose (Development)

```yaml
version: '3.9'

services:
  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: bidflow
      POSTGRES_PASSWORD: bidflow_dev
      POSTGRES_DB: bidflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bidflow"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: bidflow
      RABBITMQ_DEFAULT_PASS: bidflow_dev
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  # API Gateway
  api-gateway:
    build:
      context: ../apps/api-gateway
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://bidflow:bidflow_dev@postgres:5432/bidflow
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://bidflow:bidflow_dev@rabbitmq:5672
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
      rabbitmq:
        condition: service_started

  # Web App
  web-app:
    build:
      context: ../apps/web-app
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      NEXT_PUBLIC_API_URL: http://api-gateway:3000

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

---

## GitHub Actions CI/CD

### CI Pipeline

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: turbo run lint

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: turbo run test
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: turbo run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: apps/**/dist

  docker-build:
    name: Docker Build
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - run: |
          docker build -f apps/api-gateway/Dockerfile -t bidflow/api-gateway:${{ github.sha }} .
          docker build -f apps/web-app/Dockerfile -t bidflow/web-app:${{ github.sha }} .
      - run: docker push bidflow/api-gateway:${{ github.sha }}
      - run: docker push bidflow/web-app:${{ github.sha }}
```

---

## Convenções de Código

### Estrutura de Arquivos TypeScript/NestJS

```
src/
├── domain/              # Camada de domínio (DDD)
│   ├── entities/        # Entidades
│   ├── value-objects/   # Value Objects
│   ├── aggregates/      # Aggregate Roots
│   ├── repositories/   # Interfaces de repositório
│   ├── services/        # Domain Services
│   ├── events/         # Eventos de domínio
│   └── errors/         # Exceções de domínio
│
├── application/         # Camada de aplicação
│   ├── commands/       # CQRS Commands
│   ├── queries/        # CQRS Queries
│   ├── handlers/       # Command/Query Handlers
│   ├── dto/            # Data Transfer Objects
│   ├── ports/          # Portas de aplicação
│   └── services        # Application Services
│
├── infrastructure/     # Camada de infraestrutura
│   ├── persistence/    # Repositórios concretos
│   ├── messaging/      # RabbitMQ,Eventos
│   ├── cache/         # Redis
│   └── external/      # Integrações externas
│
└── presentation/       # Camada de apresentação
    ├── controllers/   # NestJS Controllers
    ├── guards/        # Guards
    ├── interceptors/  # Interceptors
    ├── filters/       # Filters
    └── decorators/   # Decorators
```

### Nomeação

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Arquivos | kebab-case | `bidding.service.ts` |
| Classes | PascalCase | `CreateBiddingCommand` |
| Interfaces | PascalCase + sufixo | `IBiddingRepository` |
| Enums | PascalCase | `TenantStatus` |
| Constantes | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Variáveis | camelCase | `biddingList` |
|Métodos| camelCase | `findAll()` |

### Imports

```typescript
// 1. External imports (npm)
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// 2. Internal imports (packages)
import { DomainEvent } from '@bidflow/kernel/events';
import { TenantContext } from '@bidflow/shared/types';

// 3. Relative imports (local)
import { BiddingMapper } from '../mappers/bidding.mapper';
import { CreateBiddingDto } from '../dto';

// 4. Type imports
import type { CreateBiddingCommand } from './create-bidding.command';
```

---

## Responsabilidades por Camada

### Domain Layer
- **Entities**: Estado e comportamento de objetos de negócio
- **Value Objects**: Objetos imutáveis sem identidade
- **Aggregates**: Fronteira transacional e raiz de agregação
- **Repositories**: Interface para acesso a dados
- **Domain Services**: Lógica de negócio que não pertence a entidades

### Application Layer
- **Commands**: Intenções de mudança de estado
- **Queries**: Consultas de dados
- **Handlers**: Coordenação de execução de commands/queries
- **DTOs**: Objetos de transferência de dados
- **Ports**: Interfaces para dependências externas

### Infrastructure Layer
- **Persistence**: Implementação de repositories com Prisma
- **Messaging**: Publicação e consumo de eventos
- **Cache**: Integração com Redis
- **External**: Integrações com serviços externos

### Presentation Layer
- **Controllers**: Endpoints HTTP
- **Guards**: Autorização e autenticação
- **Interceptors**: Transformação de request/response
- **Filters**: Tratamento de exceções

---

## Executando o Projeto

```bash
# Install dependencies
pnpm install

# Run all services in development
pnpm docker:up

# Run specific service
cd apps/api-gateway && pnpm run dev

# Run tests
pnpm test

# Build all
pnpm build

# Database operations
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Lint
pnpm lint
pnpm lint:fix
```