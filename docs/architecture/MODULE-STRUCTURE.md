# BidFlow Platform - Estrutura de Módulos NestJS

## Visão Geral dos Módulos

```
apps/
├── api-gateway/           # API Gateway com BFF Pattern
├── crm-service/           # CRM Domain
├── erp-service/           # ERP Domain  
├── bidding-service/      # Licitações (Core)
├── workflow-service/     # Workflow & Automation
├── saas-service/          # Billing & Subscription
├── ai-service/           # FastAPI - AI/ML
└── web-app/              # Next.js Frontend
```

---

## Estrutura do Módulo Bidding (Exemplo Completo)

```
apps/bidding-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   └── validation.ts
│   │
│   ├── domain/                    # CAMADA DE DOMÍNIO
│   │   ├── entities/
│   │   │   ├── bidding.entity.ts
│   │   │   ├── bidding-proposal.entity.ts
│   │   │   ├── bidding-document.entity.ts
│   │   │   └── bidding-analysis.entity.ts
│   │   │
│   │   ├── value-objects/
│   │   │   ├── money.vo.ts
│   │   │   ├── cnpj.vo.ts
│   │   │   ├── cpf.vo.ts
│   │   │   ├── address.vo.ts
│   │   │   └── percentage.vo.ts
│   │   │
│   │   ├── aggregates/
│   │   │   ├── bidding.aggregate.ts
│   │   │   └── proposal.aggregate.ts
│   │   │
│   │   ├── repositories/
│   │   │   ├── bidding.repository.interface.ts
│   │   │   ├── proposal.repository.interface.ts
│   │   │   └── document.repository.interface.ts
│   │   │
│   │   ├── services/
│   │   │   ├── bidding-domain.service.ts
│   │   │   ├── suitability-calculator.service.ts
│   │   │   └── deadline-validator.service.ts
│   │   │
│   │   ├── events/
│   │   │   ├── bidding.events.ts
│   │   │   └── proposal.events.ts
│   │   │
│   │   ├── errors/
│   │   │   ├── bidding-not-found.error.ts
│   │   │   ├── invalid-bidding-state.error.ts
│   │   │   └── deadline-passed.error.ts
│   │   │
│   │   └── types/
│   │       ├── bidding.types.ts
│   │       └── proposal.types.ts
│   │
│   ├── application/              # CAMADA DE APLICAÇÃO
│   │   ├── commands/
│   │   │   ├── bidding/
│   │   │   │   ├── create-bidding.command.ts
│   │   │   │   ├── update-bidding.command.ts
│   │   │   │   ├── publish-bidding.command.ts
│   │   │   │   ├── close-bidding.command.ts
│   │   │   │   └── delete-bidding.command.ts
│   │   │   └── proposal/
│   │   │       ├── submit-proposal.command.ts
│   │   │       └── withdraw-proposal.command.ts
│   │   │
│   │   ├── queries/
│   │   │   ├── bidding/
│   │   │   │   ├── get-bidding-by-id.query.ts
│   │   │   │   ├── list-biddings.query.ts
│   │   │   │   ├── search-biddings.query.ts
│   │   │   │   └── get-bidding-stats.query.ts
│   │   │   └── proposal/
│   │   │       ├── get-proposal-by-id.query.ts
│   │   │       └── list-proposals.query.ts
│   │   │
│   │   ├── handlers/
│   │   │   ├── commands/
│   │   │   │   ├── create-bidding.handler.ts
│   │   │   │   ├── update-bidding.handler.ts
│   │   │   │   └── ...
│   │   │   └── queries/
│   │   │       ├── get-bidding-by-id.handler.ts
│   │   │       └── list-biddings.handler.ts
│   │   │
│   │   ├── dto/
│   │   │   ├── input/
│   │   │   │   ├── create-bidding.dto.ts
│   │   │   │   ├── update-bidding.dto.ts
│   │   │   │   ├── create-proposal.dto.ts
│   │   │   │   └── bidding-filters.dto.ts
│   │   │   └── output/
│   │   │       ├── bidding-response.dto.ts
│   │   │       ├── proposal-response.dto.ts
│   │   │       └── bidding-list-response.dto.ts
│   │   │
│   │   ├── ports/
│   │   │   ├── inbound/
│   │   │   │   ├── bidding-service.port.ts
│   │   │   │   └── proposal-service.port.ts
│   │   │   └── outbound/
│   │   │       ├── bidding-repository.port.ts
│   │   │       ├── notification.port.ts
│   │   │       └── ai-analysis.port.ts
│   │   │
│   │   └── services/
│   │       ├── bidding-application.service.ts
│   │       └── proposal-application.service.ts
│   │
│   ├── infrastructure/           # CAMADA DE INFRAESTRUTURA
│   │   ├── persistence/
│   │   │   ├── prisma/
│   │   │   │   ├── bidding.prisma-repository.ts
│   │   │   │   ├── proposal.prisma-repository.ts
│   │   │   │   ├── mappers/
│   │   │   │   │   ├── bidding.mapper.ts
│   │   │   │   │   └── proposal.mapper.ts
│   │   │   │   └── schemas/
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   └── repositories/
│   │   │       ├── bidding.repository.ts
│   │   │       └── proposal.repository.ts
│   │   │
│   │   ├── messaging/
│   │   │   ├── rabbitmq/
│   │   │   │   ├── bidding-publisher.ts
│   │   │   │   └── events/
│   │   │   │       ├── bidding-created.event.ts
│   │   │   │       ├── bidding-closed.event.ts
│   │   │   │       └── proposal-submitted.event.ts
│   │   │   │
│   │   │   └── consumers/
│   │   │       └── bidding.consumer.ts
│   │   │
│   │   ├── cache/
│   │   │   ├── redis-bidding.repository.ts
│   │   │   └── caching.service.ts
│   │   │
│   │   └── external/
│   │       ├── ai-service.client.ts
│   │       └── notification-service.client.ts
│   │
│   └── presentation/             # CAMADA DE APRESENTAÇÃO
│       ├── controllers/
│       │   ├── bidding.controller.ts
│       │   ├── proposal.controller.ts
│       │   └── document.controller.ts
│       │
│       ├── guards/
│       │   ├── bidding-auth.guard.ts
│       │   └── proposal-ownership.guard.ts
│       │
│       ├── interceptors/
│       │   ├── logging.interceptor.ts
│       │   ├── timeout.interceptor.ts
│       │   └── transform.interceptor.ts
│       │
│       ├── filters/
│       │   └── domain-exception.filter.ts
│       │
│       └── decorators/
│           ├── tenant-context.decorator.ts
│           └── current-user.decorator.ts
│
├── test/
│   ├── unit/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   └── e2e/
│       ├── bidding.e2e-spec.ts
│       └── proposal.e2e-spec.ts
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## Estrutura do Módulo CRM

```
apps/crm-service/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── company.entity.ts
│   │   │   ├── contact.entity.ts
│   │   │   ├── deal.entity.ts
│   │   │   ├── activity.entity.ts
│   │   │   └── pipeline.entity.ts
│   │   ├── aggregates/
│   │   │   ├── company.aggregate.ts
│   │   │   └── deal.aggregate.ts
│   │   ├── repositories/
│   │   ├── services/
│   │   └── events/
│   │
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   ├── handlers/
│   │   ├── dto/
│   │   └── services/
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   ├── messaging/
│   │   └── cache/
│   │
│   └── presentation/
│       ├── controllers/
│       ├── guards/
│       └── interceptors/
```

---

## Estrutura do Módulo ERP

```
apps/erp-service/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── project.entity.ts
│   │   │   ├── task.entity.ts
│   │   │   ├── milestone.entity.ts
│   │   │   ├── transaction.entity.ts
│   │   │   ├── invoice.entity.ts
│   │   │   ├── contract.entity.ts
│   │   │   └── cost-center.entity.ts
│   │   ├── aggregates/
│   │   │   ├── project.aggregate.ts
│   │   │   └── transaction.aggregate.ts
│   │   └── ...
│   │
│   ├── application/
│   │   ├── commands/       # Project, Task, Transaction commands
│   │   ├── queries/        # Reports, Dashboards queries
│   │   └── services/
│   │
│   └── infrastructure/
```

---

## Estrutura do Módulo Workflow

```
apps/workflow-service/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── workflow.entity.ts
│   │   │   ├── instance.entity.ts
│   │   │   ├── task.entity.ts
│   │   │   └── trigger.entity.ts
│   │   ├── aggregates/
│   │   │   ├── workflow.aggregate.ts
│   │   │   └── instance.aggregate.ts
│   │   ├── services/
│   │   │   ├── workflow-engine.service.ts
│   │   │   └── node-executor.service.ts
│   │   └── events/
│   │
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-workflow.command.ts
│   │   │   ├── activate-workflow.command.ts
│   │   │   ├── trigger-workflow.command.ts
│   │   │   └── complete-task.command.ts
│   │   └── queries/
│   │
│   └── infrastructure/
│       ├── persistence/
│       └── messaging/
```

---

## Estrutura do Módulo SaaS

```
apps/saas-service/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── subscription.entity.ts
│   │   │   ├── invoice.entity.ts
│   │   │   ├── payment.entity.ts
│   │   │   ├── plan.entity.ts
│   │   │   └── usage-metric.entity.ts
│   │   ├── aggregates/
│   │   │   ├── subscription.aggregate.ts
│   │   │   └── invoice.aggregate.ts
│   │   └── services/
│   │       ├── billing.service.ts
│   │       └── usage-calculator.service.ts
│   │
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-subscription.command.ts
│   │   │   ├── upgrade-plan.command.ts
│   │   │   ├── process-payment.command.ts
│   │   │   └── generate-invoice.command.ts
│   │   └── queries/
│   │
│   └── infrastructure/
│       ├── persistence/
│       ├── payment-gateways/
│       │   ├── stripe.adapter.ts
│       │   └── pagseguro.adapter.ts
│       └── webhooks/
```

---

## Estrutura do Módulo AI (Python FastAPI)

```
apps/ai-service/
├── src/
│   ├── main.py
│   ├── api/
│   │   ├── routes/
│   │   │   ├── analysis.routes.py
│   │   │   ├── prediction.routes.py
│   │   │   └── nlp.routes.py
│   │   └── dependencies.py
│   │
│   ├── services/
│   │   ├── bidding_analyzer.py
│   │   ├── suitability_calculator.py
│   │   ├── price_predictor.py
│   │   ├── text_classifier.py
│   │   └── nlp_processor.py
│   │
│   ├── models/
│   │   ├── transformer/
│   │   ├── sklearn/
│   │   └── llm/
│   │
│   ├── schemas/
│   │   ├── request.py
│   │   └── response.py
│   │
│   └── utils/
│       ├── cache.py
│       └── logger.py
│
├── models/                    # Modelos treinados
│   ├── bidding_classifier/
│   ├── price_predictor/
│   └── nlp_model/
│
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

