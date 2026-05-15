# Workflow Engine — API Layer Enterprise

> **API Layer** — Interface HTTP do Workflow Engine. Controllers, DTOs, Guards, Filters, Interceptors e Swagger.

---

## 1. Estrutura de Pastas (9 arquivos)

```
api/
├── index.ts                                              # Barrel export
├── dto/index.ts                                          # 11 DTOs de validação HTTP
├── controllers/
│   ├── definition.controller.ts                          # DefinitionsController + StagesController + TransitionsController
│   ├── instance.controller.ts                            # InstancesController + ApprovalsController + TasksController + TimelineController
│   └── dashboard.controller.ts                           # DashboardController
├── guards/
│   ├── workflow-permission.guard.ts                      # RBAC via @ReflectMetadata
│   └── current-tenant.decorator.ts                       # @CurrentTenant() decorator
├── filters/
│   └── workflow-exception.filter.ts                      # ExceptionFilter enterprise
└── interceptors/
    └── workflow-logging.interceptor.ts                   # Logging com correlationId
```

---

## 2. 8 Controllers — 29 Endpoints

### DefinitionsController
| Método | Rota | Ação | Permissão |
|--------|------|------|-----------|
| `POST` | `/api/v1/workflow/definitions` | Criar definição | `workflow.definition.create` |
| `GET` | `/api/v1/workflow/definitions` | Listar definições | `workflow.definition.read` |
| `GET` | `/api/v1/workflow/definitions/:id` | Obter definição | `workflow.definition.read` |
| `PATCH` | `/api/v1/workflow/definitions/:id` | Atualizar definição | `workflow.definition.update` |
| `POST` | `/api/v1/workflow/definitions/:id/publish` | Publicar | `workflow.definition.publish` |
| `POST` | `/api/v1/workflow/definitions/:id/version` | Nova versão | `workflow.definition.create` |
| `DELETE` | `/api/v1/workflow/definitions/:id` | Remover | `workflow.definition.delete` |

### StagesController
| Método | Rota | Ação | Permissão |
|--------|------|------|-----------|
| `POST` | `.../:definitionId/stages` | Criar estágio | `workflow.definition.update` |
| `GET` | `.../:definitionId/stages` | Listar estágios | `workflow.definition.read` |
| `PATCH` | `.../stages/:id` | Atualizar estágio | `workflow.definition.update` |
| `DELETE` | `.../stages/:id` | Remover estágio | `workflow.definition.update` |

### TransitionsController
| Método | Rota | Ação | Permissão |
|--------|------|------|-----------|
| `POST` | `.../:definitionId/transitions` | Criar transição | `workflow.definition.update` |
| `GET` | `.../:definitionId/transitions` | Listar transições | `workflow.definition.read` |
| `DELETE` | `.../transitions/:id` | Remover transição | `workflow.definition.update` |

### InstancesController
| Método | Rota | Ação | Permissão |
|--------|------|------|-----------|
| `POST` | `/api/v1/workflow/instances` | **Iniciar workflow** | `workflow.instance.create` |
| `GET` | `/api/v1/workflow/instances` | Listar instâncias | `workflow.instance.read` |
| `GET` | `/api/v1/workflow/instances/:id` | Obter instância | `workflow.instance.read` |
| `POST` | `/api/v1/workflow/instances/:id/transition` | **Transicionar estágio** | `workflow.instance.transition` |
| `POST` | `/api/v1/workflow/instances/:id/cancel` | **Cancelar workflow** | `workflow.instance.cancel` |
| `POST` | `/api/v1/workflow/instances/:id/reassign` | Reatribuir | `workflow.instance.manage` |

### ApprovalsController
| Método | Rota | Ação | Permissão |
|--------|------|------|-----------|
| `GET` | `.../instances/:instanceId/approvals` | **Consultar approvals** | `workflow.instance.read` |
| `POST` | `.../approvals/:id/approve` | **Aprovar workflow** | `workflow.instance.approve` |
| `POST` | `.../approvals/:id/reject` | **Rejeitar workflow** | `workflow.instance.approve` |
| `POST` | `.../approvals/:id/delegate` | Delegar aprovação | `workflow.instance.approve` |

