# BidFlow Platform - Exemplos de Implementação

## 1. Entidade Base e Aggregate Root

```typescript
// packages/kernel/src/base/aggregate.ts
export abstract class AggregateRoot<T> {
  protected readonly _id: T;
  private _domainEvents: DomainEvent[] = [];

  get id(): T {
    return this._id;
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  abstract toPersistence(): unknown;
}

// Domain/Tenant/Entities/Tenant.ts
export class Tenant extends AggregateRoot<TenantId> {
  private _name: string;
  private _slug: string;
  private _status: TenantStatus;
  private _config: TenantConfiguration;
  private _subscription: TenantSubscription;

  private constructor(
    id: TenantId,
    name: string,
    slug: string,
    config: TenantConfiguration,
    subscription: TenantSubscription
  ) {
    super(id);
    this._name = name;
    this._slug = slug;
    this._status = TenantStatus.PENDING;
    this._config = config;
    this._subscription = subscription;
  }

  static create(props: CreateTenantProps): Tenant {
    const id = new TenantId(Uuid.generate());
    const slug = props.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    const tenant = new Tenant(
      id,
      props.name,
      slug,
      props.config || new TenantConfiguration(),
      new TenantSubscription({
        plan: SubscriptionPlan.STARTER,
        billingCycle: BillingCycle.MONTHLY,
        startDate: new Date()
      })
    );

    tenant.addDomainEvent(new TenantCreatedEvent(tenant));
    return tenant;
  }

  activate(): void {
    if (this._status === TenantStatus.SUSPENDED) {
      throw new DomainException('Cannot activate a suspended tenant');
    }
    this._status = TenantStatus.ACTIVE;
    this.addDomainEvent(new TenantActivatedEvent(this));
  }

  suspend(): void {
    this._status = TenantStatus.SUSPENDED;
    this.addDomainEvent(new TenantSuspendedEvent(this));
  }

  upgradePlan(newPlan: SubscriptionPlan): void {
    this._subscription.upgrade(newPlan);
    this.addDomainEvent(new PlanUpgradedEvent(this, this._subscription));
  }

  updateConfig(config: Partial<TenantConfiguration>): void {
    this._config = this._config.merge(config);
    this.addDomainEvent(new TenantConfigUpdatedEvent(this));
  }

  toPersistence(): TenantPersistence {
    return {
      id: this._id.value,
      name: this._name,
      slug: this._slug,
      status: this._status,
      config: this._config.toJSON(),
      subscription: this._subscription.toPersistence()
    };
  }
}
```

---

## 2. Value Objects

```typescript
// Domain/Shared/ValueObjects/Money.ts
export class Money {
  private readonly _value: number;
  private readonly _currency: Currency;

  private constructor(value: number, currency: Currency) {
    this._value = Math.round(value * 100) / 100;
    this._currency = currency;
  }

  static create(value: number, currency: Currency = Currency.BRL): Money {
    if (value < 0) {
      throw new DomainException('Money value cannot be negative');
    }
    return new Money(value, currency);
  }

  static zero(currency: Currency = Currency.BRL): Money {
    return new Money(0, currency);
  }

  get value(): number {
    return this._value;
  }

  get currency(): Currency {
    return this._currency;
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._value + other._value, this._currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this._value - other._value;
    if (result < 0) {
      throw new DomainException('Money subtraction would result in negative value');
    }
    return new Money(result, this._currency);
  }

  multiply(factor: number): Money {
    return new Money(this._value * factor, this._currency);
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._value > other._value;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._value < other._value;
  }

  equals(other: Money): boolean {
    return this._value === other._value && this._currency === other._currency;
  }

  format(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this._currency
    }).format(this._value);
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new DomainException('Cannot operate on different currencies');
    }
  }
}

// Domain/Shared/ValueObjects/CNPJ.ts
export class CNPJ {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.replace(/\D/g, '');
  }

  static create(value: string): CNPJ {
    const cnpj = new CNPJ(value);
    if (!cnpj.isValid()) {
      throw new DomainException('Invalid CNPJ');
    }
    return cnpj;
  }

  private isValid(): boolean {
    if (this._value.length !== 14) return false;
    if (/^(\d)\1+$/.test(this._value)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    let multiplier = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(this._value[i]) * multiplier;
      multiplier = multiplier === 2 ? 9 : multiplier - 1;
    }
    const digit1 = (sum % 11) < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(this._value[12]) !== digit1) return false;

    sum = 0;
    multiplier = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(this._value[i]) * multiplier;
      multiplier = multiplier === 2 ? 9 : multiplier - 1;
    }
    const digit2 = (sum % 11) < 2 ? 0 : 11 - (sum % 11);
    
    return parseInt(this._value[13]) === digit2;
  }

  get value(): string {
    return this._value;
  }

  format(): string {
    return this._value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}
```

---

## 3. Command Handler com CQRS

