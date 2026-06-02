import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetKanbanBoardQuery } from './get-kanban-board.query';

@Injectable()
@QueryHandler(GetKanbanBoardQuery)
export class GetKanbanBoardHandler implements IQueryHandler<GetKanbanBoardQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetKanbanBoardQuery): Promise<any> {
    const { tenantId, pipelineId } = query;

    // a. Procura o pipeline (ou o padrão se não fornecido)
    let pipeline;
    if (pipelineId && pipelineId !== 'default') {
      pipeline = await this.prisma.pipeline.findUnique({
        where: { id: pipelineId },
      });
    } else {
      pipeline = await this.prisma.pipeline.findFirst({
        where: { tenantId, isDefault: true, isActive: true },
      });
    }

    if (!pipeline || pipeline.tenantId !== tenantId) {
      throw new NotFoundException('Pipeline não encontrado.');
    }

    // b. Faz a query das oportunidades ativas
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        tenantId,
        pipelineId: pipeline.id,
        status: {
          notIn: ['LOST', 'ABANDONED'], // Queremos apenas OPEN, WON
        },
      },
      orderBy: {
        stageOrder: 'asc', // ou createdAt: 'desc' se preferires por mais recentes dentro da coluna
      },
    });

    // c. Extrai as fases do Pipeline JSON
    // Se no teu sistema o `stages` for guardado como [{"id":"QUALIFICACAO","name":"Qualificação"}], podes extrair:
    let stagesDefinition: any[] = [];
    if (pipeline.stages && Array.isArray(pipeline.stages)) {
      stagesDefinition = pipeline.stages;
    } else {
      // Agrupamento dinâmico fallback
      const uniqueStages = [...new Set(opportunities.map(o => o.stage))];
      stagesDefinition = uniqueStages.map((stage, index) => ({
        id: stage,
        name: stage,
        order: index
      }));
    }

    // d. Transforma os dados no formato de resposta do Kanban
    const columns = stagesDefinition.map(stageDef => {
      const stageId = stageDef.id || stageDef.name;
      const title = stageDef.name || stageDef.id;
      
      const oppsInStage = opportunities
        .filter(opp => opp.stage === stageId)
        // Ordenação extra interna por createdAt decrescente (mais recentes primeiro)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        stageId: stageId,
        title: title,
        order: stageDef.order || 0,
        opportunities: oppsInStage.map(opp => ({
          id: opp.id,
          title: opp.title,
          estimatedValue: Number(opp.estimatedValue),
          currency: opp.currency,
          status: opp.status,
          probability: opp.probability,
          tenderId: opp.tenderId,
          createdAt: opp.createdAt,
        })),
        totalValue: oppsInStage.reduce((acc, curr) => acc + Number(curr.estimatedValue || 0), 0),
        count: oppsInStage.length,
      };
    });

    return {
      pipeline: {
        id: pipeline.id,
        name: pipeline.name,
      },
      columns: columns.sort((a, b) => a.order - b.order),
    };
  }
}
