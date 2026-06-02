import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentTenant } from '../../../workflow/api/guards/current-tenant.decorator';
import { GetKanbanBoardQuery } from '../../application/queries/get-kanban-board/get-kanban-board.query';

// NOTA: Usa o teu próprio AuthGuard se necessário, aqui assumo a mecânica que já existe nos outros módulos
@ApiTags('CRM - Pipelines')
@ApiBearerAuth()
@Controller('v1/crm/pipelines')
export class PipelineController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id/kanban')
  @ApiOperation({ summary: 'Obtém o quadro Kanban de um pipeline (use "default" para o principal)' })
  @ApiResponse({ status: 200, description: 'Quadro Kanban com colunas e oportunidades' })
  async getKanbanBoard(
    @Param('id') pipelineId: string,
    @CurrentTenant() tenant: any,
  ) {
    const query = new GetKanbanBoardQuery(tenant.tenantId, pipelineId);
    return this.queryBus.execute(query);
  }
}
