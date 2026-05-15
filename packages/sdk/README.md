# @bidflow/sdk

> SDK compartilhado do BidFlow Platform — clients, contratos, auth, tracing e utilities.

---

## Visão Geral

SDK tipado compartilhado entre frontend (Next.js), backend (NestJS), workers, analytics e futuras integrações. Centraliza contratos DTO, helpers de autenticação, tenant context, tracing, retry e observabilidade.

## Estrutura

```
src/
├── api/              → HTTP helpers tipados (fetch wrapper)
├── clients/          → BaseApiClient (abstract)
├── contracts/dto/    → 20+ DTOs de resposta
├── types/            → Tipos compartilhados (enums, pagination, Result)
├── auth/             → JWT decode, permissions, refresh
├── tenant/           → TenantContext, tenantHeaders, cacheKey
├── tracing/          → OpenTelemetry (Tracer, Span, NoopTracer)
├── retry/            → withRetry, calculateBackoff, ResponseError
├── observability/    → Logger, MetricsCollector
├── constants/        → Endpoints centralizados
└── utils/            → generateId, sleep, formatCurrency, buildUrl
```

## Uso

```typescript
// Tipos compartilhados
import { PaginatedResponse, TenderStatus } from '@bidflow/sdk/types';
import { TenderResponse } from '@bidflow/sdk/contracts';

// API helpers (qualquer runtime)
import { apiGet, apiPost } from '@bidflow/sdk/api';
import { Endpoints } from '@bidflow/sdk/constants';

const tenders = await apiGet<PaginatedResponse<TenderResponse>>(
  API_URL, Endpoints.TENDERS,
  { token: 'jwt', tenantId: 'uuid' },
);

// Auth helpers
import { decodeJwt, hasPermission, extractTenantContext } from '@bidflow/sdk/auth';
const ctx = extractTenantContext(token);
if (hasPermission(ctx?.permissions ?? [], 'tender.create')) { ... }

// Retry
import { withRetry, ResponseError } from '@bidflow/sdk/retry';
const result = await withRetry(() => apiGet(...), { maxAttempts: 3 });

// Tracing
import { Tracer, NoopTracer, buildTraceparent } from '@bidflow/sdk/tracing';
const tracer: Tracer = new NoopTracer();
```

## Entry Points

```json
{
  "@bidflow/sdk": "src/index.ts",
  "@bidflow/sdk/types": "src/types/index.ts",
  "@bidflow/sdk/api": "src/api/index.ts",
  "@bidflow/sdk/clients": "src/clients/base.ts",
  "@bidflow/sdk/contracts": "src/contracts/dto/index.ts",
  "@bidflow/sdk/auth": "src/auth/index.ts",
  "@bidflow/sdk/tenant": "src/tenant/index.ts",
  "@bidflow/sdk/tracing": "src/tracing/index.ts",
  "@bidflow/sdk/retry": "src/retry/index.ts",
  "@bidflow/sdk/observability": "src/observability/index.ts",
  "@bidflow/sdk/constants": "src/constants/endpoints.ts",
  "@bidflow/sdk/utils": "src/utils/index.ts"
}
```

## Convenções

- **API clients:** Sempre tipados com `T extends DTO`
- **Auth:** Decodificação JWT sem verificação (server-side faz verification)
- **Tenant:** Sempre presente via `X-Tenant-Id` header ou `TenantContext`
- **Retry:** Exponential backoff com jitter, apenas erros transientes
- **Observability:** Logger + MetricsCollector abstraídos (pino/Prometheus no backend, console no frontend)
- **Tracing:** NoopTracer por padrão, OpenTelemetry real em produção
