# @bidflow/domain

> Domain-Driven Design abstractions para o BidFlow Platform.

---

## Estrutura

```
src/
├── abstractions/
│   ├── aggregate-root.ts       → AggregateRoot<TId> com domain events
│   ├── entity.ts               → Entity<TId> com domain events
│   └── value-object.ts         → ValueObject com equals() profundo
├── aggregates/                 → Agregados específicos (reservado)
├── entities/                   → Entidades específicas (reservado)
├── events/
│   └── domain-event.ts         → DomainEvent base (eventId, tenantId, routingKey)
├── exceptions/
│   └── index.ts                → 10 classes de exceção
├── repositories/
│   └── index.ts                → Repository, TenantRepository, Pagination
├── services/
│   └── domain-service.ts       → DomainService base stateless
├── policies/
│   └── index.ts                → Policy, BasePolicy, CompositePolicy
├── rules/
│   └── index.ts                → BusinessRule, RuleSet, SimpleRule
├── value-objects/
│   └── index.ts                → Money, Email, Identifier, Percentage, DateRange, Address
├── specifications/
│   └── index.ts                → Specification<T> com and/or/not
├── tenant/
│   └── index.ts                → TenantContext, TenantScoped, TenantConfig
├── audit/
│   └── index.ts                → AuditInfo, SoftDeletable, AuditEntry
├── observability/
│   └── index.ts                → DomainEventMonitor, DomainMetric
├── types/
│   └── index.ts                → UUID, Result<T,E>, Guard
└── utils/                      → Utilitários (reservado)
```

## Entry Points

```typescript
import { AggregateRoot, Entity, ValueObject } from '@bidflow/domain/abstractions';
import { DomainEvent } from '@bidflow/domain/events';
import { DomainException, NotFoundException } from '@bidflow/domain/exceptions';
import { Repository, TenantRepository } from '@bidflow/domain/repositories';
import { DomainService } from '@bidflow/domain/services';
import { Policy, BasePolicy, CompositePolicy } from '@bidflow/domain/policies';
import { BusinessRule, RuleSet, SimpleRule } from '@bidflow/domain/rules';
import { Money, Email, Identifier } from '@bidflow/domain/value-objects';
import { Specification } from '@bidflow/domain/specifications';
import { TenantContext } from '@bidflow/domain/tenant';
import { AuditInfo, SoftDeletable } from '@bidflow/domain/audit';
import { DomainEventMonitor, DomainMetric } from '@bidflow/domain/observability';
import { Guard, Result } from '@bidflow/domain/types';
```

## Convenções

- **Zero dependências:** sem Prisma, NestJS, Express, qualquer infra
- **TypeScript puro:** apenas tipos, classes abstratas, interfaces
- **DDD estrito:** AggregateRoot protege invariantes, Value Object imutável
- **Testes unitários:** 35+ cenários em `tests/domain.test.ts`
