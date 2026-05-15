# BidFlow Platform - Arquitetura DDD Enterprise

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BIDFLOW PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ARCHITECTURE LAYERS                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Presentation Layer (Next.js)                                       │   │
│  │         │                    │                    │                  │   │
│  │    ┌────▼────┐          ┌────▼────┐        ┌────▼────┐             │   │
│  │    │   Web   │          │ Mobile  │        │   API   │             │   │
│  │    │   App   │          │   App   │        │ Gateway │             │   │
│  │    └─────────┘          └─────────┘        └─────────┘             │   │
│  │                                                  │                  │   │
│  ├──────────────────────────────────────────────────┼──────────────────┤   │
│  │                 API Gateway (NestJS)            │                  │   │
│  │         │                    │                    │                  │   │
│  │    ┌────▼────┐          ┌────▼────┐        ┌────▼────┐             │   │
│  │    │  BFFs   │          │  BFFs   │        │  BFFs   │             │   │
│  │    └─────────┘          └─────────┘        └─────────┘             │   │
│  │         │                    │                    │                  │   │
│  ├─────────┼────────────────────┼────────────────────┼──────────────────┤   │
│  │         │                    │                    │                  │   │
│  │    ┌────▼────────────────────▼────────────────────▼────┐            │   │
│  │    │              APPLICATION CORE (NestJS)            │            │   │
│  │    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │            │   │
│  │    │  │   CRM   │ │   ERP   │ │  IA     │ │Workflow │  │            │   │
│  │    │  │ Context │ │ Context │ │ Context │ │ Context │  │            │   │
│  │    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │            │   │
│  │    │  ┌─────────┐ ┌─────────┐ ┌─────────────────────┐  │            │   │
│  │    │  │Licitações│ │  SaaS   │ │ Multi-Tenant       │  │            │   │
│  │    │  │ Context │ │ Context │ │ Context (Shared)   │  │            │   │
│  │    │  └─────────┘ └─────────┘ └─────────────────────┘  │            │   │
│  │    └────────────────────────────────────────────────────┘            │   │
│  │                              │                                         │   │
│  ├──────────────────────────────┼──────────────────────────────────────┤   │
│  │                   INFRASTRUCTURE                                      │   │
│  │    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                │   │
│  │    │PostgreSQL│  │  Redis  │  │RabbitMQ │  │FastAPI │                │   │
│  │    │         │  │         │  │         │  │  (IA)  │                │   │
│  │    └─────────┘  └─────────┘  └─────────┘  └─────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Bounded Contexts

### 1.1 Contexto: Tenant Context (Contexto de Multitenancy)

**Responsabilidade**: Gerenciar a isolação de dados entre tenants, autenticação centralizada e configurações globais.

**Agregados Principais**:

- **Tenant** (Aggregate Root)
- **TenantConfiguration**
- **TenantSubscription**

**Relacionamento com outros contextos**:
- Fornece contexto de identificação para todos os outros bounded contexts
- Valida acesso e permissions através de todos os contextos

```typescript
// Domain/Tenant/Entities/Tenant.ts
export class Tenant {
  private id: TenantId;
  private name: string;
  private slug: string;
  private status: TenantStatus;
  private subscription: TenantSubscription;
  private config: TenantConfiguration;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(props: TenantProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.status = props.status;
    this.subscription = props.subscription;
    this.config = props.config;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  activate(): void {
    if (this.status === TenantStatus.SUSPENDED) {
      throw new DomainException('Cannot activate a suspended tenant');
    }
    this.status = TenantStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  suspend(): void {
    this.status = TenantStatus.SUSPENDED;
    this.updatedAt = new Date();
  }

  upgradePlan(plan: SubscriptionPlan): void {
    this.subscription.upgrade(plan);
    this.updatedAt = new Date();
  }
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  TRIAL = 'TRIAL'
}

export enum SubscriptionPlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}
```

### 1.2 Contexto: CRM (Gestão de Relacionamento com Clientes)

**Responsabilidade**: Gerenciar contatos, empresas, Pipeline de vendas e atividades comerciais.

**Agregados Principais**:

- **Contact** (Aggregate Root)
- **Company** (Aggregate Root)
- **SalesPipeline** (Aggregate Root)
- **Deal** (Aggregate Root)
- **Activity** (Aggregate Root)

**Relacionamento com outros contextos**:
- Compartilha dados de clientes com o contexto de Licitações
- Fornece dados para o contexto de IA para análise de comportamento

