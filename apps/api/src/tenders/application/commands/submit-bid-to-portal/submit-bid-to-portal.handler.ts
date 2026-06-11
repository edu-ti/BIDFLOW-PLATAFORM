import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SubmitBidToPortalCommand } from './submit-bid-to-portal.command';
import { IEventPublisher } from '../../ports/event-publisher.port';

@Injectable()
@CommandHandler(SubmitBidToPortalCommand)
export class SubmitBidToPortalHandler implements ICommandHandler<SubmitBidToPortalCommand> {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('TenderEventPublisher') private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: SubmitBidToPortalCommand): Promise<void> {
    const { tenderId, tenantId } = command;

    await this.prisma.$transaction(async (tx) => {
      // a. Procura o Tender, TenderProposal e o Tenant no Prisma
      const tender = await tx.tender.findUnique({
        where: { id: tenderId },
      });

      if (!tender) {
        throw new NotFoundException(`Edital com ID ${tenderId} não encontrado.`);
      }

      if (tender.tenantId !== tenantId && tender.tenantId !== 'system') {
        throw new NotFoundException('Edital não pertence a este Tenant.');
      }

      // Procura a proposta associada a este tender (assume-se a última submetida ou a mais recente)
      const proposal = await tx.tenderProposal.findFirst({
        where: { tenderId: tenderId, isSubmitted: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!proposal) {
        throw new NotFoundException(`Nenhuma proposta submetida encontrada para o edital ${tenderId}.`);
      }

      // Procura o Tenant para obter o CNPJ (Mocked since Tenant model doesn't exist in Prisma)
      const companyCnpj = '00.000.000/0001-00';

      // b. Atualiza o status da TenderProposal para 'PROCESSING_SUBMISSION'
      await tx.tenderProposal.update({
        where: { id: proposal.id },
        // Ajustar 'status' se o schema definir um nome diferente para o estado da submissão
        data: { status: 'PROCESSING_SUBMISSION' } as any,
      });

      // c. Constrói o payload para o robô
      const payload = {
        tenderExternalId: tender.externalId,
        totalValue: proposal.totalValue,
        companyCnpj: companyCnpj,
        proposalId: proposal.id,
      };

      // d. Publica esta mensagem numa fila do RabbitMQ chamada bid_submission_queue
      await this.eventPublisher.publish({
        type: 'bid_submission_queue',
        tenantId: tenantId,
        tenderId: tenderId,
        eventId: proposal.id,
        payload: payload,
      });
    });
  }
}
