# Coding Standards — BidFlow Platform

> **Propósito:** Este documento define as convenções de código obrigatórias para toda a base TypeScript/NestJS do BidFlow Platform. Todo código escrito deve seguir estas regras sem exceção. Violações devem ser rejeitadas em code review.

---

## Sumário

1. [Naming Conventions](#1-naming-conventions)
2. [DTO Patterns](#2-dto-patterns)
3. [Repository Patterns](#3-repository-patterns)
4. [Module Patterns](#4-module-patterns)
5. [Event Naming](#5-event-naming)
6. [Validation](#6-validation)
7. [Logs](#7-logs)
8. [Observability](#8-observability)
9. [Error Handling](#9-error-handling)
10. [Tenant Isolation](#10-tenant-isolation)
11. [Project Structure](#11-project-structure)
12. [General TypeScript Rules](#12-general-typescript-rules)

---

## 1. Naming Conventions

### 1.1 General

| Categoria          | Convenção         | Exemplo                          |
|--------------------|-------------------|----------------------------------|
| Classes            | PascalCase        | `AuctionsService`                |
| Interfaces         | PascalCase        | `AuctionRepository`              |
| Tipos              | PascalCase        | `AuctionStatus`                  |
| Enums              | PascalCase        | `UserRole`                       |
| Enum members       | UPPER_SNAKE_CASE  | `UserRole.ADMIN`                 |
| Funções/Métodos    | camelCase         | `findAll()`                      |
| Variáveis          | camelCase         | `currentPrice`                   |
| Constantes         | camelCase         | `defaultPageSize`                |
| Arquivos           | kebab-case        | `create-auction.dto.ts`          |
| Pastas             | kebab-case        | `value-objects/`                 |
| Parâmetros         | camelCase         | `auctionId`                      |
| Booleanos          | prefix `is/has/can` | `isActive`, `hasBids`          |

### 1.2 Classes & Interfaces

```typescript
// Entity — sufixo: Entity
export class AuctionEntity { ... }

// Value Object — sufixo: nenhum, imutável
export class Money { ... }

// DTO — prefixo: Create/Update/Filter + sufixo: Dto
export class CreateAuctionDto { ... }
export class UpdateAuctionDto { ... }
export class FilterAuctionDto { ... }

// Repository interface — sufixo: Repository
export interface AuctionRepository { ... }

// Repository implementation — prefixo: Prisma + sufixo: Repository
export class PrismaAuctionRepository implements AuctionRepository { ... }

// Service — sufixo: Service
export class AuctionsService { ... }

// Controller — sufixo: Controller
export class AuctionsController { ... }

// Module — sufixo: Module
export class AuctionsModule { ... }

// Event — sufixo: Event (ou no passado)
export class AuctionCreatedEvent { ... }
export class BidPlacedEvent { ... }

// Handler — sufixo: Handler
export class CreateAuctionHandler { ... }
export class BidPlacedHandler { ... }

// Guard — sufixo: Guard
export class AuthGuard { ... }
export class TenantGuard { ... }

// Interceptor — sufixo: Interceptor
export class LoggingInterceptor { ... }

// Filter — sufixo: Filter
export class DomainExceptionFilter { ... }

// Pipe — sufixo: Pipe
export class ParseUUIDPipe { ... }

// Decorator — sufixo: Decorator
export const CurrentUser = createParamDecorator(...);
```

### 1.3 Diretórios

```
src/
├── auctions/
│   ├── application/           # Casos de uso, handlers
│   ├── domain/                # Entidades, VOs, interfaces
│   │   └── value-objects/     # Value objects
│   ├── infrastructure/        # Implementações concretas
│   │   └── controllers/       # Controllers REST
│   └── dto/                   # DTOs de entrada/saída
├── common/                    # Compartilhado entre contextos
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── pipes/
└── prisma/                    # Prisma module
```

### 1.4 Banco de Dados (Prisma)

| Convention          | Exemplo                   |
|---------------------|---------------------------|
| Table names         | `snake_case` + plural     |
| Column names        | `snake_case`              |
| Primary key         | `id` (UUID)               |
| Foreign key         | `user_id`                 |
| Created at          | `created_at`              |
| Updated at          | `updated_at`              |
| Tenant column       | `tenant_id` + `@@index`   |
| Enum names          | `PascalCase`              |
| Enum values         | `UPPER_SNAKE_CASE`        |
| Many-to-many table  | `product_category`        |

```prisma
model Auction {
  id           String        @id @default(uuid()) @map("id")
  tenantId     String        @map("tenant_id")
  title        String        @map("title")
  startPrice   Decimal       @map("start_price") @db.Decimal(12, 2)
  status       AuctionStatus @default(PENDING)
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  @@map("auctions")
  @@index([tenantId, id])
  @@index([tenantId, status])
}
```

### 1.5 Rotas REST

| Verbo   | URL Pattern                     | Controller method | Service method |
|---------|---------------------------------|-------------------|----------------|
| GET     | `/auctions`                     | `findAll()`       | `findAll()`    |
| GET     | `/auctions/:id`                 | `findOne()`       | `findOne()`    |
| POST    | `/auctions`                     | `create()`        | `create()`     |
| PATCH   | `/auctions/:id`                 | `update()`        | `update()`     |
| DELETE  | `/auctions/:id`                 | `remove()`        | `remove()`     |
| GET     | `/auctions/:id/bids`            | `findBids()`      | `findBids()`   |
| POST    | `/auctions/:id/publish`         | `publish()`       | `publish()`    |
| POST    | `/auctions/:id/cancel`          | `cancel()`        | `cancel()`     |

---

## 2. DTO Patterns

### 2.1 Regras Obrigatórias

- **Todo** corpo de requisição deve ser um DTO com validação (`class-validator`).
- **Toda** resposta deve ser tipada (interface ou classe), de preferência via `@nestjs/swagger`.
- DTOs de criação usam prefixo `Create`; DTOs de atualização usam `Update`.
- `UpdateDto` **sempre** estende `PartialType(CreateDto)`.
- DTOs devem estar no diretório `dto/` do módulo.
- DTOs **nunca** devem conter lógica de negócio — apenas validação de formato.

### 2.2 Exemplo Padrão

```typescript
// dto/create-auction.dto.ts
import { IsString, IsNumber, IsUUID, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class CreateAuctionDto {
  @ApiProperty({ example: 'Leilão de Equipamentos' })
  @IsString()
  readonly title: string;

  @ApiProperty({ example: 'Descrição detalhada do leilão' })
  @IsString()
  readonly description: string;

  @ApiProperty({ example: 50000.00 })
  @IsNumber()
  @Min(0.01)
  readonly startPrice: number;

  @ApiProperty({ example: '2026-06-01T10:00:00Z' })
  @IsDateString()
  readonly startDate: string;

  @ApiProperty({ example: '2026-06-30T18:00:00Z' })
  @IsDateString()
  readonly endDate: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4')
  readonly userId: string;
}

// dto/update-auction.dto.ts
export class UpdateAuctionDto extends PartialType(CreateAuctionDto) {}
```

### 2.3 DTO de Resposta (Response)

```typescript
// dto/auction-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AuctionResponseDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly title: string;

  @ApiProperty()
  readonly startPrice: number;

  @ApiProperty({ enum: AuctionStatus })
  readonly status: AuctionStatus;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly tenantId: string;
}
```

### 2.4 Filtros e Paginação

```typescript
// dto/filter-auction.dto.ts
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FilterAuctionDto {
  @ApiPropertyOptional({ enum: AuctionStatus })
  @IsOptional()
  @IsEnum(AuctionStatus)
  readonly status?: AuctionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly limit?: number = 20;
}
```

### 2.5 Decorators obrigatórios em DTOs

| Decorator              | Onde usar                    |
|------------------------|------------------------------|
| `@ApiProperty()`       | Todo campo público           |
| `@IsOptional()`        | Campos opcionais             |
| `@IsString()`          | Strings                      |
| `@IsNumber()`          | Números                      |
| `@IsUUID('4')`         | UUIDs                        |
| `@IsDateString()`      | Datas ISO 8601               |
| `@IsEmail()`           | Emails                       |
| `@IsEnum()`            | Enums                        |
| `@IsBoolean()`         | Booleanos                    |
| `@Min()/@Max()`        | Limites numéricos            |
| `@Length()`            | Limites de string            |
| `@Type(() => Number)`  | Transform query params       |

---

## 3. Repository Patterns

### 3.1 Port (Interface) — no domínio

```typescript
// domain/auction.repository.ts
import { AuctionEntity } from './auction.entity';

export interface AuctionRepository {
  save(auction: AuctionEntity): Promise<void>;
  findById(id: string): Promise<AuctionEntity | null>;
  findMany(filter: AuctionFilter): Promise<AuctionEntity[]>;
  count(filter: AuctionFilter): Promise<number>;
  delete(id: string): Promise<void>;
}
```

### 3.2 Adapter (Implementação) — na infraestrutura

```typescript
// infrastructure/prisma-auction.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuctionRepository } from '../domain/auction.repository';
import { AuctionEntity } from '../domain/auction.entity';
import { AuctionFilter } from '../domain/auction-filter';

@Injectable()
export class PrismaAuctionRepository implements AuctionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(auction: AuctionEntity): Promise<void> {
    const data = auction.toPersistence(); // Entity → Prisma data
    await this.prisma.auction.upsert({
      where: { id: auction.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string): Promise<AuctionEntity | null> {
    const record = await this.prisma.auction.findUnique({
      where: { id },
      include: { bids: true },
    });
    return record ? AuctionEntity.fromPersistence(record) : null;
  }

  async findMany(filter: AuctionFilter): Promise<AuctionEntity[]> {
    const records = await this.prisma.auction.findMany({
      where: this.buildWhere(filter),
      orderBy: { createdAt: 'desc' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    });
    return records.map(AuctionEntity.fromPersistence);
  }

  async count(filter: AuctionFilter): Promise<number> {
    return this.prisma.auction.count({
      where: this.buildWhere(filter),
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.auction.delete({ where: { id } });
  }

  private buildWhere(filter: AuctionFilter): PrismaAuctionWhereInput {
    const where: PrismaAuctionWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.search) where.title = { contains: filter.search, mode: 'insensitive' };
    return where;
  }
}
```

### 3.3 Regras de Repositório

| Regra                                                | Exceção                     |
|------------------------------------------------------|----------------------------|
| Repositório retorna **entidades de domínio**         | Consultas de projeção (CQRS) |
| Repositório nunca expõe `PrismaService`              | Nenhuma                    |
| Repositério nunca faz validação de negócio           | Nenhuma                    |
| `save()` faz upsert (create ou update)               | Objetos imutáveis          |
| `delete()` é lógico (soft delete) em aggregates críticos | Entidades descartáveis   |
| Repository é injetado via DI com token da interface  | Nenhuma                    |

### 3.4 Injeção de Dependência

```typescript
// auctions.module.ts
import { Module } from '@nestjs/common';
import { AuctionRepository } from './domain/auction.repository';
import { PrismaAuctionRepository } from './infrastructure/prisma-auction.repository';

@Module({
  providers: [
    {
      provide: AuctionRepository,     // Token = interface
      useClass: PrismaAuctionRepository,
    },
    AuctionsService,
  ],
  exports: [AuctionsService],
})
export class AuctionsModule {}
```

---

## 4. Module Patterns

### 4.1 Estrutura Padrão de um Módulo

```typescript
// auctions/auctions.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../prisma/prisma.module';
import { AuctionsController } from './infrastructure/controllers/auctions.controller';
import { AuctionRepository } from './domain/auction.repository';
import { PrismaAuctionRepository } from './infrastructure/prisma-auction.repository';
import { CreateAuctionHandler } from './application/commands/create-auction.handler';
import { GetAuctionHandler } from './application/queries/get-auction.handler';
import { AuctionClosedHandler } from './application/events/auction-closed.handler';

const commands = [CreateAuctionHandler];
const queries = [GetAuctionHandler];
const events = [AuctionClosedHandler];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [AuctionsController],
  providers: [
    ...commands,
    ...queries,
    ...events,
    {
      provide: AuctionRepository,
      useClass: PrismaAuctionRepository,
    },
  ],
  exports: [],
})
export class AuctionsModule {}
```

### 4.2 Regras de Módulo

- Cada bounded context é um módulo NestJS.
- Cada módulo reside em seu próprio diretório em `src/<contexto>/`.
- Módulos **não importam** outros módulos de domínio diretamente — apenas módulos de infraestrutura (`PrismaModule`, `RabbitMQModule`).
- A comunicação entre contextos ocorre exclusivamente via eventos (RabbitMQ) ou ACL.
- `PrismaModule` é `@Global()`: não precisa ser importado em cada módulo.
- `CqrsModule` deve ser importado em módulos que usam CommandBus/QueryBus.

### 4.3 Registro de Providers

```typescript
// Sempre agrupar por tipo
const repositories = [
  { provide: AuctionRepository, useClass: PrismaAuctionRepository },
  { provide: BidRepository, useClass: PrismaBidRepository },
];

const commandHandlers = [
  CreateAuctionHandler,
  PlaceBidHandler,
  CancelAuctionHandler,
];

const queryHandlers = [
  GetAuctionHandler,
  ListAuctionsHandler,
];

const eventHandlers = [
  AuctionClosedHandler,
  BidPlacedHandler,
];

@Module({
  providers: [
    ...repositories,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    AuctionsService,
  ],
})
export class AuctionsModule {}
```

### 4.4 Módulo Global vs Feature

| Tipo              | Decorator   | Exemplos                           |
|-------------------|-------------|------------------------------------|
| Infraestrutura    | `@Global()` | `PrismaModule`, `RabbitMQModule`   |
| Domínio (feature) | Normal      | `AuctionsModule`, `UsersModule`    |

---

## 5. Event Naming

### 5.1 Domain Events (eventos de negócio)

```
{Entidade}{Ação no passado}Event
```

| Evento                     | Descrição                      | Contexto      |
|----------------------------|--------------------------------|---------------|
| `AuctionCreatedEvent`      | Leilão foi criado              | Licitações    |
| `AuctionPublishedEvent`    | Leilão foi publicado           | Licitações    |
| `AuctionStartedEvent`      | Disputa foi iniciada           | Licitações    |
| `AuctionCompletedEvent`    | Disputa foi encerrada          | Licitações    |
| `AuctionCancelledEvent`    | Leilão foi cancelado           | Licitações    |
| `BidPlacedEvent`           | Um lance foi registrado        | Licitações    |
| `BidWithdrawnEvent`        | Um lance foi retirado          | Licitações    |
| `ProposalSubmittedEvent`   | Proposta foi submetida         | Licitações    |
| `ContractAwardedEvent`     | Contrato foi adjudicado        | Licitações    |
| `TenantProvisionedEvent`   | Tenant foi provisionado        | Multi-tenant  |
| `LeadCapturedEvent`        | Lead foi capturado             | CRM           |
| `OpportunityWonEvent`      | Oportunidade foi ganha         | CRM           |
| `SupplierQualifiedEvent`   | Fornecedor foi qualificado     | ERP           |
| `InvoiceApprovedEvent`     | Nota fiscal foi aprovada       | ERP           |
| `PredictionCompletedEvent` | Predição foi concluída         | IA            |
| `FraudAlertRaisedEvent`    | Alerta de fraude foi gerado    | IA            |

### 5.2 CloudEvents Formato

```typescript
// events/auction-created.event.ts
import { CloudEvent } from '../common/cloud-event';

export class AuctionCreatedEvent extends CloudEvent {
  static readonly type = 'com.bidflow.auction.created.v1';

  constructor(
    readonly auctionId: string,
    readonly tenantId: string,
    readonly title: string,
    readonly startPrice: number,
    readonly occurredAt: Date = new Date(),
  ) {
    super({
      id: crypto.randomUUID(),
      source: '/api/auctions',
      specversion: '1.0',
      type: AuctionCreatedEvent.type,
      subject: auctionId,
      time: occurredAt.toISOString(),
      datacontenttype: 'application/json',
      data: { auctionId, title, startPrice },
    });
  }
}
```

### 5.3 Estrutura do Payload

```typescript
interface DomainEventPayload {
  eventId: string;        // UUID — único, usado para idempotência
  aggregateId: string;    // ID do aggregate que gerou o evento
  tenantId: string;       // Tenant do aggregate
  type: string;           // Nome fully-qualified do evento
  timestamp: string;      // ISO 8601
  data: Record<string, unknown>;  // Dados específicos do evento
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
  };
}
```

### 5.4 Regras de Eventos

- Eventos são **imutáveis** após criados.
- Nome do evento no passado (`Created`, `Placed`, `Completed`, `Cancelled`).
- `type` segue padrão: `com.bidflow.<context>.<entity>.<action>.v<version>`.
- Todo evento carrega `tenantId` para roteamento e isolamento.
- Eventos publicados via RabbitMQ usam `routingKey = tenantId + '.' + eventType`.

---

## 6. Validation

### 6.1 Camadas de Validação

```
[NestJS ValidationPipe]  →  [class-validator DTO]  →  [Domain Invariants]
       HTTP edge              Sintaxe/formato           Regras de negócio
```

### 6.2 ValidationPipe Global (main.ts)

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const formatted = errors.map((e) => ({
          field: e.property,
          constraints: e.constraints,
        }));
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formatted,
        });
      },
    }),
  );
}
```

### 6.3 Validação de Domínio (Invariantes)

```typescript
// domain/auction.entity.ts
export class AuctionEntity {
  constructor(
    public readonly id: string,
    public title: string,
    public startPrice: Money,
    public status: AuctionStatus,
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    private _bids: BidEntity[] = [],
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.startDate >= this.endDate) {
      throw new DomainException('startDate must precede endDate');
    }
    if (this.startPrice.amount <= 0) {
      throw new DomainException('startPrice must be positive');
    }
    if (!this.tenantId) {
      throw new DomainException('tenantId is required');
    }
  }

  placeBid(amount: Money, userId: string): BidEntity {
    if (this.status !== AuctionStatus.ACTIVE) {
      throw new DomainException('Auction is not active');
    }
    if (amount.amount <= this.currentPrice.amount) {
      throw new DomainException('Bid must exceed current price');
    }
    if (this.isExpired()) {
      throw new DomainException('Auction has ended');
    }

    const bid = new BidEntity(crypto.randomUUID(), amount, userId, this.id);
    this._bids.push(bid);
    this.currentPrice = amount;
    return bid;
  }

  private isExpired(): boolean {
    return new Date() > this.endDate;
  }
}
```

### 6.4 Hierarchy de Exceções

```typescript
// common/exceptions/domain.exception.ts
export abstract class DomainException extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// common/exceptions/auction-not-active.exception.ts
export class AuctionNotActiveException extends DomainException {
  readonly code = 'AUCTION_NOT_ACTIVE';
  readonly statusCode = 422;

  constructor(auctionId: string) {
    super(`Auction ${auctionId} is not in ACTIVE status`);
  }
}

// common/exceptions/bid-below-minimum.exception.ts
export class BidBelowMinimumException extends DomainException {
  readonly code = 'BID_BELOW_MINIMUM';
  readonly statusCode = 422;

  constructor(minAmount: number) {
    super(`Bid must be greater than ${minAmount}`);
  }
}
```

---

## 7. Logs

### 7.1 Logger Oficial

Use **exclusivamente** `@nestjs/common` Logger ou `pino` (via `nestjs-pino`).

```typescript
import { Logger } from '@nestjs/common';

export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  async create(dto: CreateAuctionDto): Promise<AuctionEntity> {
    this.logger.log(`Creating auction: ${dto.title}`, {
      tenantId: this.tenantContext.tenantId,
      userId: dto.userId,
    });

    try {
      const auction = AuctionEntity.create(dto);
      await this.repository.save(auction);
      this.logger.log(`Auction created: ${auction.id}`);
      return auction;
    } catch (error) {
      this.logger.error(`Failed to create auction: ${dto.title}`, error.stack);
      throw error;
    }
  }
}
```

### 7.2 Níveis de Log

| Nível     | Quando usar                                           |
|-----------|-------------------------------------------------------|
| `log`     | Início/fim de operação de sucesso (criação, update)   |
| `warn`    | Comportamento inesperado não-crítico (tentativa de acesso negado) |
| `error`   | Exceção capturada, falha em operação                 |
| `debug`   | Informação detalhada para desenvolvimento            |
| `verbose` | Dados de tráfego, payloads completos                 |

### 7.3 Formato Obrigatório

Sempre passar **objeto estruturado** como segundo argumento:

```typescript
// ✅ Correto
this.logger.log('Auction created', { auctionId, tenantId, title });

// ❌ Incorreto — concatenação
this.logger.log(`Auction ${id} created for tenant ${tenantId}`);
```

### 7.4 Logger Global (Request-scoped)

```typescript
// common/middleware/request-logger.middleware.ts
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        tenantId: req.headers['x-tenant-id'],
        userId: (req as any).user?.id,
      });
    });

    next();
  }
}
```

### 7.5 Proibições

- ❌ `console.log()` — proibido em produção.
- ❌ `console.error()` — proibido em produção.
- ❌ Logar senhas, tokens, PII (CPF, email em logs não-anonimizados).
- ❌ Logar payloads completos sem sanitização.

---

## 8. Observability

### 8.1 Configuração OpenTelemetry

```typescript
// common/observability/telemetry.ts
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export function initTelemetry(serviceName: string): NodeTracerProvider {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
    }),
  });

  provider.addSpanProcessor(
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      }),
    ),
  );

  provider.register();
  return provider;
}
```

### 8.2 Atributos mínimos em cada Span

```typescript
// Sempre incluir nos spans:
span.setAttribute('tenant.id', tenantId);
span.setAttribute('user.id', userId);
span.setAttribute('auction.id', auctionId);   // se aplicável
span.setAttribute('command.type', commandName);  // para CQRS
```

### 8.3 Métricas (Prometheus)

```typescript
// common/metrics/auction.metrics.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class AuctionMetrics {
  private readonly auctionCreatedCounter: Counter<string>;
  private readonly bidDurationHistogram: Histogram<string>;

  constructor() {
    this.auctionCreatedCounter = new Counter({
      name: 'bidflow_auction_created_total',
      help: 'Total de leilões criados',
      labelNames: ['tenant_id', 'modality'],
    });

    this.bidDurationHistogram = new Histogram({
      name: 'bidflow_bid_placement_duration_seconds',
      help: 'Duração do processo de registro de lance',
      labelNames: ['tenant_id'],
      buckets: [0.1, 0.3, 0.5, 1, 3],
    });
  }

  incrementAuctionCreated(tenantId: string, modality: string): void {
    this.auctionCreatedCounter.labels(tenantId, modality).inc();
  }

  observeBidDuration(tenantId: string, duration: number): void {
    this.bidDurationHistogram.labels(tenantId).observe(duration);
  }
}
```

### 8.4 Health Checks

```typescript
// common/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prisma.$queryRaw`SELECT 1`,
      // () => rabbitMQ.ping(),
      // () => redis.ping(),
    ]);
  }
}
```

---

## 9. Error Handling

### 9.1 Exception Filter Global

```typescript
// common/filters/domain-exception.filter.ts
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.warn(`Domain exception: ${exception.code} — ${exception.message}`, {
      path: request.url,
      method: request.method,
      tenantId: request.headers['x-tenant-id'],
    });

    response.status(exception.statusCode).json({
      statusCode: exception.statusCode,
      code: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

// common/filters/all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    this.logger.error(`Unhandled exception: ${message}`, {
      path: request.url,
      method: request.method,
      status,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      statusCode: status,
      message: status === 500 ? 'Internal server error' : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### 9.2 Error Response Padrão

```typescript
interface ErrorResponse {
  statusCode: number;      // HTTP status
  code: string;            // Código intern do erro (ex: AUCTION_NOT_FOUND)
  message: string;         // Mensagem amigável
  timestamp: string;       // ISO 8601
  path: string;            // Rota da requisição
  errors?: Array<{         // Apenas para erros de validação
    field: string;
    constraints: Record<string, string>;
  }>;
}
```

### 9.3 Códigos de Erro

| Código                       | HTTP  | Significado                     |
|------------------------------|-------|---------------------------------|
| `VALIDATION_ERROR`           | 400   | DTO inválido                    |
| `UNAUTHORIZED`               | 401   | Token ausente/expirado          |
| `FORBIDDEN`                  | 403   | Sem permissão                   |
| `TENANT_MISMATCH`            | 403   | Tenant não corresponde ao token |
| `NOT_FOUND`                  | 404   | Entidade não encontrada         |
| `AUCTION_NOT_ACTIVE`         | 422   | Leilão não está ativo           |
| `BID_BELOW_MINIMUM`          | 422   | Lance abaixo do mínimo          |
| `BID_AFTER_DEADLINE`         | 422   | Lance após prazo                |
| `QUOTA_EXCEEDED`             | 429   | Limite do plano excedido        |
| `INTERNAL_ERROR`             | 500   | Erro não esperado               |

### 9.4 Regras de Error Handling

- `DomainException` → HTTP 4xx, filtro específico.
- Erros de infraestrutura (banco, fila, cache) → log + throw `InternalServerErrorException`.
- Erros de validação de DTO → `ValidationPipe` (HTTP 400).
- Nunca expor stack trace em produção.
- Sempre logar o erro com contexto suficiente para debugging.

---

## 10. Tenant Isolation

### 10.1 TenantContext

```typescript
// common/context/tenant-context.ts
export interface TenantContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly role: string;
}

// common/decorators/current-tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext;
  },
);
```

### 10.2 TenantGuard

```typescript
// common/guards/tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantService: TenantService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tokenTenantId = request.user?.tenantId;

    if (!tokenTenantId) {
      throw new UnauthorizedException('Tenant not found in token');
    }

    const active = this.tenantService.isActive(tokenTenantId);
    if (!active) {
      throw new ForbiddenException('Tenant is not active');
    }

    request.tenantContext = {
      tenantId: tokenTenantId,
      userId: request.user.sub,
      role: request.user.role,
    };

    return true;
  }
}
```

### 10.3 Prisma Tenant Extension

```typescript
// prisma/prisma.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  // Método que retorna um client com tenantId fixo
  withTenant(tenantId: string): PrismaClient {
    // Usar extends do Prisma Client para aplicar filtro global
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (operation === 'findUnique' || operation === 'findMany') {
              args.where = { ...args.where, tenantId };
            }
            return query(args);
          },
        },
      },
    }) as unknown as PrismaClient;
  }
}
```

### 10.4 Interceptor de Tenant

```typescript
// common/interceptors/tenant.interceptor.ts
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    if (request.method !== 'GET') {
      const body = request.body;
      if (body && typeof body === 'object') {
        body.tenantId = tenantId;  // Injeta tenantId no body
      }
    }

    return next.handle();
  }
}
```

### 10.5 Regras de Isolamento

- `tenantId` é extraído do JWT, nunca confie em `x-tenant-id` header sozinho.
- Toda query ao banco **deve** filtrar por `tenantId`.
- Cache Redis: chaves prefixadas com `tenantId:<id>:`.
- Filas RabbitMQ: routing key prefixada com `tenantId.`.
- Logs: campo `tenantId` obrigatório em toda entrada de log.
- Métricas: label `tenant_id` em toda métrica.
- Sessão: armazenada por tenant + usuário.

---

## 11. Project Structure

### 11.1 Estrutura Final

```
apps/api/src/
├── app.module.ts
├── main.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
│   ├── context/
│   │   └── tenant-context.ts
│   ├── decorators/
│   │   └── current-tenant.decorator.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── tenant.guard.ts
│   ├── interceptors/
│   │   └── tenant.interceptor.ts
│   ├── filters/
│   │   ├── domain-exception.filter.ts
│   │   └── all-exceptions.filter.ts
│   ├── middleware/
│   │   └── request-logger.middleware.ts
│   ├── observability/
│   │   ├── telemetry.ts
│   │   └── metrics.ts
│   └── health/
│       └── health.controller.ts
├── auctions/                        # Bounded Context
│   ├── dto/
│   │   ├── create-auction.dto.ts
│   │   ├── update-auction.dto.ts
│   │   ├── filter-auction.dto.ts
│   │   └── auction-response.dto.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-auction.command.ts
│   │   │   └── create-auction.handler.ts
│   │   ├── queries/
│   │   │   ├── get-auction.query.ts
│   │   │   └── get-auction.handler.ts
│   │   └── events/
│   │       └── auction-closed.handler.ts
│   ├── domain/
│   │   ├── auction.entity.ts
│   │   ├── value-objects/
│   │   │   └── money.ts
│   │   ├── events/
│   │   │   ├── auction-created.event.ts
│   │   │   └── auction-closed.event.ts
│   │   ├── auction.repository.ts       # Interface (port)
│   │   └── auction-filter.ts           # Objeto de filtro
│   └── infrastructure/
│       ├── controllers/
│       │   └── auctions.controller.ts
│       └── prisma-auction.repository.ts
├── bids/                            # Bounded Context
│   └── ...
├── users/                           # Bounded Context
│   └── ...
└── rfp/                             # Bounded Context (futuro)
    └── ...
```

### 11.2 Regras de Importação

```typescript
// ✅ Permitido
import { PrismaService } from '../../prisma/prisma.service';
import { AuctionRepository } from '../domain/auction.repository';
import { Money } from '../domain/value-objects/money';
import { CreateAuctionDto } from '../dto/create-auction.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

// ❌ Proibido
import { AuctionsService } from '../../auctions/auctions.service';   // outro módulo
import { PrismaClient } from '@prisma/client';                       // sem passar pelo PrismaService
import { Type } from 'class-transformer';                            // sem importar o pacote correto
```

---

## 12. General TypeScript Rules

### 12.1 Sempre usar `readonly` em parâmetros de construtor

```typescript
// ✅ Correto
constructor(
  private readonly prisma: PrismaService,
  private readonly repository: AuctionRepository,
) {}

// ❌ Incorreto
constructor(
  private prisma: PrismaService,
) {}
```

### 12.2 Preferir `interface` sobre `type` para contratos públicos

```typescript
// ✅ Interface para contratos
export interface AuctionRepository { ... }

// ✅ Type para uniões e utilitários
export type AuctionStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
```

### 12.3 Nullable vs Optional

```typescript
// Use optional (?) para campos que podem não estar presentes
interface AuctionFilter {
  status?: AuctionStatus;
  search?: string;
}

// Use | null para valores que são explicitamente nulos
class AuctionEntity {
  readonly winnerId: string | null;
}
```

### 12.4 Async/Await

```typescript
// ✅ Sempre usar async/await, nunca .then()/.catch()
async create(dto: CreateAuctionDto): Promise<AuctionEntity> {
  const auction = AuctionEntity.create(dto);
  await this.repository.save(auction);
  return auction;
}

// ❌ Evitar
create(dto: CreateAuctionDto): Promise<AuctionEntity> {
  return this.repository.save(AuctionEntity.create(dto));
}
```

### 12.5 Tipagem explícita em métodos públicos

```typescript
// ✅ Tipagem explícita em métodos públicos
async findById(id: string): Promise<AuctionEntity | null> { ... }

// ✅ Tipagem inferida ok em métodos privados
private buildWhere(filter: AuctionFilter) { ... }
```

### 12.6 ESLint & Prettier

O projeto usa as configurações em `.eslintrc.json` e `.prettierrc` na raiz. Regras adicionais:

```json
// .eslintrc.json — complementos
{
  "rules": {
    "no-console": "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

---

> **Revisão:** Este documento deve ser revisado trimestralmente pelo Architecture Review Board.
> **Violações:** Devem ser apontadas em code review e corrigidas antes do merge. Reincidência deve ser escalada ao Tech Lead.