```typescript
// Application/Commands/Bidding/CreateBiddingHandler.ts
@CommandHandler(CreateBiddingCommand)
export class CreateBiddingHandler implements ICommandHandler<CreateBiddingCommand> {
  constructor(
    @Inject('IBiddingRepository')
    private readonly biddingRepository: IBiddingRepository,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
    private readonly logger: Logger
  ) {}

  async execute(command: CreateBiddingCommand): Promise<Bidding> {
    this.logger.log(`Creating bidding: ${command.dto.title}`, CreateBiddingHandler.name);

    // 1. Criar aggregate
    const bidding = Bidding.create({
      tenantId: command.tenantId,
      title: command.dto.title,
      description: command.dto.description,
      type: command.dto.type,
      modality: command.dto.modality,
      processNumber: command.dto.processNumber,
      publicationDate: command.dto.publicationDate,
      openingDate: command.dto.openingDate,
      closingDate: command.dto.closingDate,
      estimatedValue: Money.create(command.dto.estimatedValue, Currency.from(command.dto.currency)),
      contractingEntity: command.dto.contractingEntity,
      source: command.dto.source,
      location: command.dto.location ? Address.create(command.dto.location) : undefined
    });

    // 2. Validar e salvar
    await this.biddingRepository.save(bidding);
    this.logger.log(`Bidding created with ID: ${bidding.id.value}`);

    // 3. Publicar eventos de domínio
    const events = bidding.domainEvents;
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    bidding.clearDomainEvents();

    // 4. Notificar stakeholders
    await this.notificationService.notifyBiddingCreated(bidding, command.tenantId);

    return bidding;
  }
}
```

---

## 4. Repository Interface e Implementação

```typescript
// Domain/Bidding/Repositories/IBiddingRepository.ts
export interface IBiddingRepository {
  save(bidding: Bidding): Promise<void>;
  update(bidding: Bidding): Promise<void>;
  delete(id: BiddingId, tenantId: TenantId): Promise<void>;
  findById(id: BiddingId, tenantId: TenantId): Promise<Bidding | null>;
  findByProcessNumber(processNumber: string, tenantId: TenantId): Promise<Bidding | null>;
  findAll(tenantId: TenantId, filters: BiddingFilters, pagination: Pagination): Promise<Bidding[]>;
  findActive(tenantId: TenantId): Promise<Bidding[]>;
  count(tenantId: TenantId, filters: BiddingFilters): Promise<number>;
}

// Infrastructure/Persistence/PrismaBiddingRepository.ts
@Injectable()
export class PrismaBiddingRepository implements IBiddingRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  async save(bidding: Bidding): Promise<void> {
    const data = this.mapper.toPersistence(bidding);
    await this.prisma.bidding.create({ data });
    this.logger.log(`Bidding saved: ${bidding.id.value}`);
  }

  async update(bidding: Bidding): Promise<void> {
    const data = this.mapper.toPersistence(bidding);
    await this.prisma.bidding.update({
      where: { id: bidding.id.value },
      data
    });
    this.logger.log(`Bidding updated: ${bidding.id.value}`);
  }

  async findById(id: BiddingId, tenantId: TenantId): Promise<Bidding | null> {
    const persistence = await this.prisma.bidding.findFirst({
      where: { id: id.value, tenantId: tenantId.value },
      include: {
        documents: true,
        proposals: true,
        questions: true
      }
    });
    return persistence ? this.mapper.toDomain(persistence) : null;
  }

  async findAll(tenantId: TenantId, filters: BiddingFilters, pagination: Pagination): Promise<Bidding[]> {
    const where = this.buildWhereClause(tenantId, filters);
    const records = await this.prisma.bidding.findMany({
      where,
      skip: pagination.offset,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' }
    });
    return records.map(this.mapper.toDomain);
  }

  private buildWhereClause(tenantId: TenantId, filters: BiddingFilters): Prisma.BiddingWhereInput {
    return {
      tenantId: tenantId.value,
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.modality && { modality: filters.modality }),
      ...(filters.source && { source: filters.source }),
      ...(filters.dateFrom && {
        closingDate: { gte: filters.dateFrom }
      }),
      ...(filters.dateTo && {
        closingDate: { lte: filters.dateTo }
      }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { processNumber: { contains: filters.search, mode: 'insensitive' } }
        ]
      })
    };
  }
}
```

---

## 5. Event Bus e handlers

