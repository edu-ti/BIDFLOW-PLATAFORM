import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TenderAcceptedEvent } from '../../../../tenders/application/events/tender-accepted.event';

@Injectable()
@EventsHandler(TenderAcceptedEvent)
export class TenderAcceptedHandler implements IEventHandler<TenderAcceptedEvent> {
  private readonly logger = new Logger(TenderAcceptedHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: TenderAcceptedEvent) {
    this.logger.log(`Handling TenderAcceptedEvent for tender ${event.tenderId}`);
    
    try {
      await this.prisma.$transaction(async (tx) => {
        // 0. Busca o edital para herdar informações obrigatórias para a Instância do Workflow
        const tender = await tx.tender.findUnique({
          where: { id: event.tenderId },
        });

        if (!tender) {
          throw new NotFoundException(`Edital com ID ${event.tenderId} não encontrado no processamento do Workflow.`);
        }

        // a. Procura ou cria a WorkflowDefinition 'default-tender-workflow'
        let definition = await tx.workflowDefinition.findFirst({
          where: { tenantId: event.tenantId, slug: 'default-tender-workflow' },
        });

        let initialStageId: string | null = null;

        if (!definition) {
          definition = await tx.workflowDefinition.create({
            data: {
              tenantId: event.tenantId,
              name: 'Workflow de Licitação Padrão',
              slug: 'default-tender-workflow',
              entityType: 'TENDER',
              version: 1,
              isActive: true,
              createdBy: 'SYSTEM_WF',
            },
          });

          // Cria a Stage inicial associada à definição
          const stage = await tx.workflowStage.create({
            data: {
              tenantId: event.tenantId,
              workflowDefinitionId: definition.id,
              name: 'Preparação de Documentação',
              slug: 'preparacao-documentacao',
              isInitial: true,
              order: 1,
            },
          });
          initialStageId = stage.id;
        } else {
          // Se já existir, busca a stage inicial
          const stage = await tx.workflowStage.findFirst({
            where: { workflowDefinitionId: definition.id, isInitial: true },
          });
          if (stage) initialStageId = stage.id;
        }

        if (!initialStageId) throw new Error('Não foi possível encontrar ou criar Stage inicial.');

        // b. Cria a WorkflowInstance ligada a essa Definition
        const instance = await tx.workflowInstance.create({
          data: {
            tenantId: event.tenantId,
            workflowDefinitionId: definition.id,
            workflowVersion: definition.version,
            entityType: 'TENDER',
            entityId: event.tenderId,
            title: `Processo de Preparação: ${tender.title}`.substring(0, 300),
            status: 'ACTIVE',
            currentStageId: initialStageId,
            createdBy: 'SYSTEM_WF',
          },
        });

        // c. Cria a WorkflowTask automática obrigatória
        await tx.workflowTask.create({
          data: {
            tenantId: event.tenantId,
            workflowInstanceId: instance.id,
            stageId: initialStageId,
            title: 'Reunir e validar documentação de habilitação',
            type: 'ACTION',
            status: 'PENDING',
            isMandatory: true,
          },
        });

        // d. Atualiza o Tender com o ID desta nova instância de workflow
        await tx.tender.update({
          where: { id: event.tenderId },
          data: { workflowInstanceId: instance.id },
        });

        this.logger.log(`Workflow número [${instance.id}] iniciado com sucesso para o edital ${event.tenderId}`);
      });
    } catch (error) {
      this.logger.error(`Erro ao iniciar workflow para o edital ${event.tenderId}:`, error);
    }
  }
}
