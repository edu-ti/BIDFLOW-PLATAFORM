import { Controller, Get, Post, Body, Param, Query, UseGuards, UseFilters, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { WorkflowPermissionGuard, PERMISSIONS_KEY } from '../guards/workflow-permission.guard';
import { CurrentTenant } from '../guards/current-tenant.decorator';
import { WorkflowExceptionFilter } from '../filters/workflow-exception.filter';
import { WorkflowLoggingInterceptor } from '../interceptors/workflow-logging.interceptor';
import {
  CreateWorkflowInstanceDto, ExecuteTransitionDto, CancelInstanceDto, ReassignDto,
  ApprovalDecisionDto, DelegateApprovalDto, CompleteWorkflowTaskDto,
} from '../dto';

import { CreateInstanceCommand, ExecuteTransitionCommand, CancelInstanceCommand, ReassignInstanceCommand, ApproveCommand, RejectCommand, DelegateApprovalCommand, CompleteTaskCommand } from '../../application/common/commands';
import { GetInstanceQuery, ListInstancesQuery, GetInstanceTimelineQuery, ListApprovalsQuery, ListTasksQuery } from '../../application/common/queries';

function ReflectMetadata(key: string, value: any): MethodDecorator {
  return (target, propertyKey, descriptor) => { Reflect.defineMetadata(key, value, descriptor.value!); };
}

@ApiTags('Workflow Instances')
@Controller('api/v1/workflow/instances')
@UseGuards(WorkflowPermissionGuard)
@UseFilters(WorkflowExceptionFilter)
@UseInterceptors(WorkflowLoggingInterceptor)
@ApiBearerAuth()
export class InstancesController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  @ApiOperation({ summary: 'Criar instância de workflow' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.create'])
  async create(@Body() dto: CreateWorkflowInstanceDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new CreateInstanceCommand(
      tenant.tenantId, dto.workflowDefinitionId, dto.entityType, dto.entityId,
      dto.title, dto.priority as any, dto.data, tenant.userId, dto.assignedTo,
    ));
  }

  @Get()
  @ApiOperation({ summary: 'Listar instâncias' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'workflowDefinitionId', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.read'])
  async findAll(
    @Query('status') status: string,
    @Query('workflowDefinitionId') defId: string,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @Query('assignedTo') assignedTo: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @CurrentTenant() tenant: any,
  ) {
    return this.queryBus.execute(new ListInstancesQuery(
      tenant.tenantId, status ? [status as any] : undefined,
      defId, entityType, entityId, assignedTo, +page, +limit,
    ));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter instância' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.read'])
  async findOne(@Param('id') id: string, @CurrentTenant() tenant: any) {
    return this.queryBus.execute(new GetInstanceQuery(id, tenant.tenantId));
  }

  @Post(':id/transition')
  @ApiOperation({ summary: 'Executar transição' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.transition'])
  async transition(@Param('id') id: string, @Body() dto: ExecuteTransitionDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new ExecuteTransitionCommand(id, dto.transitionSlug, tenant.userId, tenant.tenantId, dto.comment));
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar instância' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.cancel'])
  async cancel(@Param('id') id: string, @Body() dto: CancelInstanceDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new CancelInstanceCommand(id, dto.reason, tenant.userId, tenant.tenantId));
  }

  @Post(':id/reassign')
  @ApiOperation({ summary: 'Reatribuir responsável' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.manage'])
  async reassign(@Param('id') id: string, @Body() dto: ReassignDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new ReassignInstanceCommand(id, dto.assignedTo, tenant.tenantId, dto.roleSlug));
  }
}

@ApiTags('Workflow Approvals')
@Controller('api/v1/workflow/instances/:instanceId/approvals')
@UseGuards(WorkflowPermissionGuard)
@UseFilters(WorkflowExceptionFilter)
@UseInterceptors(WorkflowLoggingInterceptor)
@ApiBearerAuth()
export class ApprovalsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Listar aprovações' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.read'])
  async findAll(@Param('instanceId') instanceId: string, @CurrentTenant() tenant: any) {
    return this.queryBus.execute(new ListApprovalsQuery(instanceId, tenant.tenantId));
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.approve'])
  async approve(@Param('id') id: string, @Body() dto: ApprovalDecisionDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new ApproveCommand(id, tenant.userId, tenant.tenantId, dto.comment));
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rejeitar' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.approve'])
  async reject(@Param('id') id: string, @Body() dto: ApprovalDecisionDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new RejectCommand(id, tenant.userId, tenant.tenantId, dto.comment || ''));
  }

  @Post(':id/delegate')
  @ApiOperation({ summary: 'Delegar aprovação' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.approve'])
  async delegate(@Param('id') id: string, @Body() dto: DelegateApprovalDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new DelegateApprovalCommand(id, dto.delegatedTo, tenant.userId, tenant.tenantId));
  }
}

@ApiTags('Workflow Tasks')
@Controller('api/v1/workflow/instances/:instanceId/tasks')
@UseGuards(WorkflowPermissionGuard)
@UseFilters(WorkflowExceptionFilter)
@UseInterceptors(WorkflowLoggingInterceptor)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Listar tarefas' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.read'])
  async findAll(@Param('instanceId') instanceId: string, @CurrentTenant() tenant: any) {
    return this.queryBus.execute(new ListTasksQuery(instanceId, tenant.tenantId));
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Completar tarefa' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.task'])
  async complete(@Param('id') id: string, @Body() dto: CompleteWorkflowTaskDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new CompleteTaskCommand(id, tenant.userId, tenant.tenantId, dto.completedData));
  }
}

@ApiTags('Workflow Timeline')
@Controller('api/v1/workflow/instances/:instanceId/timeline')
@UseGuards(WorkflowPermissionGuard)
@UseFilters(WorkflowExceptionFilter)
@UseInterceptors(WorkflowLoggingInterceptor)
@ApiBearerAuth()
export class TimelineController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Timeline da instância' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.read'])
  async findAll(
    @Param('instanceId') instanceId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @CurrentTenant() tenant: any,
  ) {
    return this.queryBus.execute(new GetInstanceTimelineQuery(instanceId, tenant.tenantId, +limit, +offset));
  }
}
