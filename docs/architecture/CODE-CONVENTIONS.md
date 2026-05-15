# BidFlow Platform - Code Conventions

## 1. Naming Conventions

### Files
```
// TypeScript/JavaScript
kebab-case:          bidding.service.ts
                     create-bidding-command.ts

// React Components
PascalCase:          BiddingCard.tsx
                     ContactForm.tsx

// Python
snake_case:          bidding_service.py
                     bid_analyzer.py

// CSS/Tailwind
kebab-case:          bg-blue-500
                     text-center
```

### Classes/Interfaces
```
// TypeScript
PascalCase:          class BiddingService
                     interface IBiddingRepository
                     type BiddingStatus = 'OPEN' | 'CLOSED'

// Python
PascalCase:          class BiddingAnalyzer(BaseModel)
                     class SuitabilityCalculator
```

### Variables/Functions
```
// TypeScript
camelCase:           const biddingList = []
                     function calculateScore()

// Python
snake_case:          bidding_list = []
                     def calculate_score()
```

---

## 2. Folder Structure Patterns

### NestJS Service Structure
```
module-name/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── [entity-name].entity.ts
│   │   ├── value-objects/
│   │   │   └── [vo-name].vo.ts
│   │   ├── aggregates/
│   │   │   └── [aggregate-name].aggregate.ts
│   │   ├── repositories/
│   │   │   ├── [entity].repository.interface.ts
│   │   │   └── [entity].repository.ts
│   │   ├── services/
│   │   │   └── [domain-service].service.ts
│   │   ├── events/
│   │   │   └── [domain].events.ts
│   │   └── errors/
│   │       └── [error-name].error.ts
│   │
│   ├── application/
│   │   ├── commands/
│   │   │   ├── [command-name].command.ts
│   │   │   └── handlers/
│   │   │       └── [command-name].handler.ts
│   │   ├── queries/
│   │   │   ├── [query-name].query.ts
│   │   │   └── handlers/
│   │   │       └── [query-name].handler.ts
│   │   ├── dto/
│   │   │   ├── input/
│   │   │   │   └── [dto-name].dto.ts
│   │   │   └── output/
│   │   │       └── [response].dto.ts
│   │   └── services/
│   │       └── [app-service].service.ts
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── prisma/
│   │   │   │   ├── repositories/
│   │   │   │   │   └── prisma-[entity].repository.ts
│   │   │   │   └── mappers/
│   │   │   │       └── [entity].mapper.ts
│   │   │   └── repositories/
│   │   │       └── [entity].repository.ts
│   │   ├── messaging/
│   │   │   └── rabbitmq/
│   │   │       ├── publishers/
│   │   │       └── consumers/
│   │   ├── cache/
│   │   │   └── [cache].service.ts
│   │   └── external/
│   │       └── [external-service].service.ts
│   │
│   └── presentation/
│       ├── controllers/
│       │   └── [controller].controller.ts
│       ├── guards/
│       │   └── [guard].guard.ts
│       ├── interceptors/
│       │   └── [interceptor].interceptor.ts
│       ├── filters/
│       │   └── [filter].filter.ts
│       └── decorators/
│           └── [decorator].decorator.ts
│
├── test/
│   ├── unit/
│   │   └── ...
│   └── e2e/
│       └── ...
│
├── package.json
├── tsconfig.json
├── nest-cli.json
└── Dockerfile
```

### Next.js Page Structure
```
(app router)
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
│
├── (dashboard)/
│   ├── layout.tsx
│   ├── crm/
│   │   ├── contacts/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── companies/
│   │   └── deals/
│   │
│   ├── erp/
│   │   ├── projects/
│   │   ├── invoices/
│   │   └── finances/
│   │
│   └── settings/
│
└── api/
    └── [...trpc]/
```

---

## 3. Import Order

```typescript
// 1. External (npm packages)
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';

// 2. Shared packages (@bidflow/*)
import { DomainEvent } from '@bidflow/kernel/events';
import { AggregateRoot } from '@bidflow/kernel/base';
import { PaginationDto } from '@bidflow/shared/types';
import { TenantStatus } from '@bidflow/shared/enums';

// 3. Internal modules (apps/*)
import { BiddingMapper } from '../infrastructure/persistence/mappers/bidding.mapper';
import { CreateBiddingDto } from '../application/dto';

// 4. Relative paths
import { BiddingCreatedEvent } from './events/bidding.events';
import { BiddingEntity } from './entities/bidding.entity';

// 5. Type imports
import type { CreateBiddingCommand } from './commands/create-bidding.command';
```

---

## 4. Code Patterns

