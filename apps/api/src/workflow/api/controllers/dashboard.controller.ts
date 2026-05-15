import { Controller, Get, UseGuards, UseFilters, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { WorkflowPermissionGuard, PERMISSIONS_KEY } from '../guards/workflow-permission.guard';
import { CurrentTenant } from '../guards/current-tenant.decorator';
import { WorkflowExceptionFilter } from '../filters/workflow-exception.filter';
import { WorkflowLoggingInterceptor } from '../interceptors/workflow-logging.interceptor';
import { GetSummaryQuery, GetMyPendingItemsQuery, GetOverdueInstancesQuery } from '../../application/common/queries';

function ReflectMetadata(key: string, value: any): MethodDecorator {
  return (target, propertyKey, descriptor) => { Reflect.defineMetadata(key, value, descriptor.value!); };
}

@ApiTags('Workflow Dashboard')
@Controller('api/v1/workflow/dashboard')
@UseGuards(WorkflowPermissionGuard)
@UseFilters(WorkflowExceptionFilter)
@UseInterceptors(WorkflowLoggingInterceptor)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo do workflow engine' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.read'])
  async summary(@CurrentTenant() tenant: any) {
    return this.queryBus.execute(new GetSummaryQuery(tenant.tenantId));
  }

  @Get('my-pending')
  @ApiOperation({ summary: 'Minhas pendências (aprovações + tarefas)' })
  async myPending(@CurrentTenant() tenant: any) {
    return this.queryBus.execute(new GetMyPendingItemsQuery(tenant.userId, tenant.tenantId));
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Instâncias com deadline vencido' })
  @ReflectMetadata(PERMISSIONS_KEY, ['workflow.instance.read'])
  async overdue(@CurrentTenant() tenant: any) {
    return this.queryBus.execute(new GetOverdueInstancesQuery(tenant.tenantId));
  }
}