```typescript
// Domain/CRM/Entities/Company.ts
export class Company {
  private id: CompanyId;
  private tenantId: TenantId;
  private name: string;
  private tradeName?: string;
  private cnpj: CNPJ;
  private segment: CompanySegment;
  private size: CompanySize;
  private address: Address;
  private contacts: Contact[];
  private deals: Deal[];
  private customFields: Map<string, any>;
  private status: CompanyStatus;
  private score: number;
  private createdAt: Date;
  private updatedAt: Date;

  addContact(contact: Contact): void {
    if (!this.hasContact(contact.id)) {
      this.contacts.push(contact);
      this.updatedAt = new Date();
    }
  }

  removeContact(contactId: ContactId): void {
    this.contacts = this.contacts.filter(c => !c.id.equals(contactId));
    this.updatedAt = new Date();
  }

  updateScore(score: number): void {
    this.score = Math.max(0, Math.min(100, score));
    this.updatedAt = new Date();
  }

  convertToClient(): void {
    if (this.status !== CompanyStatus.PROSPECT) {
      throw new DomainException('Only prospects can be converted to clients');
    }
    this.status = CompanyStatus.CLIENT;
    this.updatedAt = new Date();
  }
}

export class Deal {
  private id: DealId;
  private tenantId: TenantId;
  private company: Company;
  private contact: Contact;
  private pipeline: SalesPipeline;
  private title: string;
  private value: Money;
  private stage: PipelineStage;
  private probability: number;
  private expectedCloseDate: Date;
  private activities: Activity[];
  private proposals: Proposal[];
  private status: DealStatus;
  private wonAt?: Date;
  private lostAt?: Date;
  private lostReason?: string;
  private createdAt: Date;
  private updatedAt: Date;

  moveToStage(stage: PipelineStage): void {
    this.stage = stage;
    this.probability = stage.defaultProbability;
    this.updatedAt = new Date();
  }

  win(): void {
    if (this.status !== DealStatus.OPEN) {
      throw new DomainException('Only open deals can be won');
    }
    this.status = DealStatus.WON;
    this.wonAt = new Date();
    this.updatedAt = new Date();
  }

  lose(reason: string): void {
    if (this.status !== DealStatus.OPEN) {
      throw new DomainException('Only open deals can be lost');
    }
    this.status = DealStatus.LOST;
    this.lostAt = new Date();
    this.lostReason = reason;
    this.updatedAt = new Date();
  }
}
```

### 1.3 Contexto: ERP (Gestão Empresarial)

**Responsabilidade**: Gerenciar finanças, projetos, recursos humanos e operações integradas.

**Agregados Principais**:

- **Project** (Aggregate Root)
- **FinancialTransaction** (Aggregate Root)
- **Invoice** (Aggregate Root)
- **Budget** (Aggregate Root)
- **Resource** (Aggregate Root)
- **CostCenter** (Aggregate Root)

**Relacionamento com outros contextos**:
- Consome dados de Licitações para orçamento de projetos
- Fornece dados financeiros para o contexto de SaaS (billing)
- Integra com Workflow para automação de processos

```typescript
// Domain/ERP/Entities/Project.ts
export class Project {
  private id: ProjectId;
  private tenantId: TenantId;
  private name: string;
  private description: string;
  private status: ProjectStatus;
  private type: ProjectType;
  private budget: Budget;
  private startDate: Date;
  private endDate?: Date;
  private team: ProjectTeam;
  private milestones: Milestone[];
  private tasks: Task[];
  private expenses: Expense[];
  private contracts: Contract[];
  private bidding?: Bidding;
  private customFields: Map<string, any>;
  private createdAt: Date;
  private updatedAt: Date;

  calculateBudgetUtilization(): Percentage {
    const totalSpent = this.expenses.reduce((sum, e) => sum + e.amount.value, 0);
    return new Percentage((totalSpent / this.budget.total.value) * 100);
  }

  isOverBudget(): boolean {
    return this.calculateBudgetUtilization().value > 100;
  }

  addMilestone(milestone: Milestone): void {
    if (this.endDate && milestone.dueDate > this.endDate) {
      throw new DomainException('Milestone due date cannot exceed project end date');
    }
    this.milestones.push(milestone);
    this.updatedAt = new Date();
  }

  complete(): void {
    if (this.status === ProjectStatus.COMPLETED) {
      throw new DomainException('Project is already completed');
    }
    const allMilestonesCompleted = this.milestones.every(m => m.isCompleted());
    if (!allMilestonesCompleted) {
      throw new DomainException('All milestones must be completed');
    }
    this.status = ProjectStatus.COMPLETED;
    this.endDate = new Date();
    this.updatedAt = new Date();
  }
}

export class FinancialTransaction {
  private id: TransactionId;
  private tenantId: TenantId;
  private type: TransactionType;
  private category: TransactionCategory;
  private amount: Money;
  private currency: Currency;
  private description: string;
  private date: Date;
  private status: TransactionStatus;
  private project?: Project;
  private costCenter: CostCenter;
  private paymentMethod?: PaymentMethod;
  private attachments: Attachment[];
  private createdAt: Date;
  private updatedAt: Date;

  reconcile(): void {
    if (this.status !== TransactionStatus.PENDING) {
      throw new DomainException('Only pending transactions can be reconciled');
    }
    this.status = TransactionStatus.RECONCILED;
    this.updatedAt = new Date();
  }
}
```