### Entity Pattern
```typescript
// domain/entities/bidding.entity.ts
export class Bidding extends AggregateRoot<BiddingId> {
  private _title: string;
  private _status: BiddingStatus;
  private _estimatedValue: Money;
  
  private constructor(
    id: BiddingId,
    title: string,
    status: BiddingStatus,
    estimatedValue: Money
  ) {
    super(id);
    this._title = title;
    this._status = status;
    this._estimatedValue = estimatedValue;
  }

  static create(props: CreateBiddingProps): Bidding {
    // Validation logic
    // Domain events
  }

  // Getters
  get title(): string { return this._title; }
  get status(): BiddingStatus { return this._status; }

  // Business methods
  publish(): void {
    if (this._status !== BiddingStatus.DRAFT) {
      throw new DomainException('Only draft biddings can be published');
    }
    this._status = BiddingStatus.PUBLISHED;
    this.addDomainEvent(new BiddingPublishedEvent(this));
  }

  toPersistence(): BiddingPersistence {
    return {
      id: this._id.value,
      title: this._title,
      status: this._status,
      estimatedValue: this._estimatedValue.value,
      // ...
    };
  }
}
```

### Command Handler Pattern
```typescript
// application/commands/bidding/create-bidding.handler.ts
@CommandHandler(CreateBiddingCommand)
export class CreateBiddingHandler 
  implements ICommandHandler<CreateBiddingCommand> {
  
  constructor(
    @Inject('IBiddingRepository')
    private readonly repository: IBiddingRepository,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: CreateBiddingCommand): Promise<Bidding> {
    // 1. Create aggregate
    const bidding = Bidding.create({
      ...command.dto,
      tenantId: command.tenantId
    });

    // 2. Persist
    await this.repository.save(bidding);

    // 3. Publish events
    for (const event of bidding.domainEvents) {
      await this.eventBus.publish(event);
    }
    bidding.clearDomainEvents();

    return bidding;
  }
}
```

### Controller Pattern
```typescript
// presentation/controllers/bidding.controller.ts
@Controller('biddings')
@UseGuards(JwtAuthGuard, TenantGuard)
@Roles('ADMIN', 'MANAGER', 'USER')
export class BiddingController {
  constructor(private readonly service: BiddingApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() dto: CreateBiddingDto,
    @TenantContext() tenant: TenantContext
  ): Promise<BiddingResponse> {
    const command = new CreateBiddingCommand(dto, tenant.id);
    const bidding = await this.commandBus.execute(command);
    return BiddingMapper.toResponse(bidding);
  }

  @Get(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantContext() tenant: TenantContext
  ): Promise<BiddingResponse> {
    const query = new GetBiddingByIdQuery(id, tenant.id);
    const bidding = await this.queryBus.execute(query);
    if (!bidding) {
      throw new NotFoundException('Bidding not found');
    }
    return BiddingMapper.toResponse(bidding);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
    @TenantContext() tenant: TenantContext
  ): Promise<PaginatedResponse<BiddingResponse>> {
    const result = await this.queryBus.execute(
      new ListBiddingsQuery(tenant.id, query)
    );
    return {
      data: result.data.map(BiddingMapper.toResponse),
      meta: result.meta
    };
  }
}
```

---

## 5. Error Handling

```typescript
// Domain Exceptions
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string = 'DOMAIN_ERROR',
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

export class BiddingNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Bidding with id ${id} not found`, 'BIDDING_NOT_FOUND', 404);
    this.name = 'BiddingNotFoundException';
  }
}

export class InvalidBiddingStateException extends DomainException {
  constructor(currentState: string, action: string) {
    super(`Cannot ${action} bidding in ${currentState} state`, 
          'INVALID_BIDDING_STATE', 400);
    this.name = 'InvalidBiddingStateException';
  }
}
```

---

## 6. Testing Patterns

```typescript
// Unit Test
describe('Bidding', () => {
  describe('publish', () => {
    it('should publish a draft bidding', () => {
      // Arrange
      const bidding = Bidding.create({
        title: 'Test Bidding',
        status: BiddingStatus.DRAFT,
        // ...
      });

      // Act
      bidding.publish();

      // Assert
      expect(bidding.status).toBe(BiddingStatus.PUBLISHED);
      expect(bidding.domainEvents).toContainEqual(
        expect.objectContaining({
          eventType: 'BiddingPublished'
        })
      );
    });

    it('should throw when publishing non-draft bidding', () => {
      const bidding = Bidding.create({
        title: 'Test',
        status: BiddingStatus.PUBLISHED,
        // ...
      });

      expect(() => bidding.publish()).toThrow(InvalidBiddingStateException);
    });
  });
});
```

---

## 7. Git Conventions

### Branch Naming
```
feature/CRM-123-add-contact-form
bugfix/CRM-456-fix-validation-error
hotfix/BIDDING-789-urgent-patch
refactor/ERP-101-cleanup-code
chore/update-dependencies
```

### Commit Messages
```
feat(crm): add contact form validation
fix(bidding): handle null estimated value
refactor(erp): simplify invoice calculation
docs(api): update bidding endpoint docs
test(crm): add unit tests for contact service
chore(deps): update nestjs packages to v10
```

### PR Titles
```
[CRM-123] Add Contact Form with Validation
[BID-456] Fix Estimated Value Null Handling
[ERP-789] Refactor Invoice Calculation Logic
```