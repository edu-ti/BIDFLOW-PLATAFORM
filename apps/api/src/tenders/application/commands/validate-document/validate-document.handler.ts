import { ValidateTenderDocumentCommand } from './validate-document.command';
import { TenderRepository } from '../../../../../../../packages/domain/src/repositories/tender.repository';
import { IEventPublisher } from '../../ports/event-publisher.port';
import { BusinessRuleException } from '../../../../../../../packages/domain/src/exceptions';
import { randomUUID } from 'crypto';

export class ValidateTenderDocumentHandler {
  constructor(
    private readonly tenderRepository: TenderRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: ValidateTenderDocumentCommand): Promise<void> {
    const tender = await this.tenderRepository.findById(command.tenderId, command.tenantId);
    
    if (!tender) {
      throw new BusinessRuleException('Tender not found', 'TENDER_NOT_FOUND');
    }

    const document = tender.documents.find(d => d.id === command.documentId);
    if (!document) {
      throw new BusinessRuleException('Document not found in this tender', 'DOCUMENT_NOT_FOUND');
    }

    document.validateDocument(command.userId);

    // Substitui o documento atualizado na coleção do Aggregate Root (se necessário, 
    // mas attachDocument cuida disso caso a referência do array não seja modificada in-place,
    // o que é o caso porque objects são by-reference)
    tender.attachDocument(document);

    await this.tenderRepository.save(tender);

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      type: 'bidflow.tender.v1.document_validated',
      tenantId: command.tenantId,
      occurredAt: new Date().toISOString(),
      payload: {
        tenderId: command.tenderId,
        documentId: command.documentId,
        userId: command.userId,
      },
    });
  }
}