```typescript
// Infrastructure/Messaging/EventBus.ts
@Injectable()
export class EventBus implements IEventBus {
  private handlers: Map<string, IEventHandler[]> = new Map();

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly logger: Logger
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    const exchange = this.getExchangeForEvent(event);
    const routingKey = event.eventType;

    const message = {
      eventId: event.eventId,
      occurredOn: event.occurredOn.toISOString(),
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      tenantId: event.tenantId.value,
      payload: event.payload,
      metadata: event.metadata
    };

    await this.rabbitMQ.publish(exchange, routingKey, message);
    this.logger.log(`Published event: ${event.eventType}`, event.eventId);
  }

  async subscribe(eventType: string, handler: IEventHandler): Promise<void> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async consumeEvents(): Promise<void> {
    const exchanges = ['bidding.events', 'crm.events', 'erp.events', 'workflow.events', 'saas.events'];
    
    for (const exchange of exchanges) {
      await this.rabbitMQ.consume(exchange, async (message) => {
        const eventType = message.content.eventType;
        const handlers = this.handlers.get(eventType) || [];
        
        for (const handler of handlers) {
          try {
            await handler.handle(message.content);
          } catch (error) {
            this.logger.error(`Error handling event ${eventType}`, error);
          }
        }
      });
    }
  }

  private getExchangeForEvent(event: DomainEvent): string {
    const map: Record<string, string> = {
      BiddingCreated: 'bidding.events',
      BiddingClosed: 'bidding.events',
      DealWon: 'crm.events',
      DealLost: 'crm.events',
      ProjectCreated: 'erp.events',
      ProjectCompleted: 'erp.events',
      SubscriptionUpgraded: 'saas.events',
      WorkflowTriggered: 'workflow.events'
    };
    return map[event.eventType] || 'general.events';
  }
}

// Application/EventHandlers/BiddingClosedHandler.ts
@Injectable()
export class BiddingClosedHandler implements IEventHandler<BiddingClosedEvent> {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly aiService: AIService,
    private readonly emailService: EmailService
  ) {}

  async handle(event: BiddingClosedEvent): Promise<void> {
    // 1. Notificar participantes
    const proposals = await this.getProposalsForBidding(event.biddingId);
    for (const proposal of proposals) {
      await this.emailService.send({
        to: proposal.bidderEmail,
        subject: 'Licitação Encerrada',
        template: 'bidding-closed',
        data: { bidding: event.bidding, proposal }
      });
    }

    // 2. Trigger workflow de análise de resultados
    await this.workflowService.trigger('bidding-results-analysis', {
      biddingId: event.biddingId,
      proposalCount: proposals.length,
      winnerId: event.winnerId
    });

    // 3. Solicitar análise de IA dos resultados
    await this.aiService.analyzeResults(event.biddingId);
  }
}
```

---

## 6. Cache com Redis

```typescript
// Infrastructure/Cache/RedisCacheService.ts
@Injectable()
export class RedisCacheService {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Cache get error for key: ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Cache set error for key: ${key}`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error for key: ${key}`, error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Cache invalidate error for pattern: ${pattern}`, error);
    }
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    await this.invalidatePattern(`tenant:${tenantId}:*`);
  }
}

// Usage in Repository
@Injectable()
export class CachedBiddingRepository implements IBiddingRepository {
  constructor(
    private readonly repository: PrismaBiddingRepository,
    private readonly cache: RedisCacheService
  ) {}

  async findById(id: BiddingId, tenantId: TenantId): Promise<Bidding | null> {
    const cacheKey = `tenant:${tenantId.value}:bidding:${id.value}`;
    
    const cached = await this.cache.get<Bidding>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.repository.findById(id, tenantId);
    if (result) {
      await this.cache.set(cacheKey, result, 1800); // 30 min
    }
    return result;
  }

  async update(bidding: Bidding): Promise<void> {
    await this.repository.update(bidding);
    await this.cache.delete(`tenant:${bidding.tenantId.value}:bidding:${bidding.id.value}`);
  }
}
```

---

## 7. Multi-Tenant Guard

```typescript
// Presentation/Guards/TenantGuard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantService: TenantService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantSlug = request.headers['x-tenant-slug'] || request.params.tenantSlug;

    if (!tenantSlug) {
      throw new UnauthorizedException('Tenant identification required');
    }

    const tenant = await this.tenantService.findBySlug(tenantSlug);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new ForbiddenException('Tenant is suspended');
    }

    request.tenant = tenant;
    return true;
  }
}

// Usage in Controller
@Controller('biddings')
@UseGuards(TenantGuard, JwtAuthGuard)
export class BiddingController {
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req: AuthRequest
  ): Promise<BiddingResponse> {
    return this.biddingService.findById(id, req.tenant.id);
  }
}
```

---

## 8. Health Check e Monitoramento

```typescript
// Health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: Redis,
    private readonly rabbitMQ: RabbitMQService
  ) {}

  @Get()
  async check(): Promise<HealthResponse> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkRabbitMQ()
    ]);

    const results: HealthCheck[] = checks.map((check, index) => ({
      service: ['Database', 'Redis', 'RabbitMQ'][index],
      status: check.status === 'fulfilled' ? 'UP' : 'DOWN',
      latency: check.status === 'fulfilled' ? check.value : null,
      error: check.status === 'rejected' ? check.reason : null
    }));

    const allHealthy = results.every(r => r.status === 'UP');
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      checks: results
    };
  }

  private async checkDatabase(): Promise<number> {
    const start = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    return Date.now() - start;
  }

  private async checkRedis(): Promise<number> {
    const start = Date.now();
    await this.redis.ping();
    return Date.now() - start;
  }

  private async checkRabbitMQ(): Promise<number> {
    const start = Date.now();
    await this.rabbitMQ.checkConnection();
    return Date.now() - start;
  }
}
```