### 1.4 Contexto: Licitações (Core do BidFlow)

**Responsabilidade**: Gerenciar todo o ciclo de vida de licitações públicas e privadas, desde a captura até a participação e acompanhamento.

**Agregados Principais**:

- **Bidding** (Aggregate Root)
- **BiddingDocument** (Aggregate Root)
- **Bid** (Aggregate Root)
- **BiddingProposal** (Aggregate Root)
- **BiddingCalendar** (Aggregate Root)
- **BiddingAnalysis** (Aggregate Root)

**Relacionamento com outros contextos**:
- Integra com CRM para dados de clientes e propostas
- Consome IA para análise e recomendações
- Relaciona-se com ERP para orçamentos e projetos

```typescript
// Domain/Bidding/Entities/Bidding.ts
export class Bidding {
  private id: BiddingId;
  private tenantId: TenantId;
  private title: string;
  private description: string;
  private type: BiddingType;
  private modality: BiddingModality;
  private status: BiddingStatus;
  private regime: BiddingRegime;
  
  // Identificação
  private processNumber: string;
  private edNumber?: string;
  
  // Dates
  private publicationDate: Date;
  private openingDate: Date;
  private closingDate: Date;
  private clarificationDeadline?: Date;
  private appealDeadline?: Date;
  
  // Valores
  private estimatedValue: Money;
  private budgetRange?: BudgetRange;
  private currency: Currency;
  
  // Entidades
  private contractingEntity: ContractingEntity;
  private location: Location;
  private category: BiddingCategory;
  private objects: BiddingObject[];
  private documents: BiddingDocument[];
  private questions: BiddingQuestion[];
  private proposals: BiddingProposal[];
  private clarifications: Clarification[];
  
  // IA
  private analysis?: BiddingAnalysis;
  private recommendationScore?: number;
  private suitabilityScore?: number;
  
  // Metadata
  private source: BiddingSource;
  private sourceUrl?: string;
  private tags: string[];
  private customFields: Map<string, any>;
  private createdAt: Date;
  private updatedAt: Date;

  publish(): void {
    if (this.status !== BiddingStatus.DRAFT) {
      throw new DomainException('Only draft biddings can be published');
    }
    if (!this.validateRequiredFields()) {
      throw new DomainException('Missing required fields for publication');
    }
    this.status = BiddingStatus.PUBLISHED;
    this.updatedAt = new Date();
  }

  close(): void {
    if (this.status !== BiddingStatus.PUBLISHED) {
      throw new DomainException('Only published biddings can be closed');
    }
    this.status = BiddingStatus.CLOSED;
    this.closingDate = new Date();
    this.updatedAt = new Date();
  }

  addProposal(proposal: BiddingProposal): void {
    if (this.status !== BiddingStatus.PUBLISHED) {
      throw new DomainException('Cannot add proposal to a non-published bidding');
    }
    if (new Date() > this.closingDate) {
      throw new DomainException('Bidding submission deadline has passed');
    }
    this.proposals.push(proposal);
    this.updatedAt = new Date();
  }

  calculateSuitability(companyProfile: CompanyProfile): SuitabilityScore {
    const score = new SuitabilityCalculator(this, companyProfile).calculate();
    this.suitabilityScore = score.value;
    return score;
  }
}

export class BiddingProposal {
  private id: ProposalId;
  private tenantId: TenantId;
  private bidding: Bidding;
  private bidder: Company;
  private items: ProposalItem[];
  private totalValue: Money;
  private discount: Percentage;
  private paymentTerms: PaymentTerms;
  private validity: number;
  private documents: Document[];
  private status: ProposalStatus;
  private submittedAt: Date;
  private technicalScore?: number;
  private commercialScore?: number;
  private finalScore?: number;
  private rank?: number;
  private winner: boolean;
  private createdAt: Date;
  private updatedAt: Date;

  submit(): void {
    if (this.status !== ProposalStatus.DRAFT) {
      throw new DomainException('Only draft proposals can be submitted');
    }
    if (new Date() > this.bidding.closingDate) {
      throw new DomainException('Bidding submission deadline has passed');
    }
    this.status = ProposalStatus.SUBMITTED;
    this.submittedAt = new Date();
    this.updatedAt = new Date();
  }

  calculateScore(): void {
    this.technicalScore = this.calculateTechnicalScore();
    this.commercialScore = this.calculateCommercialScore();
    this.finalScore = (this.technicalScore * 0.6) + (this.commercialScore * 0.4);
    this.updatedAt = new Date();
  }
}
```

