import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AcceptTenderCommand } from './accept-tender.command';
import { TenderAcceptedEvent } from '../../events/tender-accepted.event';

@Injectable()
@CommandHandler(AcceptTenderCommand)
export class AcceptTenderHandler implements ICommandHandler<AcceptTenderCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AcceptTenderCommand): Promise<any> {
    const { tenderId, tenantId } = command;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Verifica se o Tender existe e pertence ao tenantId
      const tender = await tx.tender.findUnique({
        where: { id: tenderId },
      });

      if (!tender) {
        throw new NotFoundException(`Edital com ID ${tenderId} não encontrado.`);
      }
      
      if (tender.tenantId !== tenantId && tender.tenantId !== 'system') {
        throw new NotFoundException('Edital não pertence a este Tenant.');
      }

      // 2. Atualiza o status do Tender para ANALYZING
      await tx.tender.update({
        where: { id: tenderId },
        data: { status: 'ANALYZING' },
      });

      // 3. Procura o pipeline padrão do Tenant ou cria um base
      let pipeline = await tx.pipeline.findFirst({
        where: { 
          tenantId: tenantId, 
          isDefault: true 
        },
      });

      if (!pipeline) {
        pipeline = await tx.pipeline.create({
          data: {
            tenantId: tenantId,
            name: 'Funil de Licitações',
            slug: 'licitacoes-default',
            isDefault: true,
          },
        });
      }

      // 4. Cria um registo na tabela Opportunity
      const opportunity = await tx.opportunity.create({
        data: {
          tenantId: tenantId,
          pipelineId: pipeline.id,
          title: `Licitação: ${tender.title}`,
          estimatedValue: tender.estimatedValue || 0,
          status: 'OPEN',
          stage: 'QUALIFICACAO',
          stageOrder: 1,
        },
      });

      return {
        success: true,
        message: 'Edital aceite e convertido em Oportunidade com sucesso.',
        opportunityId: opportunity.id,
        tenderId: tender.id,
        tenantId: tenantId
      };
    });

    this.eventBus.publish(
      new TenderAcceptedEvent(result.tenderId, result.tenantId, result.opportunityId)
    );

    return result;
  }
}