import { ValidateTenderDocumentHandler } from '../../../../src/tenders/application/commands/validate-document/validate-document.handler';
import { ValidateTenderDocumentCommand } from '../../../../src/tenders/application/commands/validate-document/validate-document.command';
import { TenderRepository } from '../../../../../../packages/domain/src/repositories/tender.repository';
import { IEventPublisher } from '../../../../src/tenders/application/ports/event-publisher.port';
import { Tender, TenderProps } from '../../../../../../packages/domain/src/tenders/tender.aggregate';
import { TenderDocument, DocumentStatus } from '../../../../../../packages/domain/src/tenders/entities/tender-document.entity';
import { TenderDocumentType } from '../../../../../../packages/domain/src/tenders/value-objects/checklist-requirement.vo';
import { BusinessRuleException } from '../../../../../../packages/domain/src/exceptions';

describe('ValidateTenderDocumentHandler', () => {
  let handler: ValidateTenderDocumentHandler;
  let mockTenderRepo: jest.Mocked<TenderRepository>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;

  beforeEach(() => {
    mockTenderRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      exists: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      findDeleted: jest.fn(),
      findByExternalId: jest.fn(),
      findPaginated: jest.fn(),
    };

    mockEventPublisher = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    handler = new ValidateTenderDocumentHandler(mockTenderRepo, mockEventPublisher);
  });

  it('deve barrar a manipulação se o edital não for encontrado', async () => {
    mockTenderRepo.findById.mockResolvedValue(null);

    const command = new ValidateTenderDocumentCommand(
      'tender-1',
      'tenant-123',
      'admin-1',
      'doc-1'
    );

    await expect(handler.execute(command)).rejects.toThrow(BusinessRuleException);
    await expect(handler.execute(command)).rejects.toThrow('Tender not found');
    expect(mockTenderRepo.save).not.toHaveBeenCalled();
  });

  it('deve barrar a manipulação se o documento não existir no edital', async () => {
    const tenderProps: TenderProps = {
      id: 'tender-1',
      tenantId: 'tenant-123',
      source: 'MANUAL',
      number: '001/2026',
      organization: 'Gov',
      modality: 'PREGAO_ELETRONICO',
      type: 'MENOR_PRECO',
      status: 'CAPTURED',
      title: 'Edital Teste',
      currency: 'BRL',
      openingDate: new Date('2026-05-01'),
      closingDate: new Date('2026-06-01'),
      createdBy: 'user-1',
    };
    const tender = new Tender(tenderProps);
    mockTenderRepo.findById.mockResolvedValue(tender);

    const command = new ValidateTenderDocumentCommand(
      'tender-1',
      'tenant-123',
      'admin-1',
      'doc-404'
    );

    await expect(handler.execute(command)).rejects.toThrow(BusinessRuleException);
    await expect(handler.execute(command)).rejects.toThrow('Document not found in this tender');
  });

  it('deve validar o documento e publicar o evento', async () => {
    const tenderProps: TenderProps = {
      id: 'tender-1',
      tenantId: 'tenant-123',
      source: 'MANUAL',
      number: '001/2026',
      organization: 'Gov',
      modality: 'PREGAO_ELETRONICO',
      type: 'MENOR_PRECO',
      status: 'CAPTURED',
      title: 'Edital Teste',
      currency: 'BRL',
      openingDate: new Date('2026-05-01'),
      closingDate: new Date('2026-06-01'),
      createdBy: 'user-1',
    };
    const tender = new Tender(tenderProps);
    
    const doc = new TenderDocument({
      id: 'doc-1',
      tenderId: 'tender-1',
      tenantId: 'tenant-123',
      type: TenderDocumentType.LEGAL,
      title: 'CNPJ',
      status: DocumentStatus.UPLOADED,
      fileUrl: 'http://s3/cnpj.pdf'
    });
    tender.attachDocument(doc);

    mockTenderRepo.findById.mockResolvedValue(tender);

    const command = new ValidateTenderDocumentCommand(
      'tender-1',
      'tenant-123',
      'admin-1',
      'doc-1'
    );

    await handler.execute(command);

    expect(mockTenderRepo.save).toHaveBeenCalledWith(tender);
    expect(tender.documents[0].status).toBe(DocumentStatus.VALIDATED);
    expect(tender.documents[0].metadata.validatedBy).toBe('admin-1');

    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'bidflow.tender.v1.document_validated',
        tenantId: 'tenant-123',
        payload: expect.objectContaining({
          tenderId: 'tender-1',
          documentId: 'doc-1',
          userId: 'admin-1',
        }),
      })
    );
  });
});