### 1.5 Contexto: IA (Inteligência Artificial)

**Responsabilidade**: Processamento de linguagem natural, análise preditiva, recomendações e automação inteligente.

**Agregados Principais**:

- **AIAnalysis** (Aggregate Root)
- **AIModel** (Aggregate Root)
- **Prediction** (Aggregate Root)
- **Recommendation** (Aggregate Root)
- **NLPAnalysis** (Aggregate Root)

**Arquitetura**:
- Microsserviço Python FastAPI dedicado
- Integra com RabbitMQ para eventos
- Utiliza Redis para cache de modelos

```typescript
// Domain/AI/Entities/AIAnalysis.ts
export class AIAnalysis {
  private id: AnalysisId;
  private tenantId: TenantId;
  private type: AnalysisType;
  private status: AnalysisStatus;
  private input: AnalysisInput;
  private output?: AnalysisOutput;
  private model: AIModel;
  private confidence: Percentage;
  private processingTime: number;
  private errors: string[];
  private completedAt?: Date;
  private createdAt: Date;
  private updatedAt: Date;

  async process(input: AnalysisInput): Promise<void> {
    this.status = AnalysisStatus.PROCESSING;
    this.input = input;
    this.updatedAt = new Date();
    
    try {
      const result = await this.executeAnalysis(input);
      this.output = result.output;
      this.confidence = result.confidence;
      this.processingTime = result.processingTime;
      this.status = AnalysisStatus.COMPLETED;
      this.completedAt = new Date();
    } catch (error) {
      this.status = AnalysisStatus.FAILED;
      this.errors.push(error.message);
    }
    this.updatedAt = new Date();
  }
}

export class BiddingAnalysis {
  private id: BiddingAnalysisId;
  private bidding: Bidding;
  private suitability: SuitabilityAnalysis;
  private riskAnalysis: RiskAnalysis;
  private competitorAnalysis: CompetitorAnalysis;
  private recommendation: BiddingRecommendation;
  private priceEstimation: PriceEstimation;
  private processingStatus: ProcessingStatus;
  private createdAt: Date;
  private updatedAt: Date;

  generateRecommendation(): BiddingRecommendation {
    const factors = {
      suitability: this.suitability.score,
      risk: this.riskAnalysis.score,
      competition: this.competitorAnalysis.score,
      profitability: this.priceEstimation.margin
    };
    
    return new RecommendationEngine(factors).generate();
  }
}
```

### 1.6 Contexto: Workflow (Automação de Processos)

**Responsabilidade**: Orquestração de processos de negócio, automação de tarefas e gerenciamento de workflows.

**Agregados Principais**:

- **Workflow** (Aggregate Root)
- **WorkflowInstance** (Aggregate Root)
- **WorkflowTask** (Aggregate Root)
- **AutomationRule** (Aggregate Root)
- **Trigger** (Aggregate Root)

**Relacionamento com outros contextos**:
- Orquestra processos entre todos os contextos
- Recebe eventos de RabbitMQ de todos os contextos