### TasksController
| Método | Rota | Ação | Permissão |
|--------|------|------|-----------|
| `GET` | `.../instances/:instanceId/tasks` | **Listar tarefas** | `workflow.instance.read` |
| `POST` | `.../tasks/:id/complete` | **Concluir tarefa** | `workflow.instance.task` |

### TimelineController
| Método | Rota | Ação | Permissão |
|--------|------|------|-----------|
| `GET` | `.../instances/:instanceId/timeline` | **Consultar timeline** | `workflow.instance.read` |

### DashboardController
| Método | Rota | Ação |
|--------|------|------|
| `GET` | `/api/v1/workflow/dashboard/summary` | Resumo do workflow |
| `GET` | `/api/v1/workflow/dashboard/my-pending` | Minhas pendências |
| `GET` | `/api/v1/workflow/dashboard/overdue` | Instâncias vencidas |

---

## 3. 11 DTOs HTTP (class-validator)

| DTO | Campos | Validações |
|-----|--------|-----------|
| `CreateWorkflowDefinitionDto` | name, slug, entityType, description?, icon?, color?, maxConcurrentInstances?, metadata? | @IsString(), @IsOptional(), @IsUUID(), @IsInt(), @Min(1) |
| `UpdateWorkflowDefinitionDto` | name?, description?, icon?, color?, isActive?, maxConcurrentInstances? | @IsOptional(), @IsString(), @IsBoolean(), @IsInt() |
| `CreateStageDto` | slug, name, order, type, isInitial?, isFinal?, approvalConfig?, deadlineHours?, ... (16 param) | @IsString(), @IsInt(), @Min(1), @IsEnum(), @IsOptional(), @IsBoolean(), @IsObject() |
| `CreateTransitionDto` | slug, name, fromStageId, toStageId, conditions?, permissions?, isAutomatic?, autoTriggerEvent? | @IsString(), @IsUUID(), @IsOptional(), @IsBoolean() |
| `CreateWorkflowInstanceDto` | workflowDefinitionId, entityType, entityId, title, priority?, data?, assignedTo? | @IsUUID(), @IsString(), @IsOptional(), @IsEnum() |
| `ExecuteTransitionDto` | transitionSlug, comment? | @IsString(), @IsOptional() |
| `CancelInstanceDto` | reason | @IsString() |
| `ReassignDto` | assignedTo, roleSlug? | @IsUUID(), @IsOptional(), @IsString() |
| `ApprovalDecisionDto` | comment? | @IsOptional(), @IsString() |
| `DelegateApprovalDto` | delegatedTo, reason? | @IsUUID(), @IsOptional(), @IsString() |
| `CompleteWorkflowTaskDto` | completedData? | @IsOptional(), @IsObject() |

---

## 4. Guards

### WorkflowPermissionGuard (RBAC)
```typescript
// Uso: @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.transition'])
// Lê metadata da rota e verifica permissão do usuário JWT
@Injectable()
export class WorkflowPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY, [context.getHandler(), context.getClass()]
    );
    if (!requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest();
    if (!request.user) throw new ForbiddenException('User not authenticated');
    return true;
  }
}
```

### @CurrentTenant() Decorator
```typescript
// Uso: @CurrentTenant() tenant: { tenantId: string; userId: string }
// Extrai tenantId do header x-tenant-id ou JWT
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      tenantId: request.headers['x-tenant-id'] || request.user?.tenantId,
      userId: request.user?.sub || request.user?.id,
    };
  },
);
```

---

## 5. Exception Filter Enterprise

```typescript
@Catch()
export class WorkflowExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    let status = 500, code = 'INTERNAL_ERROR', message = 'Unexpected error';

    if (exception instanceof DomainError) {
      status = exception.statusCode;    // 404, 422, 403, 409, 429
      code = exception.code;            // WF_DEF_NOT_FOUND, WF_INVALID_TRANSITION, etc.
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      code = 'HTTP_ERROR';
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

---

## 6. Logging Interceptor

```typescript
@Injectable()
export class WorkflowLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId = uuid();
    const start = Date.now();
    request.correlationId = correlationId;

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${method} ${url} ${duration}ms`, {
          method, url, duration, correlationId, tenantId: request.headers['x-tenant-id'],
        }),
        error: (error) => this.logger.error(`${method} ${url} - ${error.message}`, {
          method, url, duration, correlationId, status: error.status,
        }),
      }),
    );
  }
}
```

