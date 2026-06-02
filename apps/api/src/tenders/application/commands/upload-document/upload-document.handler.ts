import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UploadTenderDocumentCommand } from './upload-document.command';

@Injectable()
@CommandHandler(UploadTenderDocumentCommand)
export class UploadTenderDocumentHandler implements ICommandHandler<UploadTenderDocumentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UploadTenderDocumentCommand): Promise<string> {
    const { tenderId, userId, file, dto } = command;

    return this.prisma.$transaction(async (tx) => {
      // a. Valida se o Tender existe
      const tender = await tx.tender.findUnique({
        where: { id: tenderId },
      });

      if (!tender) {
        throw new NotFoundException(`Edital com ID ${tenderId} não encontrado.`);
      }

      // b. (Simulação de Storage)
      const fileUrl = `https://storage.fake/${encodeURIComponent(file.originalname)}`;
      const fileSize = file.size;

      // c. Cria o registo em TenderDocument
      const document = await tx.tenderDocument.create({
        data: {
          tenderId: tenderId,
          checklistItemId: dto.checklistItemId || null,
          category: dto.category,
          title: file.originalname,
          fileName: file.originalname,
          fileSize: fileSize,
          fileType: file.mimetype,
          fileUrl: fileUrl,
          uploadedBy: userId,
          status: 'PENDING',
        },
      });

      // d. Se houver um checklistItemId, atualiza o status desse TenderChecklist
      if (dto.checklistItemId) {
        await tx.tenderChecklist.update({
          where: { id: dto.checklistItemId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            completedBy: userId,
          },
        });
      }

      return document.id;
    });
  }
}