```typescript
// Domain/Workflow/Entities/Workflow.ts
export class Workflow {
  private id: WorkflowId;
  private tenantId: TenantId;
  private name: string;
  private description: string;
  private category: WorkflowCategory;
  private version: number;
  private status: WorkflowStatus;
  private nodes: WorkflowNode[];
  private edges: WorkflowEdge[];
  private triggers: Trigger[];
  private variables: Map<string, VariableDefinition>;
  private permissions: WorkflowPermission[];
  private isTemplate: boolean;
  private createdAt: Date;
  private updatedAt: Date;

  activate(): void {
    if (!this.validate()) {
      throw new DomainException('Workflow validation failed');
    }
    this.status = WorkflowStatus.ACTIVE;
    this.version++;
    this.updatedAt = new Date();
  }

  validate(): boolean {
    if (this.nodes.length === 0) return false;
    if (!this.hasStartNode()) return false;
    if (!this.hasEndNode()) return false;
    if (!this.hasValidConnections()) return false;
    return true;
  }

  addTrigger(trigger: Trigger): void {
    this.triggers.push(trigger);
    this.updatedAt = new Date();
  }
}

export class WorkflowInstance {
  private id: InstanceId;
  private workflow: Workflow;
  private status: InstanceStatus;
  private currentNodeId: NodeId;
  private context: WorkflowContext;
  private variables: Map<string, any>;
  private tasks: WorkflowTask[];
  private history: ExecutionHistory[];
  private startedAt: Date;
  private completedAt?: Date;
  private createdAt: Date;
  private updatedAt: Date;

  async execute(): Promise<void> {
    while (this.canContinue()) {
      const currentNode = this.workflow.getNode(this.currentNodeId);
      await this.executeNode(currentNode);
      this.moveToNextNode();
    }
  }

  private async executeNode(node: WorkflowNode): Promise<void> {
    const executor = this.getNodeExecutor(node.type);
    await executor.execute(node, this.context);
    this.history.push(ExecutionHistory.create(node, ExecutionStatus.COMPLETED));
  }
}
```

### 1.7 Contexto: SaaS (Billing e Assinaturas)

**Responsabilidade**: Gerenciamento de planos, cobrança, faturas, métricas de uso e limites.

**Agregados Principais**:

- **Subscription** (Aggregate Root)
- **Invoice** (Aggregate Root)
- **Payment** (Aggregate Root)
- **Plan** (Aggregate Root)
- **UsageMetric** (Aggregate Root)
- **FeatureLimit** (Aggregate Root)

```typescript
// Domain/SaaS/Entities/Subscription.ts
export class Subscription {
  private id: SubscriptionId;
  private tenant: Tenant;
  private plan: Plan;
  private status: SubscriptionStatus;
  private billingCycle: BillingCycle;
  private startDate: Date;
  private endDate?: Date;
  private trialEndDate?: Date;
  private payments: Payment[];
  private invoices: Invoice[];
  private usageMetrics: UsageMetric[];
  private limits: FeatureLimit[];
  private addons: Addon[];
  private autoRenew: boolean;
  private createdAt: Date;
  private updatedAt: Date;

  upgrade(newPlan: Plan): void {
    const priceDiff = newPlan.price.subtract(this.plan.price);
    this.plan = newPlan;
    this.limits = this.calculateNewLimits(newPlan);
    this.updatedAt = new Date();
    
    this.addEvent(SubscriptionEvents.PLAN_UPGRADED, {
      oldPlan: this.plan.name,
      newPlan: newPlan.name,
      priceDiff: priceDiff.value
    });
  }

  checkLimit(feature: string, usage: number): boolean {
    const limit = this.limits.find(l => l.feature === feature);
    if (!limit) return true;
    return usage <= limit.value;
  }

  consume(feature: string, amount: number): void {
    const metric = this.usageMetrics.find(m => m.feature === feature);
    if (metric) {
      metric.increment(amount);
    } else {
      this.usageMetrics.push(UsageMetric.create(feature, amount));
    }
    this.updatedAt = new Date();
  }
}

export class Invoice {
  private id: InvoiceId;
  private tenant: Tenant;
  private subscription: Subscription;
  private number: string;
  private status: InvoiceStatus;
  private items: InvoiceItem[];
  private subtotal: Money;
  private tax: Money;
  private total: Money;
  private dueDate: Date;
  private paidAt?: Date;
  private paymentMethod?: PaymentMethod;
  private pdfUrl?: string;
  private createdAt: Date;
  private updatedAt: Date;

  pay(payment: Payment): void {
    if (this.total.value !== payment.amount.value) {
      throw new DomainException('Payment amount does not match invoice total');
    }
    this.status = InvoiceStatus.PAID;
    this.paidAt = new Date();
    this.paymentMethod = payment.method;
    this.updatedAt = new Date();
  }
}
```

---

## 2. Estrutura de Diretórios