---

## 7. Exemplos de Request/Response

### Iniciar Workflow
```http
POST /api/v1/workflow/instances
Authorization: Bearer <jwt>
x-tenant-id: 770e8400-e29b-41d4-a716-446655440000

{
  "workflowDefinitionId": "660e8400-e29b-41d4-a716-446655440000",
  "entityType": "bidding.rfp",
  "entityId": "880e8400-e29b-41d4-a716-446655440000",
  "title": "Aprovação RFP #001",
  "priority": "HIGH"
}

→ 201 Created
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "workflowDefinitionId": "660e8400-e29b-41d4-a716-446655440000",
  "entityType": "bidding.rfp",
  "entityId": "880e8400-e29b-41d4-a716-446655440000",
  "title": "Aprovação RFP #001",
  "status": "ACTIVE",
  "currentStage": "inicio",
  "priority": "HIGH",
  "createdAt": "2026-05-15T10:00:00.000Z"
}
```

### Transicionar Estágio
```http
POST /api/v1/workflow/instances/990e8400/transition
Authorization: Bearer <jwt>
x-tenant-id: 770e8400-e29b-41d4-a716-446655440000

{
  "transitionSlug": "enviar_revisao",
  "comment": "Documentação completa, segue para revisão"
}

→ 200 OK
{
  "id": "990e8400",
  "status": "ACTIVE",
  "currentStage": "revisao",
  "enteredStageAt": "2026-05-15T10:05:00.000Z",
  "deadlineAt": "2026-05-16T10:05:00.000Z"
}
```

### Aprovar Workflow
```http
POST /api/v1/workflow/instances/990e8400/approvals/110e8400/approve
Authorization: Bearer <jwt>

{ "comment": "Documentação aprovada" }

→ 200 OK
{
  "id": "110e8400",
  "status": "APPROVED",
  "decision": "APPROVED",
  "decidedAt": "2026-05-15T14:00:00.000Z"
}
```

### Erro Padrão
```http
→ 422 Unprocessable Entity
{
  "statusCode": 422,
  "code": "WF_APPROVALS_PENDING",
  "message": "Approvals are pending for current stage",
  "timestamp": "2026-05-15T10:00:00.000Z",
  "path": "/api/v1/workflow/instances/990e8400/transition"
}
```

---

## 8. Módulo NestJS (WorkflowModule)

```typescript
@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [
    DefinitionsController, StagesController, TransitionsController,
    InstancesController, ApprovalsController, TasksController,
    TimelineController, DashboardController,
  ],
  providers: [
    // 9 Repositories
    { provide: WorkflowDefinitionRepository, useClass: PrismaWorkflowDefinitionRepository },
    { provide: StageRepository, useClass: PrismaStageRepository },
    { provide: TransitionRepository, useClass: PrismaTransitionRepository },
    { provide: WorkflowInstanceRepository, useClass: PrismaWorkflowInstanceRepository },
    { provide: TransitionLogRepository, useClass: PrismaTransitionLogRepository },
    { provide: ApprovalRepository, useClass: PrismaApprovalRepository },
    { provide: WorkflowAssignmentRepository, useClass: PrismaWorkflowAssignmentRepository },
    { provide: WorkflowTaskRepository, useClass: PrismaWorkflowTaskRepository },
    { provide: WorkflowTimelineEntryRepository, useClass: PrismaWorkflowTimelineEntryRepository },

    // 4 Domain Services
    DagValidatorService, WorkflowInstanceFactory, ApprovalEngine, TransitionValidator,

    // 3 Orchestrators
    DefinitionPublishingService, DefinitionStageService, DefinitionTransitionService,
    InstanceOrchestrationService, ApprovalOrchestrationService,

    // 14 Command Handlers + 13 Query Handlers
    ...commandHandlers, ...queryHandlers,

    // Infrastructure
    WorkflowEventPublisher, RabbitMqEventPublisher, WorkflowObservabilityService,
    WorkflowPermissionGuard,
  ],
})
export class WorkflowModule {}
```

A API Layer está completa com **29 endpoints REST**, validação via class-validator, RBAC via guards, tratamento padronizado de erros (20 domain errors → HTTP status code), logging com correlationId e suporte multi-tenant via `@CurrentTenant()` decorator.