## Estrutura do API Gateway

```
apps/api-gateway/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/
│   │   ├── configuration.ts
│   │   └── cors.ts
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   ├── tenant.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── error.interceptor.ts
│   │   │   └── cache.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── decorators/
│   │       ├── current-user.decorator.ts
│   │       └── tenant.decorator.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── dto/
│   │   │
│   │   ├── proxy/
│   │   │   ├── proxy.module.ts
│   │   │   ├── proxy.service.ts
│   │   │   └── proxy.controller.ts
│   │   │
│   │   └── health/
│   │       ├── health.controller.ts
│   │       └── health.module.ts
│   │
│   └── filters/
│
└── nginx.conf
```

---

## Estrutura do Frontend (Next.js)

```
apps/web-app/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── crm/
│   │   │   ├── erp/
│   │   │   ├── bidding/
│   │   │   ├── workflow/
│   │   │   └── settings/
│   │   │
│   │   └── api/
│   │       └── [...routes]/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Table/
│   │   │   └── Card/
│   │   │
│   │   ├── crm/
│   │   │   ├── CompanyCard/
│   │   │   ├── DealPipeline/
│   │   │   └── ContactList/
│   │   │
│   │   ├── bidding/
│   │   │   ├── BiddingCard/
│   │   │   ├── BiddingForm/
│   │   │   ├── ProposalBuilder/
│   │   │   └── AnalysisPanel/
│   │   │
│   │   ├── erp/
│   │   ├── workflow/
│   │   └── layout/
│   │       ├── Sidebar/
│   │       ├── Header/
│   │       └── TenantSelector/
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   ├── useBidding.ts
│   │   └── useMutation.ts
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── bidding.service.ts
│   │   │   ├── crm.service.ts
│   │   │   └── erp.service.ts
│   │   │
│   │   └── realtime/
│   │       └── websocket.ts
│   │
│   ├── store/
│   │   ├── auth/
│   │   ├── tenant/
│   │   └── ui/
│   │
│   ├── types/
│   │   ├── domain/
│   │   │   ├── bidding.types.ts
│   │   │   ├── crm.types.ts
│   │   │   └── erp.types.ts
│   │   └── shared/
│   │
│   └── utils/
│       ├── currency.ts
│       ├── date.ts
│       └── validation.ts
│
├── public/
│   ├── images/
│   └── icons/
│
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Pacotes Compartilhados

```
packages/
├── shared/
│   ├── src/
│   │   ├── types/
│   │   │   ├── common/
│   │   │   │   ├── tenant.types.ts
│   │   │   │   ├── user.types.ts
│   │   │   │   └── pagination.types.ts
│   │   │   └── api/
│   │   │       └── api-response.types.ts
│   │   │
│   │   ├── constants/
│   │   │   ├── http-status.ts
│   │   │   └── error-codes.ts
│   │   │
│   │   ├── enums/
│   │   │   ├── tenant-status.enum.ts
│   │   │   ├── user-role.enum.ts
│   │   │   └── ...
│   │   │
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   └── formatting.ts
│   │   │
│   │   └── index.ts
│   │
│   └── package.json
│
├── kernel/
│   ├── src/
│   │   ├── events/
│   │   │   ├── domain-event.interface.ts
│   │   │   ├── event-bus.ts
│   │   │   └── event-handler.interface.ts
│   │   │
│   │   ├── commands/
│   │   │   ├── command.interface.ts
│   │   │   ├── command-bus.ts
│   │   │   └── command-handler.interface.ts
│   │   │
│   │   ├── queries/
│   │   │   ├── query.interface.ts
│   │   │   ├── query-bus.ts
│   │   │   └── query-handler.interface.ts
│   │   │
│   │   ├── exceptions/
│   │   │   ├── domain-exception.ts
│   │   │   └── validation-exception.ts
│   │   │
│   │   ├── base/
│   │   │   ├── aggregate.ts
│   │   │   ├── entity.ts
│   │   │   ├── value-object.ts
│   │   │   └── repository.ts
│   │   │
│   │   └── index.ts
│   │
│   └── package.json
│
└── database/
    ├── prisma/
    │   ├── schema.prisma
    │   ├── seeders/
    │   │   ├── tenant.seeder.ts
    │   │   ├── plan.seeder.ts
    │   │   └── user.seeder.ts
    │   │
    │   └── migrations/
    │
    └── package.json
```