```
bidflow-platform/
├── apps/
│   ├── api-gateway/                 # API Gateway NestJS
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── filters/
│   │   │   │   └── decorators/
│   │   │   └── modules/
│   │   │       └── proxy/
│   │   └── test/
│   │
│   ├── crm-service/                 # Microsserviço CRM
│   ├── erp-service/                # Microsserviço ERP
│   ├── bidding-service/            # Microsserviço Licitações (Core)
│   ├── workflow-service/           # Microsserviço Workflow
│   ├── saas-service/               # Microsserviço SaaS/Billing
│   │
│   ├── ai-service/                 # Microsserviço Python FastAPI
│   │   ├── src/
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   └── utils/
│   │   └── requirements.txt
│   │
│   └── web-app/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── store/
│       │   └── types/
│       └── public/
│
├── packages/
│   ├── shared/                     # Pacote compartilhado
│   │   ├── types/
│   │   ├── constants/
│   │   ├── utils/
│   │   └── enums/
│   │
│   ├── kernel/                    # Kernel DDD (Event Bus, CQRS)
│   │   ├── src/
│   │   │   ├── events/
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   ├── bus/
│   │   │   ├── exceptions/
│   │   │   └── base/
│   │   └── test/
│   │
│   └── database/                  # Prisma Schema e migrations
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seeders/
│       └── package.json
│
├── infrastructure/
│   ├── docker/                    # Docker Compose
│   ├── kubernetes/                # K8s manifests
│   ├── terraform/                 # IaC
│   └── ci-cd/                     # GitHub Actions
│
└── docs/
    ├── architecture/
    ├── api/
    └── functional/
```

---

## 3. Estrutura de Módulos por Contexto

### 3.1 Estrutura Genérica (aplicável a todos os contextos)

```
src/
├── domain/
│   ├── entities/           # Entidades do domínio
│   │   └── *.entity.ts
│   ├── value-objects/      # Value Objects
│   │   └── *.vo.ts
│   ├── aggregates/         # Aggregate Roots
│   │   └── *.aggregate.ts
│   ├── repositories/       # Interfaces de repositório
│   │   └── *.repository.interface.ts
│   ├── services/           # Domain Services
│   │   └── *.service.ts
│   ├── events/             # Eventos de domínio
│   │   └── *.event.ts
│   ├── errors/             # Erros de domínio
│   │   └── *.error.ts
│   └── types/              # Tipos do domínio
│
├── application/
│   ├── commands/           # CQRS Commands
│   │   ├── handlers/
│   │   └── *.command.ts
│   ├── queries/            # CQRS Queries
│   │   ├── handlers/
│   │   └── *.query.ts
│   ├── dto/                # Data Transfer Objects
│   │   ├── input/
│   │   └── output/
│   ├── ports/              # Portas de aplicação
│   │   └── interfaces/
│   └── services/           # Application Services
│
├── infrastructure/
│   ├── persistence/
│   │   ├── prisma/
│   │   │   ├── repositories/
│   │   │   └── mappers/
│   │   └── repositories/    # Implementações de repositório
│   ├── messaging/
│   │   ├── rabbitmq/
│   │   └── events/
│   ├── cache/
│   │   └── redis/
│   └── external/           # Integrações externas
│
└── presentation/
    ├── controllers/
    ├── guards/
    ├── interceptors/
    ├── filters/
    └── decorators/
```

---

## 4. Arquitetura Event-Driven

### 4.1 Domain Events

```typescript
// Kernel/Events/DomainEvent.ts
export interface DomainEvent {
  eventId: string;
  occurredOn: Date;
  eventType: string;
  aggregateId: string;
  tenantId: TenantId;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
}

// Exemplos de eventos por contexto
export class BiddingCreatedEvent implements DomainEvent {
  eventType = 'BiddingCreated';
  constructor(
    public readonly bidding: Bidding,
    public readonly tenantId: TenantId
  ) {}
}

export class DealWonEvent implements DomainEvent {
  eventType = 'DealWon';
  constructor(
    public readonly deal: Deal,
    public readonly company: Company,
    public readonly value: Money
  ) {}
}

export class SubscriptionUpgradedEvent implements DomainEvent {
  eventType = 'SubscriptionUpgraded';
  constructor(
    public readonly tenant: Tenant,
    public readonly oldPlan: Plan,
    public readonly newPlan: Plan
  ) {}
}
```

### 4.2 Event Bus (RabbitMQ)

```typescript
// Infrastructure/Messaging/EventBus.ts
@Injectable()
export class EventBus implements IEventBus {
  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly logger: Logger
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    const exchange = this.getExchangeForEvent(event);
    const routingKey = event.eventType;
    
    await this.rabbitMQ.publish(exchange, routingKey, {
      eventId: event.eventId,
      occurredOn: event.OccurredOn,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      tenantId: event.tenantId.value,
      payload: event.payload,
      metadata: event.metadata
    });
    
    this.logger.log(`Event ${event.eventType} published`, event.eventId);
  }

  async subscribe(
    eventType: string,
    handler: EventHandler
  ): Promise<void> {
    const queue = `${eventType}.handler`;
    await this.rabbitMQ.subscribe(queue, async (message) => {
      const event = this.deserializeEvent(message);
      await handler.handle(event);
    });
  }

  private getExchangeForEvent(event: DomainEvent): string {
    const exchangeMap: Record<string, string> = {
      'Bidding': 'bidding.events',
      'Deal': 'crm.events',
      'Project': 'erp.events',
      'Workflow': 'workflow.events',
      'Subscription': 'saas.events'
    };
    return exchangeMap[event.eventType] || 'general.events';
  }
}
```

