# Technology Stack — BidFlow Platform

> **Propósito:** Documentar o stack tecnológico, versões e justificativas.

---

## Stack Principal

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| **Runtime** | Node.js | 20.x | LTS, performance, ecossistema |
| **API Core** | NestJS | 10.x | Módulos, DI, CQRS, Swagger, guard/filter nativos |
| **Frontend** | Next.js | 14.x | SSR, ISR, Server Components, App Router |
| **Analytics/ML** | Python | 3.11 | Ecossistema ML (pandas, numpy, scikit-learn) |
| **API Framework (Python)** | FastAPI | 0.109 | Async, OpenAPI nativo, performance |
| **Database** | PostgreSQL | 16 | RLS, JSONB, índices parciais, performance |
| **ORM (TS)** | Prisma | 5.x | Type-safe, migrations, schema-per-tenant |
| **ORM (Python)** | SQLAlchemy | 2.0 | Async, maduro, migrations |
| **Cache** | Redis | 7 | Sessão, rate-limit, cache, locks |
| **Message Broker** | RabbitMQ | 3.12 | Dead-letter, routing, confiabilidade |
| **Monorepo** | Turborepo | 2.x | Cache, paralelismo, pipelines |

## Stack de Desenvolvimento

| Ferramenta | Versão | Uso |
|-----------|--------|-----|
| TypeScript | 5.3+ | Tipagem estática |
| ESLint | 8.x | Linter |
| Prettier | 3.x | Formatador |
| Jest | 29.x | Testes unitários/integração |
| Supertest | 6.x | Testes de API |
| Playwright | — | Testes E2E (futuro) |
| Docker | 24+ | Containerização |
| Docker Compose | 2.x | Orquestração local |
| Speckit | 0.8+ | Spec-Driven Development |

## Stack de Observabilidade

| Ferramenta | Uso | Status |
|-----------|-----|--------|
| **Pino / Logger NestJS** | Logging estruturado | ✅ Ativo |
| **OpenTelemetry** | Distributed tracing | ✅ Configurado |
| **Prometheus** | Métricas | ✅ Integrado |
| **Grafana** | Dashboards | ✅ Planejado |
| **Jaeger / Tempo** | Tracing backend | 📋 Planejado |
| **Loki** | Log aggregation | 📋 Planejado |
| **Sentinel** | Rate limiting | 📋 Planejado |

## Stack de Infraestrutura (Futuro)

| Componente | Tecnologia | Quando |
|-----------|-----------|--------|
| Orquestração | Kubernetes (k3s / EKS) | 50+ tenants |
| API Gateway | Kong / Apisix | Múltiplos serviços |
| Service Mesh | Istio | Observabilidade avançada |
| CI/CD | GitHub Actions + ArgoCD | Desde o início |
| IaC | Terraform / Pulumi | Infraestrutura como código |
| Secrets | Hashicorp Vault / AWS Secrets Manager | Produção |
| Storage | MinIO → AWS S3 (produção) | Documentos |

## Stack de IA/ML

| Componente | Tecnologia | Uso |
|-----------|-----------|-----|
| LLM Gateway | OpenAI + Anthropic | Análise de documentos, chatbots |
| Embeddings | text-embedding-3-small | Similaridade de editais |
| ML Framework | scikit-learn + XGBoost | Predição de preços, score de leads |
| ML Pipeline | MLflow | Experimentação e deploy |
| Vector Store | pgvector (PostgreSQL) | Embeddings storage |

## Compatibilidade

| Requisito | Suportado |
|-----------|-----------|
| Node.js >= 18 | ✅ |
| npm >= 9 | ✅ |
| PostgreSQL >= 14 | ✅ |
| Redis >= 6 | ✅ |
| RabbitMQ >= 3.10 | ✅ |
| Docker | ✅ |
| macOS / Linux / Windows | ✅ (pwsh) |
