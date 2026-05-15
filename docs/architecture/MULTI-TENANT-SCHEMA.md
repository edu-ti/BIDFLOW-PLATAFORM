# Multi-Tenant Architecture - Schema-Per-Tenant

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL INSTANCE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │ public schema     │  │ tenant_abc schema│  │ tenant_xyz schema│        │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤        │
│  │ tenants          │  │ users            │  │ users            │        │
│  │ plans            │  │ contacts         │  │ contacts         │        │
│  │ subscription     │  │ companies        │  │ companies        │        │
│  │ (shared tables)  │  │ deals            │  │ deals            │        │
│  │                  │  │ projects         │  │ projects         │        │
│  │                  │  │ invoices         │  │ invoices         │        │
│  │                  │  │ ...              │  │ ...              │        │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘        │
│                                                                             │
│  Management Schema (pg_temp equivalent)                                     │
│  - migrations                                                              │
│  - seeders                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Estrutura do Banco de Dados

### 1.1 Schema Público (Shared)

```sql
-- public schema - tabelas compartilhadas entre tenants

CREATE TABLE IF NOT EXISTS "tenants" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL UNIQUE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "plan_id" UUID NOT NULL,
    "custom_domain" VARCHAR(255),
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "plans" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "display_name" VARCHAR(255) NOT NULL,
    "monthly_price" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "yearly_price" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "max_users" INTEGER NOT NULL DEFAULT 5,
    "max_storage_gb" INTEGER NOT NULL DEFAULT 10,
    "features" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id"),
    "plan_id" UUID NOT NULL REFERENCES "plans"("id"),
    "status" VARCHAR(50) NOT NULL DEFAULT 'TRIAL',
    "billing_cycle" VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    "current_period_start" TIMESTAMP NOT NULL DEFAULT NOW(),
    "current_period_end" TIMESTAMP NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id"),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "role" VARCHAR(50) NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("tenant_id", "email")
);

-- Índices para performance
CREATE INDEX "idx_tenants_slug" ON "tenants"("slug");
CREATE INDEX "idx_tenants_status" ON "tenants"("status");
CREATE INDEX "idx_users_tenant_email" ON "users"("tenant_id", "email");
CREATE INDEX "idx_subscriptions_tenant" ON "subscriptions"("tenant_id");
```

### 1.2 Schema Por Tenant (CRM/ERP)

```sql
-- Cada tenant拥有自己的 schema com prefixo tenant_{id}

-- CRM Tables
CREATE TABLE IF NOT EXISTS "contacts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "company_id" UUID,
    "position" VARCHAR(100),
    "department" VARCHAR(100),
    "status" VARCHAR(50) DEFAULT 'LEAD',
    "source" VARCHAR(100),
    "score" INTEGER DEFAULT 0,
    "custom_fields" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "companies" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "trade_name" VARCHAR(255),
    "cnpj" VARCHAR(20),
    "segment" VARCHAR(100),
    "size" VARCHAR(50),
    "website" VARCHAR(255),
    "description" TEXT,
    "address" JSONB,
    "status" VARCHAR(50) DEFAULT 'PROSPECT',
    "score" INTEGER DEFAULT 0,
    "custom_fields" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "deals" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "company_id" UUID NOT NULL,
    "contact_id" UUID,
    "pipeline_id" UUID,
    "value" DECIMAL(15, 2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(10) DEFAULT 'BRL',
    "stage" VARCHAR(50) NOT NULL,
    "probability" INTEGER DEFAULT 0,
    "expected_close_date" DATE,
    "status" VARCHAR(50) DEFAULT 'OPEN',
    "won_at" TIMESTAMP,
    "lost_at" TIMESTAMP,
    "lost_reason" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ERP Tables
CREATE TABLE IF NOT EXISTS "projects" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL DEFAULT 'INTERNAL',
    "status" VARCHAR(50) DEFAULT 'PLANNING',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "budget" DECIMAL(15, 2),
    "currency" VARCHAR(10) DEFAULT 'BRL',
    "owner_id" UUID,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "invoices" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "number" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'SALE',
    "status" VARCHAR(50) DEFAULT 'DRAFT',
    "customer_id" UUID,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "subtotal" DECIMAL(15, 2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15, 2) DEFAULT 0,
    "total" DECIMAL(15, 2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(10) DEFAULT 'BRL',
    "items" JSONB DEFAULT '[]',
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Workflow Tables
CREATE TABLE IF NOT EXISTS "workflows" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "definition" JSONB NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "trigger_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 2. Prisma Schema (Schema-Per-Tenant)

```typescript
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// PUBLIC SCHEMA - Tabelas compartilhadas
// ============================================