### 4.3 Event Handlers

```typescript
// Application/Events/Handlers/BiddingCreatedHandler.ts
@Injectable()
export class BiddingCreatedHandler implements EventHandler<BiddingCreatedEvent> {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly aiService: AIService,
    private readonly notificationService: NotificationService
  ) {}

  async handle(event: BiddingCreatedEvent): Promise<void> {
    // 1. Criar workflow de análise
    await this.workflowService.createWorkflowInstance({
      workflowId: 'bidding-analysis-workflow',
      context: { biddingId: event.bidding.id.value }
    });

    // 2. Trigger análise de IA
    await this.aiService.analyzeBidding(event.bidding);

    // 3. Notificar stakeholders
    await this.notificationService.notifyBiddingCreated(event.bidding);
  }
}
```

---

## 5. Multi-Tenant Architecture

### 5.1 Tenant Isolation Strategy

```typescript
// Database Schema - Tenant Isolation via Row-Level Security
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [pgrowsecurite]
}

model Tenant {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  status    TenantStatus
  config    Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]
  contacts  Contact[]
  companies Company[]
  biddings  Bidding[]
  projects  Project[]
  // ... outros modelos
}

model Contact {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  email     String
  name      String
  // ... outros campos

  @@index([tenantId])
  @@schema("tenant_isolation") // Extension RLS
}
```

### 5.2 Tenant Context Provider

```typescript
// Common/Decorators/Tenant.decorator.ts
export const TenantContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return {
      tenantId: request.tenant.id,
      tenantSlug: request.tenant.slug,
      userId: request.user.id,
      role: request.user.role
    };
  }
);

// Usage in controller
@Controller('biddings')
export class BiddingController {
  @Post()
  async create(
    @Body() dto: CreateBiddingDto,
    @TenantContext() tenant: TenantContext
  ): Promise<BiddingResponse> {
    return this.biddingService.create(dto, tenant.tenantId);
  }
}
```

---

## 6. CQRS Implementation

### 6.1 Command Handler

```typescript
// Application/Commands/Bidding/CreateBiddingCommand.ts
export class CreateBiddingCommand {
  constructor(
    public readonly dto: CreateBiddingDto,
    public readonly tenantId: TenantId
  ) {}
}

// Application/Commands/Bidding/CreateBiddingHandler.ts
@CommandHandler(CreateBiddingCommand)
export class CreateBiddingHandler implements ICommandHandler<CreateBiddingCommand> {
  constructor(
    private readonly biddingRepository: IBiddingRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateBiddingCommand): Promise<Bidding> {
    const bidding = Bidding.create({
      ...command.dto,
      tenantId: command.tenantId
    });
    
    await this.biddingRepository.save(bidding);
    
    await this.eventBus.publish(new BiddingCreatedEvent(bidding, command.tenantId));
    
    return bidding;
  }
}
```

### 6.2 Query Handler

```typescript
// Application/Queries/Bidding/GetBiddingByIdQuery.ts
export class GetBiddingByIdQuery {
  constructor(
    public readonly id: BiddingId,
    public readonly tenantId: TenantId
  ) {}
}

@QueryHandler(GetBiddingByIdQuery)
export class GetBiddingByIdHandler implements IQueryHandler<GetBiddingByIdQuery> {
  constructor(private readonly biddingRepository: IBiddingRepository) {}

  async execute(query: GetBiddingByIdQuery): Promise<Bidding | null> {
    return this.biddingRepository.findById(query.id, query.tenantId);
  }
}
```

---

## 7. Mensageria e Integrações

### 7.1 RabbitMQ Configuration

