# Spec Templates — BidFlow Platform SDD

> **Propósito:** Templates padronizados para Spec-Driven Development com suporte a IA/codegen.
> **Versão:** 1.0.0
> **Última atualização:** 2026-05-15

---

## Índice

| Template | Descrição | Seções | Quando usar |
|----------|-----------|--------|-------------|
| [`module.spec.template.yaml`](./module.spec.template.yaml) | Módulo/Bounded Context completo | 17 seções | Novo módulo ou contexto |
| [`domain.spec.template.yaml`](./domain.spec.template.yaml) | Domínio puro (DDD tático) | 14 seções | Nova entidade ou aggregate |
| [`aggregate.spec.template.yaml`](./aggregate.spec.template.yaml) | Aggregate Root | 10 seções | Novo aggregate raiz |
| [`workflow.spec.template.yaml`](./workflow.spec.template.yaml) | Workflow/State machine | 8 seções | Novo workflow ou fluxo |
| [`events.spec.template.yaml`](./events.spec.template.yaml) | Eventos de domínio/integração | 12 seções | Novo evento |
| [`api.spec.template.yaml`](./api.spec.template.yaml) | Contrato de API REST | 8 seções | Novo endpoint |
| [`integration.spec.template.yaml`](./integration.spec.template.yaml) | Integração entre contextos | 10 seções | Nova integração |

## Convenções Oficiais

### Naming

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| **Spec ID** | `{context}-{type}-{nnn}` | `tender-br-001`, `crm-ev-001` |
| **Event type** | `com.bidflow.{context}.{entity}.{action}.v{version}` | `com.bidflow.tender.captured.v1` |
| **Routing key** | `{tenantId}.{context}.{entity}.{action}` | `770e...tender.captured` |
| **API endpoint** | `/api/v1/{context}/{entities}` | `/api/v1/tenders` |
| **Permission** | `{context}.{action}` | `tender.create` |
| **Error code** | `UPPER_SNAKE_CASE` | `TENDER_NOT_FOUND` |
| **File name** | `kebab-case` | `tender-core.yml` |

### Versionamento de Specs

| Estado | Descrição |
|--------|-----------|
| `draft` | Spec em elaboração |
| `review` | Spec em revisão pelo Architecture Board |
| `approved` | Spec aprovada, pode ser implementada |
| `deprecated` | Spec substituída por versão mais nova |

### Relação entre Templates

```
module.spec.template.yaml (contexto completo)
├── domain.spec.template.yaml (entidades do módulo)
├── aggregate.spec.template.yaml (aggregates do módulo)
├── workflow.spec.template.yaml (workflows do módulo)
├── events.spec.template.yaml (eventos do módulo)
├── api.spec.template.yaml (APIs do módulo)
└── integration.spec.template.yaml (integrações do módulo com outros)
```

## Uso com IA

```bash
# 1. Criar spec de módulo
speckit.specify "Criar spec para módulo X usando template docs/specs/_templates/module.spec.template.yaml"

# 2. Criar spec de domínio
speckit.specify "Especificar entidade Y usando template docs/specs/_templates/domain.spec.template.yaml"

# 3. Criar spec de workflow
speckit.specify "Especificar workflow Z usando template docs/specs/_templates/workflow.spec.template.yaml"
```

## Validação

- Toda spec deve ter `id`, `title`, `version`, `status`, `context`
- Toda entidade deve ter `id`, `tenantId`, `createdAt`, `updatedAt`
- Toda API deve ter auth + tenantIsolation
- Toda permissão deve seguir `{context}.{action}`
- Toda regra de negócio deve ter `error_code`

## Boas Práticas

1. **Spec-first:** Nova funcionalidade começa com spec, nunca com código
2. **Event-first:** Novo evento registrado antes da implementação
3. **ADR obrigatório:** Toda decisão arquitetural relevante documentada em ADR
4. **Revisão:** Spec passa por review do Architecture Board antes da implementação
5. **Versionamento:** Spec versionada junto com o código (mesmo repositório)
6. **IA-ready:** Templates estruturados para máximo aproveitamento em prompts de IA