model Tenant {
  id           String        @id @default(uuid())
  name         String
  slug         String        @unique
  status       TenantStatus  @default(PENDING)
  planId       String
  customDomain String?
  settings     Json          @default("{}")
  createdAt    DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  plan         Plan           @relation(fields: [planId], references: [id])
  subscription Subscription?
  users        User[]

  @@schema("public")
  @@map("tenants")
}

model Plan {
  id           String    @id @default(uuid())
  name         String    @unique
  displayName  String
  monthlyPrice Decimal   @db.Decimal(10, 2)
  yearlyPrice  Decimal   @db.Decimal(10, 2)
  maxUsers     Int       @default(5)
  maxStorageGb Int       @default(10)
  features     Json      @default("{}")
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())

  tenants      Tenant[]

  @@schema("public")
  @@map("plans")
}

model Subscription {
  id                  String   @id @default(uuid())
  tenantId            String   @unique
  tenant              Tenant   @relation(fields: [tenantId], references: [id])
  planId              String
  status              SubscriptionStatus @default(TRIAL)
  billingCycle        BillingCycle      @default(MONTHLY)
  currentPeriodStart  DateTime @default(now())
  currentPeriodEnd    DateTime
  cancelAtPeriodEnd   Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@schema("public")
  @@map("subscriptions")
}

model User {
  id            String    @id @default(uuid())
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  email         String
  passwordHash  String
  firstName     String
  lastName      String?
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true)
  emailVerified Boolean   @default(false)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([tenantId, email])
  @@schema("public")
  @@map("users")
}

// Enums
enum TenantStatus {
  PENDING
  ACTIVE
  SUSPENDED
  CANCELED
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
  SUSPENDED
}

enum BillingCycle {
  MONTHLY
  YEARLY
}

enum UserRole {
  ADMIN
  MANAGER
  USER
  VIEWER
}
```

---

## 3. Tenant Resolution Service

```typescript
// core/tenant/tenant.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PgDatabase, PgSchemaService } from 'nestjs-prisma';
import { TenantConfig } from './tenant-config.interface';

@Injectable()
export class TenantService implements OnModuleInit {
  private tenantCache: Map<string, TenantConfig> = new Map();
  private readonly DEFAULT_SCHEMA = 'public';

  constructor(
    private readonly prisma: PgDatabase<'default'>,
    private readonly schemaService: PgSchemaService
  ) {}

  async onModuleInit() {
    // Pre-load active tenants on startup
    await this.refreshTenantCache();
  }