```typescript
// Infrastructure/Messaging/RabbitMQModule.ts
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'RABBITMQ_OPTIONS',
      useFactory: (config: ConfigService): RabbitMQOptions => ({
        urls: [config.get('RABBITMQ_URL')],
        queue: 'bidflow',
        queueOptions: {
          durable: true
        },
        connectionOptions: {
          heartbeat: 10
        },
        exchanges: [
          { name: 'bidding.events', type: 'topic', options: { durable: true } },
          { name: 'crm.events', type: 'topic', options: { durable: true } },
          { name: 'erp.events', type: 'topic', options: { durable: true } },
          { name: 'workflow.events', type: 'topic', options: { durable: true } },
          { name: 'saas.events', type: 'topic', options: { durable: true } },
          { name: 'ai.events', type: 'topic', options: { durable: true } }
        ]
      })
    },
    RabbitMQService
  ],
  exports: [RabbitMQService]
})
export class RabbitMQModule {}
```

### 7.2 Message Patterns

```typescript
// Common/Messages/Patterns.ts
export const MessagePatterns = {
  // Bidding
  BIDDING_CREATE: 'bidding.create',
  BIDDING_UPDATE: 'bidding.update',
  BIDDING_DELETE: 'bidding.delete',
  BIDDING_ANALYZE: 'bidding.analyze',
  
  // CRM
  COMPANY_CREATE: 'company.create',
  DEAL_UPDATE_STAGE: 'deal.update.stage',
  CONTACT_CREATE: 'contact.create',
  
  // ERP
  PROJECT_CREATE: 'project.create',
  TRANSACTION_CREATE: 'transaction.create',
  
  // AI
  AI_ANALYZE_BIDDING: 'ai.analyze.bidding',
  AI_PREDICT_SUCCESS: 'ai.predict.success',
  AI_RECOMMEND_NEXT_BEST: 'ai.recommend.nextbest',
  
  // Workflow
  WORKFLOW_TRIGGER: 'workflow.trigger',
  WORKFLOW_COMPLETE: 'workflow.complete',
  
  // SaaS
  SUBSCRIPTION_UPDATE: 'subscription.update',
  INVOICE_CREATE: 'invoice.create'
};

// Headers de mensagem para rastreamento distribuído
export interface MessageHeaders {
  correlationId: string;
  causationId?: string;
  timestamp: number;
  tenantId: string;
  userId?: string;
  traceId: string;
}
```

---

## 8. Cache Strategy (Redis)

```typescript
// Infrastructure/Cache/RedisCache.service.ts
@Injectable()
export class RedisCacheService {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    await this.invalidatePattern(`tenant:${tenantId}:*`);
  }
}

// Cache Keys
export const CacheKeys = {
  bidding: (id: string, tenantId: string) => `tenant:${tenantId}:bidding:${id}`,
  biddingList: (tenantId: string, page: number) => `tenant:${tenantId}:biddings:list:${page}`,
  company: (id: string, tenantId: string) => `tenant:${tenantId}:company:${id}`,
  userSession: (userId: string) => `session:${userId}`,
  aiAnalysis: (biddingId: string) => `ai:analysis:${biddingId}`
};
```

---

## 9. Resumo dos Agregados Roots

| Contexto | Agregado Root | Responsabilidade Principal |
|----------|---------------|----------------------------|
| **Tenant** | Tenant | Identificação e configuração do tenant |
| | TenantSubscription | Gerenciamento de plano e limites |
| **CRM** | Company | Dados da empresa cliente |
| | Deal | Oportunidade comercial |
| | Contact | Contato profissional |
| | SalesPipeline | Pipeline de vendas |
| **ERP** | Project | Projeto interno |
| | FinancialTransaction | Transação financeira |
| | Invoice | Fatura/recibo |
| | Budget | Orçamento |
| **Licitações** | Bidding | Processo licitatório |
| | BiddingProposal | Proposta em licitação |
| | BiddingDocument | Documento da licitação |
| **IA** | AIAnalysis | Resultado de análise |
| | Prediction | Predição de resultado |
| **Workflow** | Workflow | Definição de processo |
| | WorkflowInstance | Instância em execução |
| **SaaS** | Subscription | Assinatura do tenant |
| | Invoice | Fatura de cobrança |
| | Plan | Plano de assinatura |

---

## 10. Padrões de Arquitetura Utilizados

1. **Domain-Driven Design**: bounded contexts, aggregates, entities, value objects
2. **CQRS**: Separação de Commands e Queries
3. **Event-Driven Architecture**: Domain events, Event bus, Event sourcing
4. **Multi-Tenant**: Row-level security, tenant context, data isolation
5. **Micro-services**: Separação por bounded context
6. **Repository Pattern**: Abstrai acesso a dados
7. **Dependency Inversion**: Ports e adapters
8. **Unit of Work**: Transações consistentes
9. **Saga Pattern**: Transações distribuídas
10. **Circuit Breaker**: Resiliência em chamadas externas