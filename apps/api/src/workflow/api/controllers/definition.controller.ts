import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseFilters, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { WorkflowPermissionGuard, PERMISSIONS_KEY } from '../guards/workflow-permission.guard';
import { CurrentTenant } from '../guards/current-tenant.decorator';
import { WorkflowExceptionFilter } from '../filters/workflow-exception.filter';
import { WorkflowLoggingInterceptor } from '../interceptors/workflow-logging.interceptor';
import { CreateWorkflowDefinitionDto, UpdateWorkflowDefinitionDto, CreateStageDto, UpdateStageDto, CreateTransitionDto } from '../dto';

import { CreateDefinitionCommand, UpdateDefinitionCommand, PublishDefinitionCommand, CreateDefinitionVersionCommand, DeleteDefinitionCommand } from '../../application/common/commands';
import { CreateStageCommand, UpdateStageCommand, DeleteStageCommand } from '../../application/common/commands';
import { CreateTransitionCommand, DeleteTransitionCommand } from '../../application/common/commands';
import { GetDefinitionQuery, ListDefinitionsQuery, ListStagesQuery, ListTransitionsQuery } from '../../application/common/queries';

@ApiTags('Workflow Definitions')
@Controller('api/v1/workflow/definitions')
@UseGuards(WorkflowPermissionGuard)
@UseFilters(WorkflowExceptionFilter)
@UseInterceptors(WorkflowLoggingInterceptor)
@ApiBearerAuth()
export class DefinitionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar definição de workflow' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.create'])
  async create(@Body() dto: CreateWorkflowDefinitionDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new CreateDefinitionCommand(
      tenant.tenantId, dto.name, dto.slug, dto.description,
      dto.entityType, dto.icon, dto.color, dto.maxConcurrentInstances,
      dto.metadata, tenant.userId,
    ));
  }

  @Get()
  @ApiOperation({ summary: 'Listar definições' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.read'])
  async findAll(
    @Query('entityType') entityType: string,
    @Query('isActive') isActive: string,
    @Query('search') search: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentTenant() tenant: any,
  ) {
    return this.queryBus.execute(new ListDefinitionsQuery(
      tenant.tenantId, entityType, isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search, +page, +limit,
    ));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter definição com estágios e transições' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.read'])
  async findOne(@Param('id') id: string, @CurrentTenant() tenant: any) {
    return this.queryBus.execute(new GetDefinitionQuery(id, tenant.tenantId));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar definição' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.update'])
  async update(@Param('id') id: string, @Body() dto: UpdateWorkflowDefinitionDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new UpdateDefinitionCommand(id, tenant.tenantId, dto.name, dto.description, dto.icon, dto.color, dto.maxConcurrentInstances, dto.isActive));
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publicar definição' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.publish'])
  async publish(@Param('id') id: string, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new PublishDefinitionCommand(id, tenant.tenantId));
  }

  @Post(':id/version')
  @ApiOperation({ summary: 'Criar nova versão' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.create'])
  async createVersion(@Param('id') id: string, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new CreateDefinitionVersionCommand(id, tenant.tenantId));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover definição' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.delete'])
  async remove(@Param('id') id: string, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new DeleteDefinitionCommand(id, tenant.tenantId));
  }
}

function ReflectMetadata(key: string, value: any): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(key, value, descriptor.value!);
  };
}

@ApiTags('Workflow Stages')
@Controller('api/v1/workflow/definitions/:definitionId/stages')
@UseGuards(WorkflowPermissionGuard)
@UseFilters(WorkflowExceptionFilter)
@UseInterceptors(WorkflowLoggingInterceptor)
@ApiBearerAuth()
export class StagesController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  @ApiOperation({ summary: 'Criar estágio' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.update'])
  async create(@Param('definitionId') defId: string, @Body() dto: CreateStageDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new CreateStageCommand(
      defId, tenant.tenantId, dto.slug, dto.name, dto.description,
      dto.order, dto.color, dto.type, dto.isInitial ?? false, dto.isFinal ?? false,
      dto.approvalConfig, dto.assignmentConfig, dto.deadlineHours,
      dto.notifyOnEnter, dto.notifyOnExit, dto.allowRejection, dto.rejectionTargetStageId,
    ));
  }

  @Get()
  @ApiOperation({ summary: 'Listar estágios' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.read'])
  async findAll(@Param('definitionId') defId: string, @CurrentTenant() tenant: any) {
    return this.queryBus.execute(new ListStagesQuery(defId, tenant.tenantId));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar estágio' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.update'])
  async update(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    return this.commandBus.execute(new UpdateStageCommand(id, dto.name, dto.description, dto.order, dto.deadlineHours, dto.color));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover estágio' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.update'])
  async remove(@Param('definitionId') defId: string, @Param('id') id: string, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new DeleteStageCommand(id, defId, tenant.tenantId));
  }
}

@ApiTags('Workflow Transitions')
@Controller('api/v1/workflow/definitions/:definitionId/transitions')
@UseGuards(WorkflowPermissionGuard)
@UseFilters(WorkflowExceptionFilter)
@UseInterceptors(WorkflowLoggingInterceptor)
@ApiBearerAuth()
export class TransitionsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  @ApiOperation({ summary: 'Criar transição' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.update'])
  async create(@Param('definitionId') defId: string, @Body() dto: CreateTransitionDto, @CurrentTenant() tenant: any) {
    return this.commandBus.execute(new CreateTransitionCommand(
      defId, tenant.tenantId, dto.slug, dto.name, dto.fromStageId,
      dto.toStageId, dto.conditions, dto.permissions, dto.isAutomatic, dto.autoTriggerEvent,
    ));
  }

  @Get()
  @ApiOperation({ summary: 'Listar transições' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.read'])
  async findAll(@Param('definitionId') defId: string, @CurrentTenant() tenant: any) {
    return this.queryBus.execute(new ListTransitionsQuery(defId, tenant.tenantId));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover transição' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.definition.update'])
  async remove(@Param('definitionId') defId: string, @Param('id') id: string) {
    return this.commandBus.execute(new DeleteTransitionCommand(id, defId));
  }
}