  async resolveTenant(subdomain: string | undefined, customDomain: string | undefined): Promise<TenantConfig> {
    const cacheKey = subdomain || customDomain || 'default';
    
    // Check cache first
    const cached = this.tenantCache.get(cacheKey);
    if (cached && cached.status === 'ACTIVE') {
      return cached;
    }

    // Query from database
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          subdomain ? { slug: subdomain } : {},
          customDomain ? { customDomain: customDomain } : {}
        ],
        status: 'ACTIVE'
      },
      include: {
        plan: true,
        subscription: true
      }
    });

    if (!tenant) {
      throw new TenantNotFoundException(cacheKey);
    }

    const config: TenantConfig = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      schemaName: `tenant_${tenant.id.replace(/-/g, '_')}`,
      plan: tenant.plan,
      subscription: tenant.subscription
    };

    this.tenantCache.set(cacheKey, config);
    return config;
  }

  async createTenant(data: CreateTenantDto): Promise<TenantConfig> {
    // 1. Create tenant in public schema
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: this.generateSlug(data.name),
        status: 'PENDING',
        planId: data.planId
      },
      include: { plan: true, subscription: true }
    });

    // 2. Create tenant schema
    const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
    await this.schemaService.createSchema(schemaName);

    // 3. Run migrations for new schema
    await this.migrateSchema(schemaName);

    // 4. Create subscription
    await this.prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: tenant.planId,
        status: 'TRIAL',
        currentPeriodEnd: this.calculateTrialEnd()
      }
    });

    // 5. Create admin user
    await this.createAdminUser(tenant.id, data.adminEmail, data.adminPassword);

    // 6. Update tenant status to active
    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'ACTIVE' }
    });

    // 7. Refresh cache
    await this.refreshTenantCache();

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: 'ACTIVE',
      schemaName,
      plan: tenant.plan,
      subscription: null
    };
  }

  private async migrateSchema(schemaName: string): Promise<void> {
    // Apply base migrations to tenant schema
    const migrations = [
      this.getCreateTablesMigration(), // SQL to create CRM/ERP tables
    ];

    for (const migration of migrations) {
      await this.prisma.$executeRawUnsafe(
        `SET search_path TO ${schemaName}; ${migration}`
      );
    }
  }

  private getCreateTablesMigration(): string {
    return `
      -- CRM tables
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company_id UUID,
        position VARCHAR(100),
        department VARCHAR(100),
        status VARCHAR(50) DEFAULT 'LEAD',
        source VARCHAR(100),
        score INTEGER DEFAULT 0,
        custom_fields JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        trade_name VARCHAR(255),
        cnpj VARCHAR(20),
        segment VARCHAR(100),
        size VARCHAR(50),
        website VARCHAR(255),
        description TEXT,
        address JSONB,
        status VARCHAR(50) DEFAULT 'PROSPECT',
        score INTEGER DEFAULT 0,
        custom_fields JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        company_id UUID NOT NULL,
        contact_id UUID,
        pipeline_id UUID,
        value DECIMAL(15, 2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'BRL',
        stage VARCHAR(50) NOT NULL,
        probability INTEGER DEFAULT 0,
        expected_close_date DATE,
        status VARCHAR(50) DEFAULT 'OPEN',
        won_at TIMESTAMP,
        lost_at TIMESTAMP,
        lost_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- ERP tables
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'INTERNAL',
        status VARCHAR(50) DEFAULT 'PLANNING',
        start_date DATE NOT NULL,
        end_date DATE,
        budget DECIMAL(15, 2),
        currency VARCHAR(10) DEFAULT 'BRL',
        owner_id UUID,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        number VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'SALE',
        status VARCHAR(50) DEFAULT 'DRAFT',
        customer_id UUID,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(15, 2) DEFAULT 0,
        total DECIMAL(15, 2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'BRL',
        items JSONB DEFAULT '[]',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_contacts_company ON contacts(company_id);
      CREATE INDEX idx_deals_company ON deals(company_id);
      CREATE INDEX idx_deals_stage ON deals(stage);
    `;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  private calculateTrialEnd(): Date {
    const end = new Date();
    end.setDate(end.getDate() + 14);
    return end;
  }

  private async createAdminUser(tenantId: string, email: string, password: string): Promise<void> {
    // Password hashing should be done with bcrypt
    const passwordHash = await this.hashPassword(password);
    
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "users" (id, tenant_id, email, password_hash, first_name, role, "created_at", "updated_at")
       VALUES (gen_random_uuid(), $1, $2, $3, 'Admin', 'ADMIN', NOW(), NOW())`,
      tenantId, email, passwordHash
    );
  }

  private async hashPassword(password: string): Promise<string> {
    // Implement bcrypt hashing
    return password; // Placeholder
  }

  private async refreshTenantCache(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, slug: true, customDomain: true, status: true }
    });

    this.tenantCache.clear();
    for (const tenant of tenants) {
      this.tenantCache.set(tenant.slug, {
        id: tenant.id,
        slug: tenant.slug,
        status: tenant.status,
        schemaName: `tenant_${tenant.id.replace(/-/g, '_')}`
      } as TenantConfig);
      if (tenant.customDomain) {
        this.tenantCache.set(tenant.customDomain, {
          id: tenant.id,
          slug: tenant.slug,
          status: tenant.status,
          schemaName: `tenant_${tenant.id.replace(/-/g, '_')}`
        } as TenantConfig);
      }
    }
  }
}

interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  schemaName: string;
  plan?: Plan;
  subscription?: Subscription;
}

interface CreateTenantDto {
  name: string;
  planId: string;
  adminEmail: string;
  adminPassword: string;
}
```

---

## 4. Middleware de Resolução de Tenant

```typescript
// core/tenant/tenant.middleware.ts
import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract subdomain from host header
      const host = req.headers.host || '';
      const subdomain = this.extractSubdomain(host);
      const customDomain = this.extractCustomDomain(req.headers.host, req.headers.referer);

      // Resolve tenant
      const tenant = await this.tenantService.resolveTenant(subdomain, customDomain);

      // Attach tenant info to request
      (req as any).tenant = tenant;
      (req as any).tenantId = tenant.id;
      (req as any).schemaName = tenant.schemaName;

      // Set schema for Prisma
      await this.setPrismaSchema(tenant.schemaName);

      next();
    } catch (error) {
      if (error instanceof TenantNotFoundException) {
        throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  private extractSubdomain(host: string): string | undefined {
    if (!host) return undefined;
    
    // Remove port if present
    const hostname = host.split(':')[0];
    
    // Check for localhost development
    if (hostname === 'localhost' || hostname.startsWith('127.')) {
      return undefined;
    }

    // Extract subdomain (e.g., "abc" from "abc.platform.com")
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }

    return undefined;
  }

  private extractCustomDomain(host: string | undefined, referer: string | undefined): string | undefined {
    // Custom domains bypass the platform subdomain pattern
    if (!host) return undefined;
    
    const hostname = host.split(':')[0];
    const knownDomains = ['platform.com', 'localhost'];
    
    // If hostname doesn't end with known platform domain, it's a custom domain
    const isCustomDomain = !knownDomains.some(d => hostname.endsWith(d));
    
    return isCustomDomain ? hostname : undefined;
  }

  private async setPrismaSchema(schemaName: string): Promise<void> {
    // Set the PostgreSQL search_path for current connection
    // This is handled by the Prisma middleware/interceptor
  }
}

// core/tenant/tenant-context.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  schemaName: string;
}

export const TenantContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return {
      id: request.tenantId,
      slug: request.tenant?.slug,
      name: request.tenant?.name,
      schemaName: request.schemaName
    };
  }
);

// Usage in controller
@Controller('contacts')
export class ContactsController {
  @Get()
  async findAll(
    @TenantContext() tenant: TenantContext,
    @Query() query: PaginationQueryDto
  ) {
    return this.contactsService.findAll(tenant, query);
  }
}
```

---

## 5. Prisma Middleware para Schema-Per-Tenant

```typescript
// infrastructure/prisma/tenant-prisma.middleware.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

@Injectable()
export class TenantPrismaMiddleware implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }

  async onModuleInit() {
    // Enable PostGIS or other extensions if needed
    // await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async setSchema(schemaName: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(`SET search_path TO ${schemaName}, public`);
  }

  getClient(): PrismaClient {
    return this.prisma;
  }

  async transaction<T>(
    schemaName: string,
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    await this.setSchema(schemaName);
    return fn(this.prisma);
  }
}

// infrastructure/prisma/prisma.module.ts
import { Module, Global, Inject, OnModuleInit, Provider } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantPrismaMiddleware } from './tenant-prisma.middleware';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Global()
@Module({
  providers: [
    TenantPrismaMiddleware,
    {
      provide: PRISMA_CLIENT,
      useFactory: () => {
        return new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
        });
      }
    }
  ],
  exports: [TenantPrismaMiddleware, PRISMA_CLIENT]
})
export class PrismaModule implements OnModuleInit {
  constructor(
    private readonly middleware: TenantPrismaMiddleware
  ) {}

  async onModuleInit() {
    // Initialize connection pool
    await (await this.middleware.getClient()).$connect;
  }
}

// infrastructure/prisma/tenant-prisma.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class TenantPrismaService {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly tenantMiddleware: TenantPrismaMiddleware
  ) {}

  async getRepository<T>(repositoryClass: new () => T): Promise<T> {
    const schemaName = (this.request as any).schemaName || 'public';
    await this.tenantMiddleware.setSchema(schemaName);
    // Return repository instance configured for tenant schema
    return {} as T; // Placeholder
  }
}
```

---

## 6. Fluxo de Autenticação

```typescript
// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaClient
  ) {}

  async validateUser(email: string, password: string, tenantId: string): Promise<UserPayload | null> {
    // Query from public schema with tenant filter
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
        isActive: true
      }
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role
    };
  }

  async login(credentials: LoginDto, tenantId: string) {
    const user = await this.validateUser(credentials.email, credentials.password, tenantId);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName
      }
    };
  }

  async register(registerDto: RegisterDto) {
    const tenant = await this.tenantService.createTenant({
      name: registerDto.companyName,
      planId: registerDto.planId || 'free-plan-id',
      adminEmail: registerDto.email,
      adminPassword: registerDto.password
    });

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      message: 'Tenant created successfully'
    };
  }
}

// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET
    });
  }

  async validate(payload: JwtPayload): Promise<UserPayload> {
    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role
    };
  }
}

// auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

// RBAC Guard
@Injectable()
export class RolesGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Usage
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
export class CompaniesController {
  @Post()
  async create(@Body() dto: CreateCompanyDto, @TenantContext() tenant: TenantContext) {
    return this.companyService.create(dto, tenant);
  }
}
```

---

## 7. Migrations Automáticas

```typescript
// migrations/tenant-migration.service.ts
import { Injectable } from '@nestjs/common';
import { TenantService } from './tenant.service';

interface Migration {
  version: number;
  name: string;
  up: string;
  down?: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_crm_tables',
    up: `
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company_id UUID,
        position VARCHAR(100),
        department VARCHAR(100),
        status VARCHAR(50) DEFAULT 'LEAD',
        source VARCHAR(100),
        score INTEGER DEFAULT 0,
        custom_fields JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX idx_contacts_company ON contacts(company_id);
    `
  },
  {
    version: 2,
    name: 'add_erp_tables',
    up: `
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'INTERNAL',
        status VARCHAR(50) DEFAULT 'PLANNING',
        start_date DATE NOT NULL,
        end_date DATE,
        budget DECIMAL(15, 2),
        currency VARCHAR(10) DEFAULT 'BRL',
        owner_id UUID,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `
  },
  {
    version: 3,
    name: 'add_workflow_tables',
    up: `
      CREATE TABLE IF NOT EXISTS workflows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        definition JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        trigger_count INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `
  }
];

@Injectable()
export class TenantMigrationService {
  private migrationVersions: Map<string, number> = new Map();

  constructor(private readonly tenantService: TenantService) {}

  async runMigrationsForTenant(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
    const currentVersion = this.migrationVersions.get(tenantId) || 0;

    // Get executed migrations from migration table
    const executedMigrations = await this.getExecutedMigrations(tenantId, schemaName);

    // Run pending migrations
    const pendingMigrations = MIGRATIONS.filter(m => !executedMigrations.includes(m.name));

    for (const migration of pendingMigrations) {
      await this.executeMigration(schemaName, migration, tenantId);
    }

    this.migrationVersions.set(tenantId, MIGRATIONS.length);
  }

  private async executeMigration(schemaName: string, migration: Migration, tenantId: string): Promise<void> {
    console.log(`Running migration ${migration.name} for tenant ${tenantId}`);
    
    await this.tenantService.executeRaw(`SET search_path TO ${schemaName}; ${migration.up}`);
    
    // Record migration
    await this.tenantService.executeRaw(`
      INSERT INTO __migrations (version, name, executed_at)
      VALUES ($1, $2, NOW())
    `, migration.version, migration.name);
  }

  private async getExecutedMigrations(tenantId: string, schemaName: string): Promise<string[]> {
    try {
      const result = await this.tenantService.executeRaw(`
        SELECT name FROM ${schemaName}.__migrations ORDER BY version
      `);
      return result.map((r: any) => r.name);
    } catch {
      // Migration table doesn't exist yet
      return [];
    }
  }

  async migrateAllTenants(): Promise<void> {
    const tenants = await this.tenantService.getAllActiveTenants();
    
    for (const tenant of tenants) {
      try {
        await this.runMigrationsForTenant(tenant.id);
        console.log(`Migrations completed for tenant ${tenant.id}`);
      } catch (error) {
        console.error(`Migration failed for tenant ${tenant.id}:`, error);
      }
    }
  }
}

// Scheduler for automatic migrations
@Injectable()
export class MigrationScheduler implements OnModuleInit {
  constructor(private readonly migrationService: TenantMigrationService) {}

  async onModuleInit() {
    // Run migrations on startup
    await this.migrationService.migrateAllTenants();
    
    // Schedule periodic migration check (every hour)
    setInterval(async () => {
      await this.migrationService.migrateAllTenants();
    }, 60 * 60 * 1000);
  }
}
```

---

## 8. Estrutura de Diretórios

```
src/
├── core/
│   ├── tenant/
│   │   ├── tenant.service.ts
│   │   ├── tenant.middleware.ts
│   │   ├── tenant-context.decorator.ts
│   │   ├── tenant-config.interface.ts
│   │   ├── tenant.exceptions.ts
│   │   └── tenant.module.ts
│   │
│   └── migrations/
│       ├── tenant-migration.service.ts
│       └── migrations/
│           ├── V1__initial_crm_tables.sql
│           ├── V2__add_erp_tables.sql
│           └── V3__add_workflow_tables.sql
│
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   ├── auth.controller.ts
│   │   └── auth.module.ts
│   │
│   ├── crm/
│   │   ├── contacts/
│   │   ├── companies/
│   │   └── deals/
│   │
│   └── erp/
│       ├── projects/
│       └── invoices/
│
├── infrastructure/
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   ├── tenant-prisma.middleware.ts
│   │   ├── prisma.service.ts
│   │   └── repositories/
│   │
│   └── database/
│       ├── migrations/
│       └── seeders/
│
└── app.module.ts
```

---

## 9. Segurança

```typescript
// security/tenant-security.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantSecurityService {
  
  // Row-Level Security (RLS) - PostgreSQL
  async enableRLS(schemaName: string): Promise<void> {
    const sql = `
      -- Enable RLS on all tables in tenant schema
      ALTER TABLE ${schemaName}.contacts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE ${schemaName}.companies ENABLE ROW LEVEL SECURITY;
      ALTER TABLE ${schemaName}.deals ENABLE ROW LEVEL SECURITY;
      ALTER TABLE ${schemaName}.projects ENABLE ROW LEVEL SECURITY;
      ALTER TABLE ${schemaName}.invoices ENABLE ROW LEVEL SECURITY;
      
      -- Create policy that filters by tenant_id
      CREATE POLICY tenant_isolation_policy ON ${schemaName}.contacts
        USING (tenant_id = current_setting('app.tenant_id')::uuid);
      
      CREATE POLICY tenant_isolation_policy ON ${schemaName}.companies
        USING (tenant_id = current_setting('app.tenant_id')::uuid);
        
      -- And so on for other tables
    `;
  }

  // Validate tenant access to resources
  async validateAccess(tenantId: string, resourceId: string, table: string): Promise<boolean> {
    const result = await this.prisma.$queryRawUnsafe(`
      SELECT 1 FROM ${table} 
      WHERE id = $1 AND tenant_id = $2 
      LIMIT 1
    `, resourceId, tenantId);
    
    return result.length > 0;
  }

  // Audit logging
  async logAccess(userId: string, tenantId: string, action: string, resource: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.audit_logs (user_id, tenant_id, action, resource, ip_address, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, userId, tenantId, action, resource, 
       // Extract from request context
       '', '');
  }
}
```

---

## 10. Performance

```typescript
// Performance optimizations

// 1. Connection Pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=10'
    }
  }
});

// 2. Query Optimization - Selective Fields
async function getContacts(tenantId: string) {
  return prisma.$queryRaw`
    SELECT id, name, email, phone, company_id, status 
    FROM ${`tenant_${tenantId.replace(/-/g, '_')}`}.contacts 
    WHERE status = 'ACTIVE'
    ORDER BY created_at DESC
    LIMIT 50
  `;
}

// 3. Indexes for tenant queries
const performanceIndexes = `
  -- Always index tenant_id as first column
  CREATE INDEX idx_contacts_tenant ON tenant_schema.contacts(tenant_id, status);
  CREATE INDEX idx_deals_tenant_stage ON tenant_schema.deals(tenant_id, stage);
  CREATE INDEX idx_projects_tenant_status ON tenant_schema.projects(tenant_id, status);
  
  -- Covering indexes for common queries
  CREATE INDEX idx_deals_tenant_pipeline ON tenant_schema.deals(tenant_id, pipeline_id, stage) 
    INCLUDE (title, value, expected_close_date);
`;

// 4. Cache strategies
const cacheConfig = {
  contacts: { ttl: 300, prefix: 'tenant:{tenantId}:contacts' },
  companies: { ttl: 600, prefix: 'tenant:{tenantId}:companies' },
  userSession: { ttl: 3600, prefix: 'session' }
};
```

---

## Resumo

| Aspecto | Implementação |
|---------|---------------|
| **Isolamento** | PostgreSQL schemas separados por tenant |
| **Onboarding** | Criação automática de schema + migrations |
| **Resolução** | Subdomain ou custom domain via middleware |
| **Autenticação** | JWT com tenant_id no payload |
| **Segurança** | RLS, política de acesso, audit log |
| **Performance** | Connection pooling, índices, cache Redis |