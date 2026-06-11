import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateTenderProposalCommand } from './create-proposal.command';

@Injectable()
@CommandHandler(CreateTenderProposalCommand)
export class CreateTenderProposalHandler implements ICommandHandler<CreateTenderProposalCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateTenderProposalCommand): Promise<string> {
    const { tenderId, tenantId, createdBy, dto } = command;

    return this.prisma.$transaction(async (tx) => {
      // a. Valida se o Tender existe
      const tender = await tx.tender.findUnique({
        where: { id: tenderId },
      });

      if (!tender) {
        throw new NotFoundException(`Edital com ID ${tenderId} não encontrado.`);
      }

      if (tender.tenantId !== tenantId && tender.tenantId !== 'system') {
        throw new NotFoundException('Edital não pertence a este Tenant.');
      }

      // Verifica se já existe uma proposta submetida
      const existingProposal = await tx.tenderProposal.findFirst({
        where: { tenderId: tenderId, isSubmitted: true },
      });

      if (existingProposal) {
        throw new BadRequestException('Já existe uma proposta submetida para este edital.');
      }

      // Calcula a próxima versão se existirem rascunhos
      const count = await tx.tenderProposal.count({ where: { tenderId } });
      const version = count + 1;

      // b. Cria o registo na tabela TenderProposal
      const proposal = await tx.tenderProposal.create({
        data: {
          tenderId: tenderId,
          version: version,
          totalValue: dto.totalValue,
          observations: dto.notes,
          itemValues: dto.items ? (dto.items as any) : null,
          createdBy: createdBy,
          isSubmitted: true,
          submittedAt: new Date(),
          submittedBy: createdBy,
        },
      });

      // Atualiza o status do edital para indicar que a proposta foi submetida
      await tx.tender.update({
        where: { id: tenderId },
        data: { status: 'SUBMITTED' }, 
      });

      return proposal.id;
    });
  }
}
