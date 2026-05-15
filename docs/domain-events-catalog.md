# Domain Events Catalog — BidFlow Platform

> **Propósito:** Catálogo completo de todos os domain events da plataforma BidFlow. Define eventos, payloads, produtores, consumidores, estratégias assíncronas, retry, dead letter queue e versionamento. Todo novo evento deve ser registrado neste catálogo antes da implementação.

---

## Sumário

1. [Estratégia Assíncrona Global](#1-estratégia-assíncrona-global)
2. [Formato Padrão do Evento](#2-formato-padrão-do-evento)
3. [Event Versioning](#3-event-versioning)
4. [Retry & Dead Letter Queue](#4-retry--dead-letter-queue)
5. [Catálogo: Licitações (Bidding)](#5-catálogo-licitações-bidding)
6. [Catálogo: ERP](#6-catálogo-erp)
7. [Catálogo: CRM](#7-catálogo-crm)
8. [Catálogo: IA (AI)](#8-catálogo-ia-ai)
9. [Catálogo: SaaS Multi-tenant](#9-catálogo-saas-multi-tenant)
10. [Catálogo: Cross-context Sagas](#10-catálogo-cross-context-sagas)
11. [Matriz Produtor x Consumidor](#11-matriz-produtor-x-consumidor)
12. [Governança](#12-governança)

---

## 1. Estratégia Assíncrona Global

### 1.1 Transporte

| Propriedade          | Definição                                  |
|----------------------|--------------------------------------------|
| Broker               | RabbitMQ 3.12+                             |
| Protocolo            | AMQP 0-9-1                                 |
| Formato              | CloudEvents 1.0 + JSON                     |
| Compressão           | gzip (payloads > 10KB)                     |
| Encodging            | UTF-8                                      |
| Content-Type         | `application/cloudevents+json`             |

### 1.2 Topologia de Filas

```
┌──────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│   Producer   │────→│  topic: bidflow.     │────→│  Consumer Queue  │
│  (NestJS)    │     │  {context}.{event}   │     │  (per consumer)  │
└──────────────┘     └──────────────────────┘     └──────────────────┘
                            │                              │
                            │                              ▼
                            │                     ┌──────────────────┐
                            │                     │   DLX (retry)    │
                            │                     │    3 attempts    │
                            │                     └────────┬─────────┘
                            │                              │
                            │                              ▼
                            │                     ┌──────────────────┐
                            │                     │  Dead Letter     │
                            └────────────────────→│  Queue (DLQ)    │
                                                  └──────────────────┘
```

### 1.3 Exchange & Routing

| Exchange            | Type    | Durability | Routing Key Pattern                        |
|---------------------|---------|------------|--------------------------------------------|
| `bidflow.domain`    | topic   | durable    | `{tenantId}.{context}.{eventType}`         |
| `bidflow.dlx`       | direct  | durable    | `{tenantId}.{context}.{eventType}.retry`   |
| `bidflow.dlq`       | fanout  | durable    | —                                          |

### 1.4 Políticas de Retry

| Parâmetro           | Padrão       | Descrição                                    |
|---------------------|--------------|----------------------------------------------|
| max_attempts        | 3            | Número máximo de tentativas                  |
| initial_interval    | 1s           | Intervalo inicial (backoff exponencial)      |
| multiplier          | 2            | Fator de multiplicação do backoff            |
| max_interval        | 60s          | Intervalo máximo entre retentativas          |
| retry_on            | transiente   | Apenas erros transientese (timeout, lock, 503) |
| no_retry_on         | permanente   | Erros de validação, violação de invariante   |

### 1.5 Dead Letter Queue (DLQ)

| Parâmetro           | Valor         | Descrição                                      |
|---------------------|---------------|------------------------------------------------|
| Exchange            | `bidflow.dlq` | Fanout exchange para DLQ                       |
| Queue               | `dlq.all`     | Fila única para todos os eventos rejeitados    |
| TTL                 | 30 dias       | Tempo de retenção na DLQ                       |
| Alert               | P3            | Alerta disparado ao entrar na DLQ              |
| Replay capability   | Manual        | Suporte a requeue via ferramenta               |

---

## 2. Formato Padrão do Evento

### 2.1 Envelope CloudEvents

```json
{
  "specversion": "1.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "/api/v1/auctions",
  "type": "com.bidflow.bidding.bid.placed.v1",
  "subject": "auction-123",
  "time": "2026-05-15T10:30:00.000Z",
  "datacontenttype": "application/json",
  "data": {
    "bidId": "660e8400-e29b-41d4-a716-446655440001",
    "auctionId": "660e8400-e29b-41d4-a716-446655440002",
    "amount": "450000.00",
    "currency": "BRL"
  },
  "tenantid": "770e8400-e29b-41d4-a716-446655440003",
  "userid": "880e8400-e29b-41d4-a716-446655440004",
  "correlationid": "990e8400-e29b-41d4-a716-446655440005",
  "causationid": "aa0e8400-e29b-41d4-a716-446655440006"
}
```

### 2.2 Campos Obrigatórios

| Campo           | Tipo     | Obrigatório | Descrição                                         |
|-----------------|----------|-------------|---------------------------------------------------|
| `specversion`   | string   | sim         | Versão da especificação CloudEvents (`1.0`)       |
| `id`            | string   | sim         | UUID v4 único do evento (idempotência)            |
| `source`        | string   | sim         | URI do produtor                                   |
| `type`          | string   | sim         | `com.bidflow.{context}.{entity}.{action}.v{versão}` |
| `subject`       | string   | não         | ID do aggregate que gerou o evento                |
| `time`          | string   | sim         | ISO 8601 com timezone                             |
| `datacontenttype` | string | sim         | `application/json`                                |
| `data`          | object   | sim         | Payload específico do evento                      |
| `tenantid`      | string   | sim         | UUID do tenant                                    |
| `userid`        | string   | não         | UUID do usuário que causou o evento               |
| `correlationid` | string   | não         | ID de correlação para tracing                     |
| `causationid`   | string   | não         | ID do evento que causou este                      |

---

## 3. Event Versioning

### 3.1 Estratégia

- **Versionamento por `type`**: `com.bidflow.{context}.{entity}.{action}.v{versão}`
- **Versão inicial**: `v1`
- **Breaking change**: nova versão (ex: `v2`) publicada em paralelo com `v1`
- **Non-breaking change**: adição de campos opcionais — sem nova versão
- **Compatibilidade**: consumidores declararam qual versão consomem; o broker roteia conforme `type`

### 3.2 Política de Depreciação

| Fase          | Ação                                      |
|---------------|-------------------------------------------|
| `active`      | Versão atual suportada                    |
| `deprecated`  | Ainda publicada, consumidores notificados |
| `sunset`      | Deixou de ser publicada                   |
| `removed`     | Totalmente removida                       |

- Depreciação: 90 dias de aviso mínimo.
- Durante depreciação, ambas as versões (v1 e v2) são publicadas.
- Consumidores antigos (v1) recebem evento v1 e v2 até migrarem.

### 3.3 Schema Registry

- Schemas armazenados em `.specify/events/schemas/`.
- Formato: JSON Schema (draft-07).
- Schema de cada versão é imutável após publicado.

```
.specify/events/schemas/
├── bidding/
│   ├── bid-placed-v1.json
│   ├── bid-placed-v2.json
│   ├── rfp-created-v1.json
│   └── auction-completed-v1.json
├── crm/
├── erp/
├── ai/
└── saas/
```

---

## 4. Retry & Dead Letter Queue

### 4.1 Configuração RabbitMQ

```json
// Declaração da fila de consumo com DLQ
{
  "queue": "bidflow.bidding.bid-placed.analytics",
  "durable": true,
  "arguments": {
    "x-dead-letter-exchange": "bidflow.dlx",
    "x-dead-letter-routing-key": "bidding.bid-placed.retry",
    "x-message-ttl": 86400000,
    "x-max-retries": 3
  }
}

// Declaração da fila de retry
{
  "queue": "bidflow.bidding.bid-placed.analytics.retry",
  "durable": true,
  "arguments": {
    "x-dead-letter-exchange": "bidflow.domain",
    "x-dead-letter-routing-key": "bidding.bid-placed",
    "x-message-ttl": 1000
  }
}
```

### 4.2 Fluxo de Retry

```
Message → Consumer (falha) → DLX → Retry Queue (TTL) → Consumer (re-tentativa)
                                                                   │
                                                              falha (3x)
                                                                   ▼
                                                            Dead Letter Queue
                                                                   ▼
                                                           Alerta + Revisão manual
```

### 4.3 Comportamento por Tipo de Erro

| Tipo de Erro                | Exemplo                      | Retry? | DLQ?  |
|-----------------------------|------------------------------|--------|-------|
| Erro transiente             | Timeout, banco indisponível  | Sim    | Após  |
| Erro de validação           | Payload inválido             | Não    | Sim   |
| Violação de invariante      | Entidade não encontrada      | Não    | Sim   |
| Erro de infraestrutura      | RabbitMQ indisponível        | Sim    | Após  |
| Erro de negócio (esperado)  | Fornecedor desqualificado    | Não    | Não   |

---

## 5. Catálogo: Licitações (Bidding)

### 5.1 `RfpCreated`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.bidding.rfp.created.v1`          |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `RfpService` / `CreateRfpHandler`             |
| **Gatilho**     | RFP criada com sucesso no banco               |
| **Frequência**  | Sob demanda                                   |
| **Criticidade** | Alta                                          |
| **Source**      | `/api/v1/rfps`                                |
| **Routing Key** | `{tenantId}.bidding.rfp.created`              |

**Payload (`data`)**:
```json
{
  "rfpId": "uuid",
  "tenantId": "uuid",
  "title": "string",
  "description": "string",
  "modality": {
    "type": "OPEN_TENDER | INVITED_TENDER | COMPETITIVE_DIALOG",
    "isElectronic": "boolean"
  },
  "openingDate": "datetime",
  "closingDate": "datetime",
  "estimatedValue": "decimal",
  "currency": "string",
  "lots": [
    {
      "id": "uuid",
      "number": "integer",
      "description": "string",
      "estimatedValue": "decimal"
    }
  ]
}
```

**Consumidores**:

| Consumidor     | Handler             | Estratégia       | Tipo              |
|----------------|---------------------|------------------|-------------------|
| IA (analytics) | `onRfpCreated`      | Assíncrono       | Análise de edital |
| CRM            | `onRfpCreated`      | Assíncrono       | Notificar fornecedores |
| Auditoria      | `logRfpCreated`     | Assíncrono       | Audit trail       |

### 5.2 `RfpPublished`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.bidding.rfp.published.v1`         |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `RfpService` / `PublishRfpHandler`            |
| **Gatilho**     | RFP transita de DRAFT para PUBLISHED          |
| **Criticidade** | Alta                                          |
| **Routing Key** | `{tenantId}.bidding.rfp.published`            |

**Payload**:
```json
{
  "rfpId": "uuid",
  "tenantId": "uuid",
  "publishedAt": "datetime",
  "publishedBy": "uuid",
  "openingDate": "datetime",
  "closingDate": "datetime",
  "modality": "string"
}
```

**Consumidores**:

| Consumidor     | Handler                | Estratégia       | Tipo                |
|----------------|------------------------|------------------|---------------------|
| CRM            | `notifyQualifiedSuppliers` | Assíncrono    | Notificação em massa |
| Web (SSE)      | `broadcastRfpPublished` | Assíncrono       | Tempo real (WebSocket) |
| IA (analytics) | `predictInterest`      | Assíncrono       | Prever engajamento  |

### 5.3 `ProposalSubmitted`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.bidding.proposal.submitted.v1`   |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `ProposalService` / `SubmitProposalHandler`   |
| **Gatilho**     | Proposta submetida por fornecedor             |
| **Criticidade** | Alta                                          |
| **Routing Key** | `{tenantId}.bidding.proposal.submitted`       |

**Payload**:
```json
{
  "proposalId": "uuid",
  "rfpId": "uuid",
  "supplierId": "uuid",
  "supplierName": "string",
  "totalAmount": "decimal",
  "currency": "string",
  "submittedAt": "datetime",
  "lotCount": "integer",
  "documentCount": "integer"
}
```

**Consumidores**:

| Consumidor     | Handler                   | Estratégia       | Tipo                |
|----------------|---------------------------|------------------|---------------------|
| IA (analytics) | `validatePriceRange`      | Assíncrono       | Validação de preço  |
| ERP            | `checkSupplierQualification` | Síncrono (ACL) | Verificar qualificação |
| Auditoria      | `logProposalSubmission`   | Assíncrono       | Audit trail         |

### 5.4 `ProposalDisqualified`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.bidding.proposal.disqualified.v1`|
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `ProposalEvaluationService`                   |
| **Gatilho**     | Proposta desclassificada na avaliação         |
| **Criticidade** | Média                                         |
| **Routing Key** | `{tenantId}.bidding.proposal.disqualified`    |

**Payload**:
```json
{
  "proposalId": "uuid",
  "rfpId": "uuid",
  "supplierId": "uuid",
  "reason": "string",
  "disqualifiedBy": "uuid",
  "disqualifiedAt": "datetime",
  "ruleViolated": "string"
}
```

**Consumidores**:

| Consumidor  | Handler                 | Estratégia | Tipo                |
|-------------|-------------------------|------------|---------------------|
| CRM         | `notifySupplierDisqualified` | Assíncrono | Notificação       |
| Auditoria   | `logDisqualification`  | Assíncrono | Audit trail         |

### 5.5 `AuctionStarted`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.bidding.auction.started.v1`      |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `AuctionService` / `StartAuctionHandler`      |
| **Gatilho**     | Disputa eletrônica inicia                     |
| **Criticidade** | Alta                                          |
| **Routing Key** | `{tenantId}.bidding.auction.started`          |

**Payload**:
```json
{
  "auctionId": "uuid",
  "rfpId": "uuid",
  "lotId": "uuid",
  "startPrice": "decimal",
  "currency": "string",
  "minDecrement": "decimal",
  "startDate": "datetime",
  "endDate": "datetime",
  "extensionTime": "integer"
}
```

**Consumidores**:

| Consumidor     | Handler                | Estratégia       | Tipo                     |
|----------------|------------------------|------------------|--------------------------|
| Web (SSE)      | `openAuctionChannel`   | Assíncrono       | Abrir canal WebSocket    |
| IA (analytics) | `monitorBidding`       | Assíncrono       | Monitoramento em tempo real |
| CRM            | `notifyQualifiedSuppliers` | Assíncrono    | Notificação push         |

### 5.6 `BidPlaced`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.bidding.bid.placed.v1`           |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `AuctionService` / `PlaceBidHandler`          |
| **Gatilho**     | Lance registrado na disputa                   |
| **Frequência**  | Alta (até 100/s por leilão ativo)             |
| **Criticidade** | Crítica (tempo real)                          |
| **Routing Key** | `{tenantId}.bidding.bid.placed`               |

**Payload**:
```json
{
  "bidId": "uuid",
  "auctionId": "uuid",
  "rfpId": "uuid",
  "userId": "uuid",
  "userName": "string",
  "amount": "decimal",
  "currency": "string",
  "previousPrice": "decimal",
  "isAutomatic": "boolean",
  "timestamp": "datetime",
  "round": "integer"
}
```

**Consumidores**:

| Consumidor       | Handler                    | Estratégia         | Tipo                     |
|------------------|----------------------------|--------------------|--------------------------|
| Web (SSE)        | `broadcastBid`            | Assíncrono         | Tempo real (todos)       |
| IA (analytics)   | `analyzeFraud`            | Assíncrono         | Score de fraude em tempo real |
| Auction Engine   | `checkExtension`          | Síncrono (mesmo processo) | Prorrogação automática |
| Auditoria        | `logBidEvent`             | Assíncrono         | Audit trail              |

### 5.7 `AuctionExtended`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.bidding.auction.extended.v1`     |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `DisputeExtensionService`                     |
| **Gatilho**     | Lance nos segundos finais prorroga a disputa  |
| **Criticidade** | Alta                                          |
| **Routing Key** | `{tenantId}.bidding.auction.extended`         |

**Payload**:
```json
{
  "auctionId": "uuid",
  "previousEndDate": "datetime",
  "newEndDate": "datetime",
  "extendedBySeconds": "integer",
  "triggeredByBidId": "uuid",
  "extensionRound": "integer"
}
```

**Consumidores**:

| Consumidor  | Handler                    | Estratégia | Tipo                |
|-------------|----------------------------|------------|---------------------|
| Web (SSE)   | `broadcastExtension`       | Assíncrono | Atualizar tempo restante |
| Auditoria   | `logExtension`             | Assíncrono | Audit trail         |

### 5.8 `AuctionCompleted`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.bidding.auction.completed.v1`    |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `AuctionClosingService`                       |
| **Gatilho**     | Disputa encerrada sem novos lances            |
| **Criticidade** | Alta                                          |
| **Routing Key** | `{tenantId}.bidding.auction.completed`        |

**Payload**:
```json
{
  "auctionId": "uuid",
  "rfpId": "uuid",
  "lotId": "uuid",
  "winnerId": "uuid",
  "winnerName": "string",
  "finalPrice": "decimal",
  "currency": "string",
  "startPrice": "decimal",
  "totalBids": "integer",
  "totalRounds": "integer",
  "completedAt": "datetime",
  "duration": "integer"
}
```

**Consumidores**:

| Consumidor     | Handler                   | Estratégia       | Tipo                |
|----------------|---------------------------|------------------|---------------------|
| IA (analytics) | `validateResult`          | Assíncrono       | Validar resultado   |
| CRM            | `notifyParticipants`      | Assíncrono       | Notificar todos     |
| RFP            | `updateRfpStatus`         | Assíncrono       | Avançar workflow    |
| Web (SSE)      | `broadcastResult`         | Assíncrono       | Tempo real          |
| Auditoria      | `logAuctionResult`        | Assíncrono       | Audit trail         |

### 5.9 `ContractAwarded`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.bidding.contract.awarded.v1`     |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `ContractService` / `AwardContractHandler`    |
| **Gatilho**     | Contrato adjudicado à proposta vencedora      |
| **Criticidade** | Crítica                                       |
| **Routing Key** | `{tenantId}.bidding.contract.awarded`         |

**Payload**:
```json
{
  "contractId": "uuid",
  "contractNumber": "string",
  "rfpId": "uuid",
  "proposalId": "uuid",
  "supplierId": "uuid",
  "supplierName": "string",
  "value": "decimal",
  "currency": "string",
  "startDate": "date",
  "endDate": "date",
  "awardedAt": "datetime",
  "awardedBy": "uuid",
  "lotDetails": [
    {
      "lotId": "uuid",
      "description": "string",
      "value": "decimal"
    }
  ]
}
```

**Consumidores**:

| Consumidor     | Handler                    | Estratégia       | Tipo                |
|----------------|----------------------------|------------------|---------------------|
| ERP            | `commitBudget`             | Assíncrono       | Empenhar orçamento  |
| CRM            | `updateOpportunityPipeline` | Assíncrono      | Pipeline de vendas  |
| IA (analytics) | `recordContract`           | Assíncrono       | Treinar modelo      |
| Auditoria      | `logContractAward`         | Assíncrono       | Audit trail         |

### 5.10 `ContractSuspended`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.bidding.contract.suspended.v1`   |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `ContractService` / `SuspendContractHandler`  |
| **Gatilho**     | Contrato suspenso por inadimplência ou atraso |
| **Criticidade** | Alta                                          |
| **Routing Key** | `{tenantId}.bidding.contract.suspended`       |

**Payload**:
```json
{
  "contractId": "uuid",
  "contractNumber": "string",
  "rfpId": "uuid",
  "supplierId": "uuid",
  "reason": "string",
  "suspendedAt": "datetime",
  "suspendedBy": "uuid",
  "expectedResumption": "datetime"
}
```

**Consumidores**:

| Consumidor | Handler                  | Estratégia | Tipo                |
|------------|--------------------------|------------|---------------------|
| ERP        | `blockPayments`          | Assíncrono | Bloquear pagamentos |
| CRM        | `suspendSupplierPipeline`| Assíncrono | Atualizar pipeline  |
| Auditoria  | `logSuspension`          | Assíncrono | Audit trail         |

---

## 6. Catálogo: ERP

### 6.1 `SupplierQualified`

| Propriedade     | Valor                                        |
|-----------------|----------------------------------------------|
| **Tipo**        | `com.bidflow.erp.supplier.qualified.v1`      |
| **Versão**      | `v1` (active)                                |
| **Produtor**    | `SupplierService` / `QualifySupplierHandler` |
| **Gatilho**     | Fornecedor qualificado após análise          |
| **Criticidade** | Alta                                         |
| **Routing Key** | `{tenantId}.erp.supplier.qualified`          |

**Payload**:
```json
{
  "supplierId": "uuid",
  "legalName": "string",
  "taxId": "string",
  "qualifiedAt": "datetime",
  "qualifiedBy": "uuid",
  "qualificationLevel": "GOLD | SILVER | BRONZE",
  "expiresAt": "date"
}
```

**Consumidores**:

| Consumidor | Handler                  | Estratégia | Tipo           |
|------------|--------------------------|------------|----------------|
| CRM        | `updateSupplierStatus`   | Assíncrono | Pipeline       |
| IA         | `trainSupplierModel`     | Assíncrono | Modelo         |
| Licitações | `enableBidding`          | Assíncrono | Habilitar participação |

### 6.2 `SupplierDisqualified`

| Propriedade     | Valor                                          |
|-----------------|------------------------------------------------|
| **Tipo**        | `com.bidflow.erp.supplier.disqualified.v1`     |
| **Versão**      | `v1` (active)                                  |
| **Produtor**    | `SupplierService` / `DisqualifySupplierHandler`|
| **Gatilho**     | Fornecedor perde qualificação                  |
| **Criticidade** | Alta                                           |
| **Routing Key** | `{tenantId}.erp.supplier.disqualified`         |

**Payload**:
```json
{
  "supplierId": "uuid",
  "legalName": "string",
  "reason": "string",
  "disqualifiedAt": "datetime",
  "disqualifiedBy": "uuid"
}
```

**Consumidores**:

| Consumidor | Handler                    | Estratégia | Tipo            |
|------------|----------------------------|------------|-----------------|
| CRM        | `blockSupplier`            | Assíncrono | Bloquear no CRM |
| Licitações | `cancelOpenProposals`      | Assíncrono | Cancelar propostas abertas |

### 6.3 `BudgetCommitted`

| Propriedade     | Valor                                           |
|-----------------|-------------------------------------------------|
| **Tipo**        | `com.bidflow.erp.budget.committed.v1`           |
| **Versão**      | `v1` (active)                                   |
| **Produtor**    | `BudgetService` / `CommitBudgetHandler`         |
| **Gatilho**     | Orçamento empenhado para um contrato            |
| **Criticidade** | Alta                                            |
| **Routing Key** | `{tenantId}.erp.budget.committed`               |

**Payload**:
```json
{
  "budgetId": "uuid",
  "contractId": "uuid",
  "department": "string",
  "fiscalYear": "integer",
  "committedAmount": "decimal",
  "currency": "string",
  "remainingBudget": "decimal",
  "committedAt": "datetime"
}
```

**Consumidores**:

| Consumidor | Handler                       | Estratégia | Tipo       |
|------------|-------------------------------|------------|------------|
| Licitações | `updateRfpBudgetUsage`        | Assíncrono | Atualizar  |
| Auditoria  | `logBudgetCommitment`         | Assíncrono | Audit      |

### 6.4 `InvoiceApproved`

| Propriedade     | Valor                                        |
|-----------------|----------------------------------------------|
| **Tipo**        | `com.bidflow.erp.invoice.approved.v1`        |
| **Versão**      | `v1` (active)                                |
| **Produtor**    | `InvoiceService` / `ApproveInvoiceHandler`   |
| **Gatilho**     | Nota fiscal aprovada para pagamento          |
| **Criticidade** | Alta                                         |
| **Routing Key** | `{tenantId}.erp.invoice.approved`            |

**Payload**:
```json
{
  "invoiceId": "uuid",
  "invoiceNumber": "string",
  "contractId": "uuid",
  "supplierId": "uuid",
  "amount": "decimal",
  "currency": "string",
  "taxAmount": "decimal",
  "approvedAt": "datetime",
  "approvedBy": "uuid",
  "dueDate": "date"
}
```

**Consumidores**:

| Consumidor | Handler                    | Estratégia | Tipo            |
|------------|----------------------------|------------|-----------------|
| CRM        | `notifySupplierPayment`    | Assíncrono | Notificação     |
| IA         | `recordPaymentHistory`     | Assíncrono | Treinar modelo  |
| Auditoria  | `logInvoiceApproval`       | Assíncrono | Audit           |

### 6.5 `PaymentProcessed`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.erp.payment.processed.v1`        |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `PaymentService` / `ProcessPaymentHandler`    |
| **Gatilho**     | Pagamento liquidado                           |
| **Criticidade** | Alta                                          |
| **Routing Key** | `{tenantId}.erp.payment.processed`            |

**Payload**:
```json
{
  "paymentId": "uuid",
  "invoiceId": "uuid",
  "contractId": "uuid",
  "supplierId": "uuid",
  "amount": "decimal",
  "currency": "string",
  "paymentMethod": "PIX | TED | BOLETO | CREDIT_CARD",
  "processedAt": "datetime",
  "paymentDate": "date"
}
```

**Consumidores**:

| Consumidor | Handler                 | Estratégia | Tipo         |
|------------|-------------------------|------------|--------------|
| CRM        | `updateSupplierTier`    | Assíncrono | Reputação    |
| Licitações | `unblockSupplier`       | Assíncrono | Desbloquear  |

---

## 7. Catálogo: CRM

### 7.1 `LeadCaptured`

| Propriedade     | Valor                                       |
|-----------------|---------------------------------------------|
| **Tipo**        | `com.bidflow.crm.lead.captured.v1`          |
| **Versão**      | `v1` (active)                               |
| **Produtor**    | `LeadService` / `CaptureLeadHandler`        |
| **Gatilho**     | Novo lead registrado (form, landing, import)|
| **Criticidade** | Média                                        |
| **Routing Key** | `{tenantId}.crm.lead.captured`              |

**Payload**:
```json
{
  "leadId": "uuid",
  "name": "string",
  "company": "string",
  "email": "string",
  "phone": "string",
  "source": "WEBSITE | LANDING_PAGE | MANUAL | API | IMPORT",
  "capturedAt": "datetime"
}
```

**Consumidores**:

| Consumidor     | Handler                  | Estratégia | Tipo            |
|----------------|--------------------------|------------|-----------------|
| IA (analytics) | `scoreLead`              | Assíncrono | Score preditivo |
| ERP            | `checkExistingSupplier`  | Assíncrono | Duplicidade     |

### 7.2 `LeadQualified`

| Propriedade     | Valor                                        |
|-----------------|----------------------------------------------|
| **Tipo**        | `com.bidflow.crm.lead.qualified.v1`          |
| **Versão**      | `v1` (active)                                |
| **Produtor**    | `LeadScoringService`                         |
| **Gatilho**     | Lead atinge score mínimo de qualificação     |
| **Criticidade** | Média                                        |
| **Routing Key** | `{tenantId}.crm.lead.qualified`              |

**Payload**:
```json
{
  "leadId": "uuid",
  "name": "string",
  "company": "string",
  "score": "integer",
  "scoreCriteria": [
    {
      "criterion": "string",
      "value": "integer"
    }
  ],
  "qualifiedAt": "datetime",
  "assignedTo": "uuid"
}
```

**Consumidores**:

| Consumidor | Handler                  | Estratégia | Tipo            |
|------------|--------------------------|------------|-----------------|
| ERP        | `createSupplierDraft`    | Assíncrono | Criar fornecedor rascunho |
| CRM        | `createOpportunity`      | Interno    | Avançar pipeline |

### 7.3 `LeadConverted`

| Propriedade     | Valor                                        |
|-----------------|----------------------------------------------|
| **Tipo**        | `com.bidflow.crm.lead.converted.v1`          |
| **Versão**      | `v1` (active)                                |
| **Produtor**    | `LeadService` / `ConvertLeadHandler`         |
| **Gatilho**     | Lead convertido em cliente                   |
| **Criticidade** | Alta                                         |
| **Routing Key** | `{tenantId}.crm.lead.converted`              |

**Payload**:
```json
{
  "leadId": "uuid",
  "customerId": "uuid",
  "customerName": "string",
  "taxId": "string",
  "tier": "BRONZE | SILVER | GOLD | PLATINUM",
  "convertedAt": "datetime"
}
```

**Consumidores**:

| Consumidor     | Handler                    | Estratégia | Tipo            |
|----------------|----------------------------|------------|-----------------|
| ERP            | `activateSupplier`         | Assíncrono | Ativar fornecedor |
| IA (analytics) | `trainConversionModel`     | Assíncrono | Modelo preditivo |
| Licitações     | `enableAsBidder`           | Assíncrono | Habilitar licitar |

### 7.4 `OpportunityCreated`

| Propriedade     | Valor                                           |
|-----------------|-------------------------------------------------|
| **Tipo**        | `com.bidflow.crm.opportunity.created.v1`        |
| **Versão**      | `v1` (active)                                   |
| **Produtor**    | `OpportunityService` / `CreateOpportunityHandler`|
| **Gatilho**     | Nova oportunidade no pipeline                   |
| **Criticidade** | Média                                           |
| **Routing Key** | `{tenantId}.crm.opportunity.created`            |

**Payload**:
```json
{
  "opportunityId": "uuid",
  "leadId": "uuid",
  "customerId": "uuid",
  "title": "string",
  "estimatedValue": "decimal",
  "currency": "string",
  "stage": "QUALIFICATION | PROPOSAL | NEGOTIATION",
  "probability": "decimal",
  "expectedCloseDate": "date",
  "createdAt": "datetime"
}
```

**Consumidores**:

| Consumidor | Handler                  | Estratégia | Tipo      |
|------------|--------------------------|------------|-----------|
| IA         | `predictCloseDate`       | Assíncrono | Predição  |

### 7.5 `OpportunityWon`

| Propriedade     | Valor                                       |
|-----------------|---------------------------------------------|
| **Tipo**        | `com.bidflow.crm.opportunity.won.v1`        |
| **Versão**      | `v1` (active)                               |
| **Produtor**    | `OpportunityService` / `WinOpportunityHandler` |
| **Gatilho**     | Oportunidade ganha (fechamento positivo)    |
| **Criticidade** | Alta                                        |
| **Routing Key** | `{tenantId}.crm.opportunity.won`            |

**Payload**:
```json
{
  "opportunityId": "uuid",
  "customerId": "uuid",
  "customerName": "string",
  "value": "decimal",
  "currency": "string",
  "closedAt": "datetime",
  "products": ["string"]
}
```

**Consumidores**:

| Consumidor     | Handler                 | Estratégia | Tipo          |
|----------------|-------------------------|------------|---------------|
| Licitações     | `createRfpFromOpportunity` | Assíncrono | Gerar RFP     |
| IA (analytics) | `trainWinModel`         | Assíncrono | Modelo        |

### 7.6 `OpportunityLost`

| Propriedade     | Valor                                        |
|-----------------|----------------------------------------------|
| **Tipo**        | `com.bidflow.crm.opportunity.lost.v1`        |
| **Versão**      | `v1` (active)                                |
| **Produtor**    | `OpportunityService` / `LoseOpportunityHandler` |
| **Gatilho**     | Oportunidade perdida                         |
| **Criticidade** | Média                                        |
| **Routing Key** | `{tenantId}.crm.opportunity.lost`            |

**Payload**:
```json
{
  "opportunityId": "uuid",
  "customerId": "uuid",
  "value": "decimal",
  "reason": "PRICE | COMPETITOR | TIMING | OTHER",
  "details": "string",
  "lostTo": "string",
  "lostAt": "datetime"
}
```

**Consumidores**:

| Consumidor | Handler                | Estratégia | Tipo      |
|------------|------------------------|------------|-----------|
| IA         | `trainLossModel`       | Assíncrono | Modelo    |

### 7.7 `CustomerTierChanged`

| Propriedade     | Valor                                           |
|-----------------|-------------------------------------------------|
| **Tipo**        | `com.bidflow.crm.customer.tier.changed.v1`      |
| **Versão**      | `v1` (active)                                   |
| **Produtor**    | `CustomerService` / `ChangeTierHandler`         |
| **Gatilho**     | Cliente muda de tier (upgrade/downgrade)        |
| **Criticidade** | Média                                           |
| **Routing Key** | `{tenantId}.crm.customer.tier.changed`          |

**Payload**:
```json
{
  "customerId": "uuid",
  "customerName": "string",
  "oldTier": "BRONZE | SILVER | GOLD | PLATINUM",
  "newTier": "BRONZE | SILVER | GOLD | PLATINUM",
  "reason": "REVENUE | TIME | MANUAL",
  "changedAt": "datetime"
}
```

**Consumidores**:

| Consumidor | Handler                    | Estratégia | Tipo        |
|------------|----------------------------|------------|-------------|
| ERP        | `updatePaymentTerms`       | Assíncrono | Atualizar   |
| SaaS       | `updatePlanQuotas`         | Assíncrono | Quotas      |

---

## 8. Catálogo: IA (AI)

### 8.1 `PredictionCompleted`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.ai.prediction.completed.v1`      |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `ModelInferenceService`                       |
| **Gatilho**     | Modelo conclui inferência                     |
| **Frequência**  | Alta                                          |
| **Criticidade** | Média                                         |
| **Routing Key** | `{tenantId}.ai.prediction.completed`          |

**Payload**:
```json
{
  "predictionId": "uuid",
  "modelId": "uuid",
  "modelName": "string",
  "modelVersion": "string",
  "inputHash": "string",
  "output": "object",
  "confidence": "decimal",
  "latency": "integer",
  "tokensUsed": "integer",
  "completedAt": "datetime"
}
```

**Consumidores**:

| Consumidor     | Handler                       | Estratégia | Tipo                  |
|----------------|-------------------------------|------------|-----------------------|
| Licitações     | `onFraudPrediction`           | Assíncrono | Suspender lance       |
| CRM            | `onLeadScorePrediction`       | Assíncrono | Priorizar lead        |
| Collector      | `storePredictionFeedback`     | Assíncrono | Feedback loop         |

### 8.2 `FraudAlertRaised`

| Propriedade     | Valor                                         |
|-----------------|-----------------------------------------------|
| **Tipo**        | `com.bidflow.ai.fraud.alert.raised.v1`        |
| **Versão**      | `v1` (active)                                 |
| **Produtor**    | `FraudDetectionService`                       |
| **Gatilho**     | Lance classificado como suspeito (score > 0.8)|
| **Criticidade** | Crítica                                       |
| **Routing Key** | `{tenantId}.ai.fraud.alert.raised`            |

**Payload**:
```json
{
  "alertId": "uuid",
  "bidId": "uuid",
  "auctionId": "uuid",
  "tenantId": "uuid",
  "score": "decimal",
  "threshold": "decimal",
  "reasons": [
    {
      "rule": "string",
      "weight": "decimal",
      "evidence": "string"
    }
  ],
  "raisedAt": "datetime",
  "suggestedAction": "BLOCK | REVIEW | ALLOW"
}
```

**Consumidores**:

| Consumidor | Handler                    | Estratégia | Tipo            |
|------------|----------------------------|------------|-----------------|
| Licitações | `suspendBid`               | Assíncrono | Bloquear lance  |
| Auditoria  | `logFraudAlert`            | Assíncrono | Audit trail     |
| Compliance | `notifyComplianceTeam`     | Assíncrono | Notificação     |

### 8.3 `ModelDeployed`

| Propriedade     | Valor                                       |
|-----------------|---------------------------------------------|
| **Tipo**        | `com.bidflow.ai.model.deployed.v1`          |
| **Versão**      | `v1` (active)                               |
| **Produtor**    | `ModelLifecycleService`                     |
| **Gatilho**     | Novo modelo ou versão implantado            |
| **Criticidade** | Alta                                        |
| **Routing Key** | `{tenantId}.ai.model.deployed`              |

**Payload**:
```json
{
  "modelId": "uuid",
  "modelName": "string",
  "version": "string",
  "type": "CLASSIFICATION | REGRESSION | LLM | EMBEDDING",
  "provider": "OPENAI | HUGGINGFACE | CUSTOM",
  "metrics": {
    "accuracy": "decimal",
    "latency": "integer"
  },
  "deployedAt": "datetime",
  "deprecatesVersion": "string"
}
```

**Consumidores**:

| Consumidor    | Handler                    | Estratégia | Tipo        |
|---------------|----------------------------|------------|-------------|
| Observability | `updateModelDashboard`     | Assíncrono | Dashboard   |
| Config        | `updateModelRouting`       | Assíncrono | Roteamento  |

### 8.4 `ModelTrainingCompleted`

| Propriedade     | Valor                                           |
|-----------------|-------------------------------------------------|
| **Tipo**        | `com.bidflow.ai.model.training.completed.v1`    |
| **Versão**      | `v1` (active)                                   |
| **Produtor**    | `TrainingPipelineService`                       |
| **Gatilho**     | Pipeline de treino concluído                    |
| **Criticidade** | Baixa                                           |
| **Routing Key** | `{tenantId}.ai.model.training.completed`        |

**Payload**:
```json
{
  "modelId": "uuid",
  "modelName": "string",
  "version": "string",
  "datasetId": "uuid",
  "metrics": {
    "accuracy": "decimal",
    "precision": "decimal",
    "recall": "decimal",
    "f1": "decimal",
    "loss": "decimal"
  },
  "trainingDuration": "integer",
  "completedAt": "datetime"
}
```

**Consumidores**:

| Consumidor    | Handler                   | Estratégia | Tipo      |
|---------------|---------------------------|------------|-----------|
| MLOps         | `autoDeployIfImproved`    | Assíncrono | Deploy    |

### 8.5 `PromptTemplateUpdated`

| Propriedade     | Valor                                            |
|-----------------|--------------------------------------------------|
| **Tipo**        | `com.bidflow.ai.prompt.template.updated.v1`      |
| **Versão**      | `v1` (active)                                    |
| **Produtor**    | `PromptTemplateService`                          |
| **Gatilho**     | Template de prompt alterado                      |
| **Criticidade** | Média                                            |
| **Routing Key** | `{tenantId}.ai.prompt.template.updated`          |

**Payload**:
```json
{
  "promptId": "uuid",
  "name": "string",
  "oldVersion": "integer",
  "newVersion": "integer",
  "context": "BIDDING | CRM | ERP",
  "updatedAt": "datetime",
  "updatedBy": "uuid"
}
```

**Consumidores**:

| Consumidor | Handler                  | Estratégia | Tipo       |
|------------|--------------------------|------------|------------|
| Cache      | `invalidatePromptCache`   | Assíncrono | Invalidar  |

---

## 9. Catálogo: SaaS Multi-tenant

### 9.1 `TenantRegistered`

| Propriedade     | Valor                                        |
|-----------------|----------------------------------------------|
| **Tipo**        | `com.bidflow.saas.tenant.registered.v1`      |
| **Versão**      | `v1` (active)                                |
| **Produtor**    | `TenantService` / `RegisterTenantHandler`    |
| **Gatilho**     | Novo tenant registrado na plataforma         |
| **Criticidade** | Alta                                         |
| **Routing Key** | `{tenantId}.saas.tenant.registered`          |

**Payload**:
```json
{
  "tenantId": "uuid",
  "legalName": "string",
  "taxId": "string",
  "planId": "uuid",
  "planName": "STARTER | BUSINESS | ENTERPRISE",
  "registeredAt": "datetime",
  "domain": "string",
  "locale": "string",
  "timezone": "string"
}
```

**Consumidores**:

| Consumidor      | Handler                    | Estratégia       | Tipo                    |
|-----------------|----------------------------|------------------|-------------------------|
| Provisioning    | `provisionInfrastructure`  | Síncrono (Saga)  | Criar recursos          |
| Billing         | `createSubscription`       | Síncrono (Saga)  | Faturamento             |
| Onboarding      | `sendWelcomeKit`           | Assíncrono       | Email de boas-vindas    |

### 9.2 `TenantActivated`

| Propriedade     | Valor                                        |
|-----------------|----------------------------------------------|
| **Tipo**        | `com.bidflow.saas.tenant.activated.v1`       |
| **Versão**      | `v1` (active)                                |
| **Produtor**    | `TenantService` / `ActivateTenantHandler`    |
| **Gatilho**     | Tenant ativado (infra pronta)                |
| **Criticidade** | Alta                                         |
| **Routing Key** | `{tenantId}.saas.tenant.activated`           |

**Payload**:
```json
{
  "tenantId": "uuid",
  "activatedAt": "datetime",
  "trialEndsAt": "datetime",
  "featuresEnabled": ["string"]
}
```

**Consumidores**:

| Consumidor  | Handler                     | Estratégia | Tipo      |
|-------------|-----------------------------|------------|-----------|
| Billing     | `startBillingCycle`         | Assíncrono | Faturar   |
| CRM         | `createDefaultPipeline`     | Assíncrono | Setup     |

### 9.3 `TenantSuspended`

| Propriedade     | Valor                                       |
|-----------------|---------------------------------------------|
| **Tipo**        | `com.bidflow.saas.tenant.suspended.v1`      |
| **Versão**      | `v1` (active)                               |
| **Produtor**    | `TenantService` / `SuspendTenantHandler`    |
| **Gatilho**     | Tenant suspenso (inadimplência, termos)     |
| **Criticidade** | Crítica                                     |
| **Routing Key** | `{tenantId}.saas.tenant.suspended`          |

**Payload**:
```json
{
  "tenantId": "uuid",
  "legalName": "string",
  "reason": "PAYMENT_DEFAULT | TERMS_VIOLATION | MANUAL",
  "suspendedAt": "datetime",
  "expectedResolution": "datetime",
  "notifiedContacts": ["string"]
}
```

**Consumidores**:

| Consumidor  | Handler                       | Estratégia | Tipo            |
|-------------|-------------------------------|------------|-----------------|
| Gateway     | `blockTenantAccess`           | Síncrono   | Bloquear acesso |
| Infra       | `suspendContainers`           | Assíncrono | Desligar infra  |
| Billing     | `cancelPendingInvoices`       | Assíncrono | Faturamento     |

### 9.4 `SubscriptionCreated`

| Propriedade     | Valor                                          |
|-----------------|------------------------------------------------|
| **Tipo**        | `com.bidflow.saas.subscription.created.v1`     |
| **Versão**      | `v1` (active)                                  |
| **Produtor**    | `SubscriptionService`                          |
| **Gatilho**     | Nova assinatura criada                         |
| **Criticidade** | Alta                                           |
| **Routing Key** | `{tenantId}.saas.subscription.created`         |

**Payload**:
```json
{
  "subscriptionId": "uuid",
  "tenantId": "uuid",
  "planId": "uuid",
  "planName": "STARTER | BUSINESS | ENTERPRISE",
  "billingCycle": "MONTHLY | YEARLY",
  "price": "decimal",
  "currency": "string",
  "trialEndsAt": "datetime",
  "currentPeriodStart": "date",
  "currentPeriodEnd": "date",
  "quotas": {
    "rfp": "integer",
    "users": "integer",
    "api_calls": "integer"
  },
  "features": ["string"]
}
```

**Consumidores**:

| Consumidor    | Handler                     | Estratégia | Tipo        |
|---------------|-----------------------------|------------|-------------|
| Billing       | `generateFirstInvoice`      | Assíncrono | Fatura      |
| Quota         | `initializeQuotaCounters`   | Assíncrono | Quotas      |

### 9.5 `SubscriptionChanged`

| Propriedade     | Valor                                          |
|-----------------|------------------------------------------------|
| **Tipo**        | `com.bidflow.saas.subscription.changed.v1`     |
| **Versão**      | `v1` (active)                                  |
| **Produtor**    | `SubscriptionService` / `ChangePlanHandler`    |
| **Gatilho**     | Mudança de plano (upgrade/downgrade)           |
| **Criticidade** | Alta                                           |
| **Routing Key** | `{tenantId}.saas.subscription.changed`         |

**Payload**:
```json
{
  "subscriptionId": "uuid",
  "tenantId": "uuid",
  "oldPlanId": "uuid",
  "newPlanId": "uuid",
  "oldPlanName": "string",
  "newPlanName": "string",
  "priceDelta": "decimal",
  "changedAt": "datetime",
  "effectiveDate": "date",
  "quotasAdjusted": {
    "rfp": {"old": "integer", "new": "integer"},
    "users": {"old": "integer", "new": "integer"}
  },
  "featuresGained": ["string"],
  "featuresLost": ["string"]
}
```

**Consumidores**:

| Consumidor | Handler                       | Estratégia | Tipo          |
|------------|-------------------------------|------------|---------------|
| Quota      | `updateQuotaLimits`           | Aasíncrono | Ajustar       |
| Billing    | `generateAdjustmentInvoice`   | Assíncrono | Faturamento   |
| Gateway    | `reloadFeatureGates`          | Assíncrono | Feature flags |

### 9.6 `SubscriptionCanceled`

| Propriedade     | Valor                                            |
|-----------------|--------------------------------------------------|
| **Tipo**        | `com.bidflow.saas.subscription.canceled.v1`      |
| **Versão**      | `v1` (active)                                    |
| **Produtor**    | `SubscriptionService` / `CancelSubscriptionHandler` |
| **Gatilho**     | Assinatura cancelada                             |
| **Criticidade** | Alta                                             |
| **Routing Key** | `{tenantId}.saas.subscription.canceled`          |

**Payload**:
```json
{
  "subscriptionId": "uuid",
  "tenantId": "uuid",
  "canceledAt": "datetime",
  "effectiveAt": "datetime",
  "reason": "VOLUNTARY | PAYMENT_DEFAULT | ADMIN",
  "feedbackReason": "string",
  "feedbackComment": "string"
}
```

**Consumidores**:

| Consumidor    | Handler                       | Estratégia | Tipo          |
|---------------|-------------------------------|------------|---------------|
| Infra         | `scheduleDeprovisioning`      | Assíncrono | Agendar       |
| CRM           | `createRetentionTask`         | Assíncrono | Retenção      |
| Billing       | `stopRecurringBilling`        | Assíncrono | Parar cobrança|

### 9.7 `QuotaExceeded`

| Propriedade     | Valor                                        |
|-----------------|----------------------------------------------|
| **Tipo**        | `com.bidflow.saas.quota.exceeded.v1`         |
| **Versão**      | `v1` (active)                                |
| **Produtor**    | `QuotaEnforcementService`                    |
| **Gatilho**     | Tentativa de operação excede limite do plano |
| **Criticidade** | Média                                        |
| **Routing Key** | `{tenantId}.saas.quota.exceeded`             |

**Payload**:
```json
{
  "tenantId": "uuid",
  "subscriptionId": "uuid",
  "resource": "RFP | USERS | API_CALLS | STORAGE",
  "currentUsage": "integer",
  "limit": "integer",
  "overage": "integer",
  "overageAllowed": "boolean",
  "blockedOperation": "string",
  "occurredAt": "datetime"
}
```

**Consumidores**:

| Consumidor | Handler                   | Estratégia | Tipo          |
|------------|---------------------------|------------|---------------|
| Billing    | `chargeOverageIfAllowed`  | Assíncrono | Cobrança      |
| Gateway    | `blockOperation`          | Síncrono   | Bloquear      |
| Notification| `notifyTenantAdmin`       | Assíncrono | Alerta        |

---

## 10. Catálogo: Cross-context Sagas

### 10.1 Saga: `TenantProvisioning`

**Descrição:** Provisiona um novo tenant na plataforma (infra, banco, billing, onboarding).

```
[TenantRegistered] ──→ [ProvisionInfrastructure]
                              │
                              ▼
                         [CreateSubscription]
                              │
                              ▼
                         [InitializeQuotas]
                              │
                              ▼
                         [SendWelcomeKit]
                              │
                              ▼
                         [TenantActivated] → sucesso
                              │
                              ▼
                         [TenantSuspended] → falha (rollback)
```

| Passo                    | Responsável         | Evento (sucesso)          | Evento (falha)             |
|--------------------------|---------------------|---------------------------|----------------------------|
| 1. Registrar             | AuthService         | `TenantRegistered`        | —                          |
| 2. Provisionar infra     | InfraService        | `InfraProvisioned`        | `InfraProvisionFailed`     |
| 3. Criar subscription    | SubscriptionService | `SubscriptionCreated`     | `SubscriptionCreationFailed`|
| 4. Inicializar quotas    | QuotaService        | `QuotasInitialized`       | `QuotaInitializationFailed`|
| 5. Enviar welcome kit    | NotificationService | `WelcomeKitSent`          | `WelcomeKitFailed`         |
| 6. Ativar tenant         | TenantService       | `TenantActivated`         | `TenantActivationFailed`   |

### 10.2 Saga: `ContractAwarding`

**Descrição:** Processo completo de adjudicação de contrato.

```
[ContractAwarded] ──→ [ERP: CommitBudget]
                           │
                           ▼
                      [CRM: UpdatePipeline]
                           │
                           ▼
                      [IA: RecordContract]
                           │
                           ▼
                      [Notification: SendToSupplier]
```

| Passo                    | Responsável         | Compensação                      |
|--------------------------|---------------------|----------------------------------|
| 1. Commit orçamento      | ERP                 | `rollbackBudgetCommit`           |
| 2. Atualizar pipeline    | CRM                 | `revertPipelineUpdate`           |
| 3. Registrar contrato    | IA                  | `deletePredictionData`           |
| 4. Notificar fornecedor  | Notification        | (não compensável — log manual)   |

### 10.3 Saga: `FraudResponse`

**Descrição:** Resposta automática a um alerta de fraude em lance.

```
[BidPlaced] ──→ [IA: FraudDetection]
                     │
                     ▼ (score > 0.8)
              [FraudAlertRaised] ──→ [Suspender Lance]
                                          │
                                          ▼
                                     [Notificar Comissão]
                                          │
                                          ▼
                                     [Registrar Auditoria]
```

---

## 11. Matriz Produtor x Consumidor

### 11.1 Por Contexto

```
                     ┌─────────────────────────────────────────────────────────────────────────────┐
                     │                              CONSUMIDOR                                     │
┌────────────────────├─────────────┬──────────┬──────────┬──────────┬──────────────────────────────┤
│    PRODUTOR        │ Licitações  │   ERP    │   CRM    │    IA    │      SaaS / Infra            │
├────────────────────┼─────────────┼──────────┼──────────┼──────────┼──────────────────────────────┤
│ Licitações         │ —           │ ContractAwarded │ Notify │ BidPlaced│ —                          │
│                    │             │ Supplier ← │         │ RfpPub'd │                            │
├────────────────────┼─────────────┼──────────┼──────────┼──────────┼──────────────────────────────┤
│ ERP                │ Enable      │ —        │ Supplier │ Train    │ —                           │
│                    │ Supplier    │          │ Status   │ Model    │                             │
├────────────────────┼─────────────┼──────────┼──────────┼──────────┼──────────────────────────────┤
│ CRM                │ CreateRFP   │ Activate │ —        │ Score    │ —                           │
│                    │             │ Supplier │          │ Lead     │                             │
├────────────────────┼─────────────┼──────────┼──────────┼──────────┼──────────────────────────────┤
│ IA                 │ SuspendBid  │ —        │ Score    │ —        │ —                           │
│                    │             │          │ Lead     │          │                             │
├────────────────────┼─────────────┼──────────┼──────────┼──────────┼──────────────────────────────┤
│ SaaS Multi-tenant  │ —           │ —        │ Retention│ —        │ BlockAccess, Deprovision    │
└────────────────────┴─────────────┴──────────┴──────────┴──────────┴──────────────────────────────┘
```

### 11.2 Catálogo Completo de Eventos

| Evento                           | Versão | Produtor        | Consumidores                              | Criticidade |
|----------------------------------|--------|-----------------|-------------------------------------------|-------------|
| `RfpCreated`                     | v1     | Licitações      | IA, CRM, Auditoria                        | Alta        |
| `RfpPublished`                   | v1     | Licitações      | CRM, Web, IA                              | Alta        |
| `ProposalSubmitted`              | v1     | Licitações      | IA, ERP, Auditoria                        | Alta        |
| `ProposalDisqualified`           | v1     | Licitações      | CRM, Auditoria                            | Média       |
| `AuctionStarted`                 | v1     | Licitações      | Web, IA, CRM                              | Alta        |
| `BidPlaced`                      | v1     | Licitações      | Web, IA, Auditoria                        | Crítica     |
| `AuctionExtended`                | v1     | Licitações      | Web, Auditoria                            | Alta        |
| `AuctionCompleted`               | v1     | Licitações      | IA, CRM, RFP, Web, Auditoria              | Alta        |
| `ContractAwarded`                | v1     | Licitações      | ERP, CRM, IA, Auditoria                   | Crítica     |
| `ContractSuspended`              | v1     | Licitações      | ERP, CRM, Auditoria                       | Alta        |
| `SupplierQualified`              | v1     | ERP             | CRM, IA, Licitações                       | Alta        |
| `SupplierDisqualified`           | v1     | ERP             | CRM, Licitações                           | Alta        |
| `BudgetCommitted`                | v1     | ERP             | Licitações, Auditoria                     | Alta        |
| `InvoiceApproved`                | v1     | ERP             | CRM, IA, Auditoria                        | Alta        |
| `PaymentProcessed`               | v1     | ERP             | CRM, Licitações                           | Alta        |
| `LeadCaptured`                   | v1     | CRM             | IA, ERP                                   | Média       |
| `LeadQualified`                  | v1     | CRM             | ERP (interno)                             | Média       |
| `LeadConverted`                  | v1     | CRM             | ERP, IA, Licitações                       | Alta        |
| `OpportunityCreated`             | v1     | CRM             | IA                                        | Média       |
| `OpportunityWon`                 | v1     | CRM             | Licitações, IA                            | Alta        |
| `OpportunityLost`                | v1     | CRM             | IA                                        | Média       |
| `CustomerTierChanged`            | v1     | CRM             | ERP, SaaS                                 | Média       |
| `PredictionCompleted`            | v1     | IA              | Licitações, CRM, Collector                | Média       |
| `FraudAlertRaised`               | v1     | IA              | Licitações, Auditoria, Compliance         | Crítica     |
| `ModelDeployed`                  | v1     | IA              | Observability, Config                     | Alta        |
| `ModelTrainingCompleted`         | v1     | IA              | MLOps                                     | Baixa       |
| `PromptTemplateUpdated`          | v1     | IA              | Cache                                     | Média       |
| `TenantRegistered`               | v1     | SaaS            | Provisioning, Billing, Onboarding         | Alta        |
| `TenantActivated`                | v1     | SaaS            | Billing, CRM                              | Alta        |
| `TenantSuspended`                | v1     | SaaS            | Gateway, Infra, Billing                   | Crítica     |
| `SubscriptionCreated`            | v1     | SaaS            | Billing, Quota                            | Alta        |
| `SubscriptionChanged`            | v1     | SaaS            | Quota, Billing, Gateway                   | Alta        |
| `SubscriptionCanceled`           | v1     | SaaS            | Infra, CRM, Billing                       | Alta        |
| `QuotaExceeded`                  | v1     | SaaS            | Billing, Gateway, Notification            | Média       |

---

## 12. Governança

### 12.1 Regras de Publicação

- Evento só pode ser publicado **após** o commit da transação que o gerou (Outbox Pattern).
- Produtor **não pode** lançar exceção se a publicação falhar — o evento deve ir para uma fila de retry interna.
- `eventId` deve ser único: persistir em banco para garantir idempotência.

### 12.2 Regras de Consumo

- **Todo** handler de evento deve ser idempotente (chave = `eventId`).
- Handlers **não** devem lançar exceções de negócio para o broker — tratar internamente e registrar falha.
- Consumidor deve registrar em banco os `eventId` já processados (tabela `event_store`).

### 12.3 Outbox Pattern

```typescript
// infrastructure/outbox/outbox.service.ts
@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService, private readonly amqp: AmqpConnection) {}

  async publish(events: DomainEvent[]): Promise<void> {
    // 1. Salvar na tabela outbox dentro da transação
    await this.prisma.outbox.createMany({
      data: events.map((e) => ({
        id: e.id,
        type: e.type,
        payload: JSON.stringify(e),
        status: 'PENDING',
        createdAt: new Date(),
      })),
    });

    // 2. Publicar no RabbitMQ (fora da transação)
    for (const event of events) {
      await this.amqp.publish('bidflow.domain', event.routingKey, event);
    }
  }
}
```

### 12.4 Schema Registry

```typescript
// Registro obrigatório antes de publicar
interface EventSchema {
  type: string;
  version: string;
  status: 'active' | 'deprecated' | 'sunset' | 'removed';
  schema: JSONSchema;
  deprecatedAt?: string;
  sunsetAt?: string;
  changelog: string[];
}
```

### 12.5 Versionamento na Prática

```json
// Evento v1 original
{
  "type": "com.bidflow.bidding.bid.placed.v1",
  "data": {
    "bidId": "uuid",
    "amount": "decimal",
    "currency": "BRL"
  }
}

// Evento v2 com campo novo (breaking = renomeou currency para currencyCode)
{
  "type": "com.bidflow.bidding.bid.placed.v2",
  "data": {
    "bidId": "uuid",
    "amount": "decimal",
    "currencyCode": "BRL",
    "commission": "decimal"
  }
}

// Período de migração: v1 e v2 publicados em paralelo por 90 dias
// Consumidores v1: recebem apenas v1
// Consumidores v2: recebem apenas v2
```

---

> **Revisão:** Este catálogo deve ser atualizado sempre que um novo evento for adicionado. Todo evento deve ser registrado antes da implementação.
> **Arquivos:** Schemas JSON: `.specify/events/schemas/{context}/{event-name}-v{version}.json`
> **Ferramenta:** Use `speckit.specify` com o template YAML e gere o schema automaticamente.
