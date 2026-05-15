# Segurança — BidFlow Platform

> **Propósito:** Documentar a estratégia de segurança enterprise da plataforma.

---

## Autenticação

| Método | Mecanismo | Uso |
|--------|-----------|-----|
| **JWT Access Token** | RS256, 15 min de validade | Autenticação de usuários |
| **Refresh Token** | Opaco (SHA-256), 7 dias | Renovação de sessão |
| **MFA (TOTP)** | Time-based One-Time Password | Ações críticas |
| **SSO** | OIDC (Azure AD, Google) | Login social |
| **API Key** | Chave pré-compartilhada | Integrações M2M |

## Autorização

```yaml
rbac:
  model: "RBAC hierárquico com herança"
  enforcement: "NestJS Guards"
  roles:
    SYS_ADMIN:
      description: "Acesso global a todos os tenants"
      policies: ["saas.*", "auth.*"]
      tenant_bound: false
    TENANT_ADMIN:
      description: "Acesso total ao próprio tenant"
      policies: ["*"]
      tenant_bound: true
    TENANT_MANAGER:
      description: "Gerencia recursos operacionais"
      inherits: ["TENANT_VIEWER"]
      policies: ["*.create", "*.update", "*.publish"]
    TENANT_VIEWER:
      description: "Acesso somente leitura"
      policies: ["*.read"]
    SUPPLIER:
      description: "Acesso externo restrito"
      policies: ["tender.proposal.submit", "tender.dispute.bid"]
```

## Guards (NestJS)

```
AuthGuard           → Valida JWT (assinatura, expiração)
TenantGuard         → Valida tenantId do JWT vs recurso
PermissionGuard     → Valida RBAC (via @ReflectMetadata)
RateLimitGuard      → Rate limiting por IP + usuário
MfaGuard            → Exige MFA para ações críticas
```

## Proteções por Camada

| Camada | Proteção | Tecnologia |
|--------|----------|-----------|
| **Rede** | TLS 1.3, HTTPS obrigatório | NGINX / API Gateway |
| **API** | Rate limiting, validação de entrada | @nestjs/throttler, class-validator |
| **Aplicação** | Guards, RBAC, tenant isolation | NestJS Guards |
| **Banco** | Schema-per-tenant, prepared statements | Prisma, PostgreSQL |
| **Cache** | Prefixo por tenant | Redis |
| **Filas** | Routing key por tenant | RabbitMQ |

## Validação de Entrada

```typescript
// ValidationPipe global (main.ts)
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,                    // Remove campos não decorados
  forbidNonWhitelisted: true,          // Rejeita campos extras
  transform: true,                     // Transforma tipos
}));
```

## Segurança de Dados

| Tipo | Proteção |
|------|----------|
| Senhas | bcrypt (cost factor 12) |
| Tokens | SHA-256 hash no banco |
| PII | Não logada (filtro no Logger) |
| TaxId | Criptografado em repouso |
| Secrets | Hashicorp Vault / AWS Secrets Manager |

## Compliance

| Norma | Escopo | Status |
|-------|--------|--------|
| **LGPD** | Dados pessoais de usuários brasileiros | ✅ Implementado |
| **ISO 27001** | Segurança da informação | 📋 Planejado |
| **SOC 2** | Controles de segurança | 📋 Planejado |

## Auditoria

```
Toda ação relevante gera:
1. Domain Event (publish no RabbitMQ)
2. Audit Log (tabela append-only no schema do tenant)
3. Log estruturado (JSON, com tenantId + userId)

Retenção: 365 dias (mínimo legal)
```
