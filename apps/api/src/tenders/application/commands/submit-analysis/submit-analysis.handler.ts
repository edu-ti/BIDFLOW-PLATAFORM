import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SubmitTenderAnalysisCommand } from './submit-analysis.command';

@Injectable()
@CommandHandler(SubmitTenderAnalysisCommand)
export class SubmitTenderAnalysisHandler implements ICommandHandler<SubmitTenderAnalysisCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: SubmitTenderAnalysisCommand): Promise<string> {
    const { tenderId, tenantId, analystId, dto } = command;

    return this.prisma.$transaction(async (tx) => {
      // a. Valida se o Tender existe e pertence ao tenantId
      const tender = await tx.tender.findUnique({
        where: { id: tenderId },
      });

      if (!tender) {
        throw new NotFoundException(`Edital com ID ${tenderId} não encontrado.`);
      }

      if (tender.tenantId !== tenantId && tender.tenantId !== 'system') {
        throw new NotFoundException('Edital não pertence a este Tenant.');
      }

      // b. & c. Upsert na tabela TenderAnalysis
      const analysis = await tx.tenderAnalysis.upsert({
        where: {
          tenderId_type: {
            tenderId: tenderId,
            type: 'VIABILITY',
          },
        },
        update: {
          status: 'COMPLETED',
          analystId: analystId,
          recommendation: dto.recommendation,
          riskLevel: dto.riskLevel,
          competitionLevel: dto.competitionLevel,
          conclusion: dto.conclusion,
          estimatedCost: dto.estimatedCost,
          suggestedMargin: dto.suggestedMargin,
          completedAt: new Date(),
          completedBy: analystId,
        },
        create: {
          tenderId: tenderId,
          type: 'VIABILITY',
          status: 'COMPLETED',
          analystId: analystId,
          createdBy: analystId,
          recommendation: dto.recommendation,
          riskLevel: dto.riskLevel,
          competitionLevel: dto.competitionLevel,
          conclusion: dto.conclusion,
          estimatedCost: dto.estimatedCost,
          suggestedMargin: dto.suggestedMargin,
          completedAt: new Date(),
          completedBy: analystId,
        },
      });

      // d. Se a recomendação for 'NO_GO', atualiza o status do Tender principal e da Oportunidade
      if (dto.recommendation === 'NO_GO') {
        await tx.tender.update({
          where: { id: tenderId },
          data: { status: 'ARCHIVED' }, // ou 'LOST' conforme o domínio
        });
      }

      return analysis.id;
    });
  }
}
