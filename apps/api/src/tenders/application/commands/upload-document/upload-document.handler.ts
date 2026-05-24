import { UploadTenderDocumentCommand } from './upload-document.command';
import { TenderRepository } from '../../../../../../../packages/domain/src/repositories/tender.repository';
import { IEventPublisher } from '../../ports/event-publisher.port';
import { TenderDocument, DocumentStatus } from '../../../../../../../packages/domain/src/tenders/entities/tender-document.entity';
import { BusinessRuleException } from '../../../../../../../packages/domain/src/exceptions';
import { randomUUID } from 'crypto';

export class UploadTenderDocumentHandler {
  constructor(
    private readonly tenderRepository: TenderRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: UploadTenderDocumentCommand): Promise<string> {
    const tender = await this.tenderRepository.findById(command.tenderId, command.tenantId);
    
    if (!tender) {
      throw new BusinessRuleException('Tender not found', 'TENDER_NOT_FOUND');
    }

    const documentId = randomUUID();

    const document = new TenderDocument({
      id: documentId,
      tenderId: command.tenderId,
      tenantId: command.tenantId,
      type: command.type,
      title: command.title,
      status: DocumentStatus.PENDING,
      metadata: { uploadedBy: command.userId },
    });

    document.uploadFile(command.fileUrl, command.expiresAt || null);

    tender.attachDocument(document);

    await this.tenderRepository.save(tender);

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      type: 'bidflow.tender.v1.document_uploaded',
      tenantId: command.tenantId,
      occurredAt: new Date().toISOString(),
      payload: {
        tenderId: command.tenderId,
        documentId: document.id,
        type: command.type,
        userId: command.userId,
      },
    });

    return documentId;
  }
}
