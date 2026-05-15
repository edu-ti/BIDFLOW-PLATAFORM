# DDD Enterprise — BidFlow Platform

> **Propósito:** Este documento define o modelo de domínio rico da plataforma BidFlow utilizando Domain-Driven Design (DDD) tático e estratégico. Descreve bounded contexts, aggregates, entidades, value objects, domain services, domain events, limites entre módulos e responsabilidades de cada contexto de negócio.

---

## Sumário

1. [Strategic Design — Context Map](#1-strategic-design--context-map)
2. [Bounded Context: Licitações (Bidding)](#2-bounded-context-licitações-bidding)
3. [Bounded Context: ERP](#3-bounded-context-erp)
4. [Bounded Context: CRM](#4-bounded-context-crm)
5. [Bounded Context: IA (Artificial Intelligence)](#5-bounded-context-ia-artificial-intelligence)
6. [Bounded Context: SaaS Multi-tenant](#6-bounded-context-saas-multi-tenant)
7. [Context Map & Integration](#7-context-map--integration)
8. [Regras Transversais](#8-regras-transversais)
9. [Glossário da Linguagem Ubíqua](#9-glossário-da-linguagem-ubíqua)

---

## 1. Strategic Design — Context Map

### 1.1 Diagrama de Contextos

```
┌─────────────────────────────────────────────────────────────────┐
│                      BIDFLOW PLATFORM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     LICITAÇÕES                            │   │
│  │                  (Core Domain)                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │  │  RFP     │  │ Auction  │  │ Contract │               │   │
│  │  │  Management │  Engine  │  │  Award   │               │   │
│  │  └──────────┘  └──────────┘  └──────────┘               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│       ┌────────────────────┼────────────────────┐               │
│       ▼                    ▼                    ▼               │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐            │
│  │   CRM    │       │   ERP    │       │    IA    │            │
│  │(Support) │       │(Support) │       │(Support) │            │
│  └──────────┘       └──────────┘       └──────────┘            │
│       │                  │                    │                 │
│       └──────────────────┼────────────────────┘                 │
│                          ▼                                      │
│                 ┌──────────────────┐                             │
│                 │ SaaS Multi-tenant│                             │
│                 │ (Generic/Cross) │                             │
│                 └──────────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Relacionamentos entre contextos

| Contexto A     | Relacionamento       | Contexto B        | Mecanismo                |
|----------------|----------------------|-------------------|--------------------------|
| Licitações     | Partnership (S,O)    | CRM               | Domain Events + ACL      |
| Licitações     | Partnership (S,O)    | ERP               | Domain Events + ACL      |
| Licitações     | Customer/Supplier    | IA                | Eventos + HTTP           |
| CRM            | Shared Kernel (user) | ERP               | Banco compartilhado      |
| Todos          | Conformist           | SaaS Multi-tenant | Middleware + Lib         |

**Legenda:** S = upstream (Supplier), O = downstream (Open host service)

---

## 2. Bounded Context: Licitações (Bidding)

**Tipo:** Core Domain
**Responsabilidade:** Gerenciar todo o ciclo de vida de licitações eletrônicas — desde a criação de uma solicitação até a adjudicação do contrato.

### 2.1 Linguagem Ubíqua

| Termo           | Significado                                                  |
|-----------------|--------------------------------------------------------------|
| Licitação       | Processo competitivo para aquisição de bens ou serviços      |
| RFP             | Request for Proposal — solicitação formal de propostas       |
| Lote            | Subdivisão de uma licitação com itens agrupados              |
| Proposta        | Conjunto de lances de um fornecedor para uma licitação       |
| Lance           | Oferta individual de preço em um lote                        |
| Disputa         | Fase de lances eletrônicos em tempo real                     |
| Adjudicação     | Atribuição formal do vencedor                                |
| Contrato        | Acordo formal resultante da licitação                        |
| Edital          | Documento com regras e condições da licitação                |
| Comissão        | Grupo responsável por julgar e adjudicar                     |

### 2.2 Aggregates

#### Aggregate Root: `RFP` (Request for Proposal)

```
RFP
├── id: RfpId
├── tenantId: TenantId
├── title: string
├── description: string
├── modality: Modality              # Value Object
├── status: RfpStatus               # Value Object
├── edition: Edital                 # Entity
├── lots: Lot[]                     # Collection of Entities
│   ├── id: LotId
│   ├── items: LotItem[]
│   ├── minPrice: Money
│   └── maxPrice: Money
├── commission: Commission          # Value Object
├── openingDate: DateTime
├── closingDate: DateTime
├── createdAt: DateTime
└── updatedAt: DateTime
```

- **Invariantes:**
  - Uma RFP só pode receber propostas se `status == PUBLISHED`
  - Data de abertura deve ser anterior à data de fechamento
  - Soma dos valores mínimos dos lotes não pode exceder o orçamento vinculado
- **Identity:** `RfpId` — UUID global

#### Aggregate Root: `Auction` (Disputa Eletrônica)

```
Auction
├── id: AuctionId
├── tenantId: TenantId
├── rfpId: RfpId                    # Referência a outro aggregate
├── lotId: LotId                    # Referência a outro aggregate
├── status: AuctionStatus           # Value Object
├── currentPrice: Money
├── startPrice: Money
├── minDecrement: Money             # Decremento mínimo entre lances
├── extensionTime: Duration         # Tempo de prorrogação automática
├── bids: Bid[]                     # Collection of Entities
│   ├── id: BidId
│   ├── userId: UserId
│   ├── amount: Money
│   ├── timestamp: DateTime
│   └── isAutomatic: boolean
├── winner: UserId                  # Nullable
├── startDate: DateTime
├── endDate: DateTime
├── extendedUntil: DateTime         # Nullable
├── createdAt: DateTime
└── updatedAt: DateTime
```

- **Invariantes:**
  - Lance deve ser inferior ao `currentPrice` em pelo menos `minDecrement`
  - Apenas usuários com perfil `BIDDER` podem propor lances
  - Se um lance ocorrer nos últimos `extensionTime` segundos, o tempo é prorrogado
  - `startPrice` deve ser >= `minDecrement`
- **Identity:** `AuctionId` — UUID global
- **Regra de consistência eventual:** Auction referencia RFP por ID, sem carregá-la

#### Aggregate Root: `Proposal` (Proposta)

```
Proposal
├── id: ProposalId
├── tenantId: TenantId
├── rfpId: RfpId
├── supplierId: SupplierId
├── status: ProposalStatus          # Value Object
├── bids: ProposalBid[]             # Collection of Entities
│   ├── lotId: LotId
│   ├── amount: Money
│   └── attachments: Attachment[]
├── documents: Attachment[]
├── totalAmount: Money
├── createdAt: DateTime
├── submittedAt: DateTime
└── updatedAt: DateTime
```

- **Invariantes:**
  - Uma proposta deve conter lances para todos os lotes obrigatórios
  - Só pode ser submetida se RFP estiver em fase de recebimento de propostas
  - Após submetida, não pode ser alterada — apenas retirada

#### Aggregate Root: `Contract` (Contrato)

```
Contract
├── id: ContractId
├── tenantId: TenantId
├── rfpId: RfpId
├── proposalId: ProposalId
├── supplierId: SupplierId
├── number: string
├── status: ContractStatus          # Value Object
├── clauses: Clause[]
├── value: Money
├── startDate: DateTime
├── endDate: DateTime
├── amendments: Amendment[]
├── milestones: Milestone[]
├── createdAt: DateTime
└── updatedAt: DateTime
```

- **Invariantes:**
  - Um contrato só pode ser criado a partir de uma proposta vencedora
  - Valor total não pode exceder o valor da proposta
  - `endDate` deve ser posterior a `startDate`

### 2.3 Entities (não-raiz)

| Entity        | Aggregate Parent | Descrição                                         |
|---------------|------------------|---------------------------------------------------|
| `Lot`         | RFP              | Agrupamento de itens dentro de uma licitação      |
| `LotItem`     | RFP              | Item individual dentro de um lote                 |
| `Edital`      | RFP              | Documento de regras da licitação                  |
| `Bid`         | Auction          | Lance individual dentro de uma disputa            |
| `ProposalBid` | Proposal         | Lance de proposta para um lote                    |
| `Amendment`   | Contract         | Aditivo contratual                                |
| `Milestone`   | Contract         | Marco de entrega/medição                          |
| `Attachment`  | RFP / Proposal   | Anexo (documento, planilha, edital)               |

### 2.4 Value Objects

| Value Object      | Propriedades                        | Contexto de uso        |
|-------------------|-------------------------------------|------------------------|
| `RfpId`           | UUID                                | Identidade             |
| `AuctionId`       | UUID                                | Identidade             |
| `ProposalId`      | UUID                                | Identidade             |
| `ContractId`      | UUID                                | Identidade             |
| `Money`           | amount: Decimal, currency: Currency | Financeiro             |
| `Currency`        | code: string                        | Financeiro             |
| `Modality`        | type: DisputeType, isElectronic: boolean | Licitação         |
| `RfpStatus`       | DRAFT / PUBLISHED / RECEIVING / CLOSED / AWARDED / CANCELLED |       |
| `AuctionStatus`   | PENDING / ACTIVE / EXTENDED / COMPLETED / CANCELLED |            |
| `ProposalStatus`  | DRAFT / SUBMITTED / WITHDRAWN / DISQUALIFIED |               |
| `ContractStatus`  | ACTIVE / SUSPENDED / COMPLETED / TERMINATED |                |
| `Commission`      | members: UserId[], role: string     | Comissão de licitação  |
| `Duration`        | seconds: number                     | Tempo de prorrogação   |
| `Address`         | street, city, state, zip, country   | Endereço               |

### 2.5 Domain Services

| Service                         | Responsabilidade                                          |
|---------------------------------|-----------------------------------------------------------|
| `BidValidationService`          | Valida se um lance é permitido (decremento, prazo, perfil)|
| `AuctionClosingService`         | Encerra disputa, calcula vencedor, publica evento         |
| `ProposalEvaluationService`     | Avalia propostas com base em critérios do edital          |
| `AutomaticBidService`           | Gerencia lances automáticos (agente pré-configurado)      |
| `DisputeExtensionService`       | Gerencia prorrogação automática por lance nos segundos finais |

### 2.6 Domain Events

| Evento                       | Publisher        | Payload (resumido)                            |
|------------------------------|------------------|-----------------------------------------------|
| `RfpCreated`                 | RFP              | rfpId, title, modality, openingDate           |
| `RfpPublished`               | RFP              | rfpId, publishedAt                            |
| `ProposalSubmitted`          | Proposal         | proposalId, rfpId, supplierId                 |
| `ProposalDisqualified`       | Proposal         | proposalId, reason                            |
| `AuctionStarted`             | Auction          | auctionId, lotId, startPrice, startDate       |
| `BidPlaced`                  | Auction          | bidId, auctionId, userId, amount              |
| `AuctionExtended`            | Auction          | auctionId, newEndDate, reason                 |
| `AuctionCompleted`           | Auction          | auctionId, winnerId, finalPrice               |
| `ContractAwarded`            | Contract         | contractId, supplierId, value, startDate      |
| `ContractSuspended`          | Contract         | contractId, reason                            |

---

## 3. Bounded Context: ERP

**Tipo:** Supporting Domain
**Responsabilidade:** Gestão financeira, orçamentária e de suprimentos. Suporta o core domain com informações de pagamento, nota fiscal e fornecedores.

### 3.1 Linguagem Ubíqua

| Termo           | Significado                                        |
|-----------------|----------------------------------------------------|
| Fornecedor      | Empresa habilitada a participar de licitações      |
| Nota Fiscal     | Documento fiscal de faturamento                    |
| Empenho         | Reserva orçamentária para um contrato              |
| Pagamento       | Liquidação financeira de uma obrigação             |
| Orçamento       | Dotação orçamentária disponível para despesas      |
| Ordem de Compra | Documento interno de autorização de compra         |

### 3.2 Aggregates

#### Aggregate Root: `Supplier`

```
Supplier
├── id: SupplierId
├── tenantId: TenantId
├── legalName: string
├── taxId: string                    # CNPJ/CPF
├── status: SupplierStatus
├── qualifications: Qualification[]
├── bankAccounts: BankAccount[]
├── contacts: Contact[]
├── createdAt: DateTime
└── updatedAt: DateTime
```

- **Invariantes:** `taxId` deve ser único por tenant; Fornecedor precisa estar `QUALIFIED` para participar de licitações

#### Aggregate Root: `BudgetAllocation`

```
BudgetAllocation
├── id: BudgetId
├── tenantId: TenantId
├── year: number
├── department: string
├── totalAmount: Money
├── committedAmount: Money
├── availableAmount: Money           # Calculado: total - committed
├── items: BudgetItem[]
├── createdAt: DateTime
└── updatedAt: DateTime
```

- **Invariantes:** `committedAmount` + `availableAmount` = `totalAmount`; Nenhum empenho pode exceder `availableAmount`

#### Aggregate Root: `Invoice`

```
Invoice
├── id: InvoiceId
├── tenantId: TenantId
├── contractId: ContractId
├── supplierId: SupplierId
├── number: string
├── series: string
├── issueDate: DateTime
├── amount: Money
├── taxes: TaxLine[]
├── status: InvoiceStatus
├── payments: Payment[]
├── createdAt: DateTime
└── updatedAt: DateTime
```

### 3.3 Value Objects

| Value Object       | Propriedades                            | Contexto           |
|--------------------|-----------------------------------------|--------------------|
| `SupplierId`       | UUID                                    | Identidade         |
| `BudgetId`         | UUID                                    | Identidade         |
| `InvoiceId`        | UUID                                    | Identidade         |
| `TaxId`            | value: string, type: TaxIdType          | Documento fiscal   |
| `BankAccount`      | bank, branch, account, digit            | Dados bancários    |
| `TaxLine`          | name: string, rate: Decimal, amount: Money | Tributação     |
| `PaymentTerms`     | dueDays: int, discount: Decimal         | Condições          |

### 3.4 Domain Events

| Evento                    | Publisher     | Payload                                   |
|---------------------------|---------------|-------------------------------------------|
| `SupplierQualified`       | Supplier      | supplierId, qualifiedAt                   |
| `SupplierDisqualified`    | Supplier      | supplierId, reason                        |
| `BudgetCreated`           | BudgetAllocation | budgetId, year, totalAmount            |
| `BudgetCommitted`         | BudgetAllocation | budgetId, amount, contractId          |
| `InvoiceApproved`         | Invoice       | invoiceId, amount, approvedBy             |
| `PaymentProcessed`        | Invoice       | invoiceId, paymentId, amount              |

---

## 4. Bounded Context: CRM

**Tipo:** Supporting Domain
**Responsabilidade:** Gestão do relacionamento com clientes, fornecedores e leads. Alimenta o core domain com inteligência de mercado e prospecção.

### 4.1 Linguagem Ubíqua

| Termo           | Significado                                        |
|-----------------|----------------------------------------------------|
| Lead            | Contato comercial não qualificado                  |
| Oportunidade    | Negócio em prospecção com valor estimado           |
| Cliente         | Entidade com contrato ativo ou histórico           |
| Interação       | Registro de contato (e-mail, telefone, reunião)    |
| Pipeline        | Funil de vendas com estágios                       |

### 4.2 Aggregates

#### Aggregate Root: `Lead`

```
Lead
├── id: LeadId
├── tenantId: TenantId
├── name: string
├── company: string
├── contactInfo: ContactInfo
├── source: LeadSource
├── score: LeadScore
├── status: LeadStatus
├── interactions: Interaction[]
├── assignedTo: UserId
├── convertedToCustomer: CustomerId       # Nullable
├── createdAt: DateTime
└── updatedAt: DateTime
```

#### Aggregate Root: `Opportunity`

```
Opportunity
├── id: OpportunityId
├── tenantId: TenantId
├── leadId: LeadId
├── customerId: CustomerId
├── title: string
├── estimatedValue: Money
├── stage: OpportunityStage
├── probability: Percentage
├── expectedCloseDate: DateTime
├── products: ProductInterest[]
├── interactions: Interaction[]
├── createdAt: DateTime
└── updatedAt: DateTime
```

#### Aggregate Root: `Customer`

```
Customer
├── id: CustomerId
├── tenantId: TenantId
├── leadId: LeadId                        # Nullable
├── legalName: string
├── taxId: TaxId
├── segment: CustomerSegment
├── tier: CustomerTier
├── contracts: ContractId[]
├── interactions: Interaction[]
├── createdAt: DateTime
└── updatedAt: DateTime
```

### 4.3 Value Objects

| Value Object        | Propriedades                             | Contexto         |
|---------------------|------------------------------------------|------------------|
| `ContactInfo`       | email, phone, mobile                     | Contato          |
| `LeadScore`         | score: int, criteria: ScoreCriteria[]    | Qualificação     |
| `CustomerSegment`   | PUBLIC / PRIVATE / GOVERNMENT / NGO      | Segmentação      |
| `CustomerTier`      | BRONZE / SILVER / GOLD / PLATINUM        | Nível            |
| `Percentage`        | value: Decimal                           | Probabilidade    |
| `OpportunityStage`  | QUALIFICATION / PROPOSAL / NEGOTIATION / CLOSED | Pipeline |

### 4.4 Domain Events

| Evento                    | Publisher     | Payload                                    |
|---------------------------|---------------|--------------------------------------------|
| `LeadCaptured`            | Lead          | leadId, source, company                    |
| `LeadQualified`           | Lead          | leadId, score, qualifiedAt                 |
| `LeadConverted`           | Lead          | leadId, customerId                         |
| `OpportunityCreated`      | Opportunity   | opportunityId, customerId, estimatedValue  |
| `OpportunityWon`          | Opportunity   | opportunityId, value, closedAt             |
| `OpportunityLost`         | Opportunity   | opportunityId, reason                      |
| `CustomerTierChanged`     | Customer      | customerId, oldTier, newTier               |

---

## 5. Bounded Context: IA (Artificial Intelligence)

**Tipo:** Supporting Domain
**Responsabilidade:** Fornecer capacidades de inteligência artificial — predição, recomendação, detecção de anomalias e PLN — para todos os contextos da plataforma.

### 5.1 Linguagem Ubíqua

| Termo            | Significado                                       |
|------------------|---------------------------------------------------|
| Modelo           | Artefato treinado que realiza inferências         |
| Predição         | Resultado de inferência sobre dados               |
| Score de Fraude  | Probabilidade de um lance ser fraudulento         |
| Embedding        | Representação vetorial de texto                   |
| Prompt           | Instrução enviada a um LLM                        |
| Pipeline         | Sequência de transformações para treino/inferência|
| Fine-tuning      | Ajuste fino de modelo com dados do domínio        |

### 5.2 Aggregates

#### Aggregate Root: `AIModel`

```
AIModel
├── id: ModelId
├── tenantId: TenantId
├── name: string
├── version: ModelVersion
├── type: ModelType                     # CLASSIFICATION / REGRESSION / LLM / EMBEDDING
├── provider: ModelProvider             # OPENAI / HUGGINGFACE / CUSTOM
├── status: ModelStatus                 # TRAINING / DEPLOYED / DEPRECATED / FAILED
├── config: ModelConfig
├── metrics: ModelMetrics               # accuracy, latency, tokens
├── trainedAt: DateTime
├── deployedAt: DateTime
└── updatedAt: DateTime
```

#### Aggregate Root: `Prediction`

```
Prediction
├── id: PredictionId
├── tenantId: TenantId
├── modelId: ModelId
├── inputHash: string                   # Hash dos dados de entrada
├── input: object
├── output: object
├── confidence: Decimal
├── latency: Duration
├── feedback: PredictionFeedback        # Nullable — útil/não útil
├── requestedBy: UserId
├── createdAt: DateTime
└── updatedAt: DateTime
```

- **Invariantes:** `inputHash` garante idempotência; mesma entrada + mesmo modelo = mesma predição

#### Aggregate Root: `PromptTemplate`

```
PromptTemplate
├── id: PromptId
├── tenantId: TenantId
├── name: string
├── context: string                     # Bidding / CRM / ERP
├── template: string                    # Template com placeholders
├── variables: PromptVariable[]
├── version: int
├── modelId: ModelId
├── createdAt: DateTime
└── updatedAt: DateTime
```

### 5.3 Value Objects

| Value Object       | Propriedades                                  | Contexto          |
|--------------------|-----------------------------------------------|-------------------|
| `ModelId`          | UUID                                          | Identidade        |
| `PredictionId`     | UUID                                          | Identidade        |
| `PromptId`         | UUID                                          | Identidade        |
| `ModelVersion`     | major: int, minor: int, patch: int            | Versionamento     |
| `ModelConfig`      | temperature, maxTokens, topP, frequencyPenalty| Hiperparâmetros   |
| `ModelMetrics`     | accuracy, precision, recall, f1, avgLatency   | Performance       |
| `PredictionFeedback` | isUseful: boolean, comment: string          | Feedback loop     |
| `EmbeddingVector`  | vector: number[], dimension: int              | Representação     |

### 5.4 Domain Services

| Service                      | Responsabilidade                                        |
|------------------------------|---------------------------------------------------------|
| `ModelInferenceService`      | Executa inferência em modelo (cache, fallback)          |
| `FraudDetectionService`      | Analisa lances e retorna score de risco                 |
| `PricePredictionService`     | Estima faixa de preço ideal para itens                  |
| `BidderRecommendationService`| Recomenda fornecedores para licitações                  |
| `DocumentAnalysisService`    | Extrai dados de editais e contratos (OCR + PLN)         |
| `PromptExecutionService`     | Gerencia chamadas a LLMs com templates versionados      |

### 5.5 Domain Events

| Evento                        | Publisher     | Payload                                    |
|-------------------------------|---------------|--------------------------------------------|
| `PredictionCompleted`         | Prediction    | predictionId, modelId, output, confidence  |
| `ModelDeployed`               | AIModel       | modelId, version, deployedAt               |
| `ModelTrainingStarted`        | AIModel       | modelId, datasetVersion                    |
| `ModelTrainingCompleted`      | AIModel       | modelId, metrics                           |
| `FraudAlertRaised`            | FraudDetection| bidId, score, reason, auctionId            |
| `PromptTemplateUpdated`       | PromptTemplate| promptId, version, updatedBy               |

---

## 6. Bounded Context: SaaS Multi-tenant

**Tipo:** Generic Subdomain (Cross-cutting)
**Responsabilidade:** Gerenciar o ciclo de vida dos inquilinos (tenants), planos, assinaturas, limites de uso e faturamento. Atua como camada transversal que todos os outros contextos consomem.

### 6.1 Linguagem Ubíqua

| Termo           | Significado                                          |
|-----------------|------------------------------------------------------|
| Tenant          | Organização/cliente que utiliza a plataforma         |
| Plano           | Conjunto de limites e features contratados           |
| Assinatura      | Vínculo entre tenant e plano com vigência            |
| Quota           | Limite de uso por recurso (licitações, usuários, API)|
| Feature Flag    | Chave que habilita/desabilita funcionalidade         |
| Ciclo de Fatura | Período de cobrança (mensal, anual)                  |

### 6.2 Aggregates

#### Aggregate Root: `Tenant`

```
Tenant
├── id: TenantId
├── legalName: string
├── taxId: string
├── slug: string                          # Identificador amigável único
├── status: TenantStatus
├── config: TenantConfig                  # Value Object
├── features: FeatureFlag[]
├── subscriptionId: SubscriptionId
├── domain: string                        # Domínio customizado (opcional)
├── contacts: Contact[]
├── createdAt: DateTime
├── activatedAt: DateTime
└── updatedAt: DateTime
```

- **Invariantes:** `slug` deve ser único globalmente; Só pode ter uma assinatura ativa por vez

#### Aggregate Root: `Subscription`

```
Subscription
├── id: SubscriptionId
├── tenantId: TenantId
├── planId: PlanId
├── status: SubscriptionStatus            # TRIAL / ACTIVE / PAST_DUE / CANCELED / EXPIRED
├── billingCycle: BillingCycle            # Value Object
├── quotas: Quota[]
├── trialEndsAt: DateTime                 # Nullable
├── currentPeriodStart: DateTime
├── currentPeriodEnd: DateTime
├── canceledAt: DateTime                  # Nullable
├── createdAt: DateTime
└── updatedAt: DateTime
```

- **Invariantes:** Subscription não pode ser criada se tenant tiver subscription `ACTIVE`; Quotas não podem exceder limites do plano

#### Aggregate Root: `Plan`

```
Plan
├── id: PlanId
├── name: string                          # STARTER / BUSINESS / ENTERPRISE
├── description: string
├── price: Money
├── billingCycle: BillingCycle
├── quotas: QuotaDefinition[]
│   ├── resource: QuotaResource
│   ├── limit: int
│   └── overageAllowed: boolean
├── features: FeatureFlag[]
├── isPublic: boolean
├── createdAt: DateTime
└── updatedAt: DateTime
```

### 6.3 Value Objects

| Value Object        | Propriedades                              | Contexto           |
|---------------------|-------------------------------------------|--------------------|
| `TenantId`          | UUID                                      | Identidade         |
| `SubscriptionId`    | UUID                                      | Identidade         |
| `PlanId`            | UUID                                      | Identidade         |
| `TenantConfig`      | locale, timezone, dateFormat, currency    | Configuração       |
| `FeatureFlag`       | key: string, enabled: boolean             | Feature toggle     |
| `BillingCycle`      | type: MONTHLY / YEARLY, interval: int     | Ciclo de cobrança  |
| `Quota`             | resource: QuotaResource, used: int, limit: int | Uso            |
| `QuotaDefinition`   | resource: QuotaResource, limit: int       | Limite do plano    |
| `Contact`           | name, email, phone, role                  | Contato            |

### 6.4 Domain Services

| Service                        | Responsabilidade                                          |
|--------------------------------|-----------------------------------------------------------|
| `TenantProvisioningService`    | Cria tenant, configura schema, inicializa dados padrão    |
| `QuotaEnforcementService`      | Verifica se operação pode prosseguir dentro dos limites   |
| `SubscriptionBillingService`   | Gera faturas, processa pagamentos, gerencia ciclos        |
| `FeatureGateService`           | Valida se feature está disponível para o tenant           |

### 6.5 Domain Events

| Evento                        | Publisher      | Payload                                    |
|-------------------------------|----------------|--------------------------------------------|
| `TenantRegistered`            | Tenant         | tenantId, planId, registeredAt             |
| `TenantActivated`             | Tenant         | tenantId, activatedAt                      |
| `TenantSuspended`             | Tenant         | tenantId, reason                           |
| `SubscriptionCreated`         | Subscription   | subscriptionId, tenantId, planId           |
| `SubscriptionChanged`         | Subscription   | subscriptionId, oldPlanId, newPlanId       |
| `SubscriptionCanceled`        | Subscription   | subscriptionId, canceledAt                 |
| `QuotaExceeded`               | Quota          | tenantId, resource, limit, current         |

---

## 7. Context Map & Integration

### 7.1 Matriz de Comunicação entre Contextos

| De \ Para          | Licitações     | CRM            | ERP            | IA             | Multi-tenant   |
|--------------------|----------------|----------------|----------------|----------------|----------------|
| **Licitações**     | —              | Evento: `ContractAwarded` → CRM atualiza pipeline | Evento: `ContractAwarded` → ERP empenha orçamento | Evento: `BidPlaced` → IA analisa fraude | ACL: extrai tenantId |
| **CRM**            | ACL: cria Lead → RFP | —          | ACL: Lead → Supplier | Evento: `LeadCaptured` → IA score | ACL: extrai tenantId |
| **ERP**            | ACL: Budget → RFP limits | ACL: Supplier → CRM | — | — | ACL: extrai tenantId |
| **IA**             | Serviço: `FraudAlertRaised` → suspende lance | Serviço: `LeadScore` → prioriza lead | — | — | ACL: extrai tenantId |
| **Multi-tenant**   | Middleware: injeta `TenantId` em toda requisição | | | | — |

### 7.2 Regras de Integração

1. **Eventos assíncronos** são o mecanismo primário de integração entre contextos.
2. **ACL (Anti-corruption Layer)** deve ser implementada em todo ponto de integração síncrona.
3. **Shared Kernel** mínimo: tipos `UserId`, `TenantId` e `Money` são compartilhados entre todos os contextos via `packages/types`.
4. **Event Carried State Transfer**: eventos carregam dados suficientes para que consumidores não precisem buscar dados no publisher.
5. **Idempotência**: todo handler de evento deve ser idempotente (chave = `eventId`).

### 7.3 Mapa de Agregados por Contexto

```
Licitações                    CRM                         ERP
┌────────────────────┐       ┌────────────────────┐     ┌────────────────────┐
│ RFP                │       │ Lead               │     │ Supplier           │
│ Auction            │       │ Opportunity        │     │ BudgetAllocation   │
│ Proposal           │       │ Customer           │     │ Invoice            │
│ Contract           │       └────────────────────┘     └────────────────────┘
└────────────────────┘
                                                          IA
IA (apps/analytics)             ┌───────────────────────── Multi-tenant
┌────────────────────┐          │  ┌────────────────────┐ ─ ─ ─ ─ ─ ─ ─ ─ ─
│ AIModel            │          │  │ Tenant             │  Cross-cutting
│ Prediction         │          │  │ Subscription       │
│ PromptTemplate     │          │  │ Plan               │
└────────────────────┘          │  └────────────────────┘
                                └─────────────────────►  Todos os contextos
```

### 7.4 Fluxo Cross-Context: Ciclo Completo de Licitação

```
1. CRM  ──► LeadCaptured ──► Lead convertido em Supplier (ERP)
2. ERP  ──► SupplierQualified ──► Supplier habilitado para licitar
3. Li   ──► RfpCreated ──► IA analisa edital e sugere itens
4. Li   ──► RfpPublished ──► Notifica fornecedores (CRM)
5. Li   ──► AuctionStarted ──► IA monitora lances em tempo real
6. IA   ──► FraudAlertRaised ──► Auction suspende lance suspeito
7. Li   ──► AuctionCompleted ──► IA valida resultado
8. Li   ──► ContractAwarded ──► ERP empenha orçamento + CRM atualiza pipeline
9. ERP  ──► InvoiceApproved ──► Pagamento processado
```

---

## 8. Regras Transversais

### 8.1 Todo aggregate deve respeitar

```typescript
interface Aggregate<Id> {
  id: Id;
  tenantId: TenantId;
  createdAt: DateTime;
  updatedAt: DateTime;
  // ...
  // getAllDomainEvents(): DomainEvent[]  — método interno
  // clearEvents(): void                  — após publicação
}
```

### 8.2 Regras de consistência

| Tipo              | Estratégia            | Onde aplicar                              |
|-------------------|-----------------------|-------------------------------------------|
| Imediata          | Transação de banco    | Dentro de um único aggregate              |
| Eventual          | Domain Events + Saga  | Entre aggregates do mesmo contexto        |
| Eventual          | Eventos + ACL         | Entre contextos diferentes                |

### 8.3 Tamanho de aggregate

- Um aggregate deve ser pequeno o suficiente para ser carregado em uma única transação.
- Referências a outros aggregates devem ser **por ID**, nunca por objeto carregado.
- Regra prática: um aggregate não deve conter mais de 5-7 entidades internas.

### 8.4 Repository Contracts

Cada aggregate root tem sua interface de repositório no `domain/`:

```typescript
interface RfpRepository {
  save(rfp: RFP): Promise<void>;
  findById(id: RfpId): Promise<RFP | null>;
  findByTenant(tenantId: TenantId, filters: RfpFilters): Promise<RFP[]>;
  delete(id: RfpId): Promise<void>;
}
```

### 8.5 Camadas dentro de cada contexto

```
┌──────────────────────────────────────────────┐
│                 APPLICATION                   │
│  (Commands, Queries, DTOs, Use Cases)        │
├──────────────────────────────────────────────┤
│                 DOMAIN                        │
│  (Entities, VOs, Services, Repositories)     │
├──────────────────────────────────────────────┤
│              INFRASTRUCTURE                   │
│  (Prisma, RabbitMQ, HTTP, Cache, Gateways)   │
└──────────────────────────────────────────────┘
```

---

## 9. Glossário da Linguagem Ubíqua

| Termo             | Contexto       | Definição                                                  |
|-------------------|----------------|------------------------------------------------------------|
| Aggregate         | Transversal    | Cluster de entidades tratado como unidade de consistência  |
| Aggregate Root    | Transversal    | Entidade raiz que garante invariantes do aggregate         |
| Bounded Context   | Transversal    | Limite explícito onde um modelo de domínio é válido        |
| Entity            | Transversal    | Objeto com identidade contínua e ciclo de vida             |
| Value Object      | Transversal    | Objeto imutável definido por seus atributos                |
| Domain Event      | Transversal    | Registro atômico de algo relevante que ocorreu no domínio  |
| Domain Service    | Transversal    | Operação sem estado que não pertence a uma entidade        |
| Repository        | Transversal    | Mecanismo de persistência que simula coleção em memória    |
| ACL               | Transversal    | Camada que traduz modelos entre bounded contexts           |
| Licitação         | Licitações     | Processo competitivo para aquisição de bens/serviços       |
| RFP               | Licitações     | Solicitação formal de propostas                            |
| Lance             | Licitações     | Oferta de preço em uma disputa ou proposta                 |
| Adjudicação       | Licitações     | Atribuição formal do vencedor                              |
| Edital            | Licitações     | Conjunto de regras e condições da licitação                |
| Fornecedor        | ERP            | Pessoa jurídica habilitada a fornecer bens/serviços        |
| Empenho           | ERP            | Reserva orçamentária para futura despesa                   |
| Lead              | CRM            | Contato comercial em estágio inicial de qualificação       |
| Oportunidade      | CRM            | Negócio mapeado no funil de vendas                         |
| Tenant            | Multi-tenant   | Organização cliente que consome a plataforma               |
| Quota             | Multi-tenant   | Limite contratual de uso de recurso                        |
| Modelo            | IA             | Artefato treinado que produz inferências                   |
| Predição          | IA             | Resultado de inferência de um modelo                       |
| Fine-tuning       | IA             | Ajuste de modelo com dados específicos do domínio          |

---

> **Revisão:** Este documento deve ser revisado trimestralmente pelo Architecture Review Board, em conjunto com o documento de Architecture Principles.
> **Novos contexts:** A criação de um novo bounded context deve ser precedida de ADR em `docs/adr/` com aprovação do Architecture Review Board.
