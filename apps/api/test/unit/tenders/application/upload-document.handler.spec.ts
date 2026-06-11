// @ts-nocheck
import { UploadTenderDocumentHandler } from '../../../../src/tenders/application/commands/upload-document/upload-document.handler';
import { UploadTenderDocumentCommand } from '../../../../src/tenders/application/commands/upload-document/upload-document.command';
import { TenderRepository } from '../../../../../../packages/domain/src/repositories/tender.repository';
import { IEventPublisher } from '../../../../src/tenders/application/ports/event-publisher.port';
import { Tender, TenderProps } from '../../../../../../packages/domain/src/tenders/tender.aggregate';
import { TenderDocumentType } from '../../../../../../packages/domain/src/tenders/value-objects/checklist-requirement.vo';
import { BusinessRuleException } from '../../../../../../packages/domain/src/exceptions';

describe('UploadTenderDocumentHandler', () => {
  let handler: UploadTenderDocumentHandler;
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

    handler = new UploadTenderDocumentHandler(mockTenderRepo, mockEventPublisher);
  });

  it('deve barrar a manipulação se o edital não for encontrado (TenderNotFoundException)', async () => {
    mockTenderRepo.findById.mockResolvedValue(null);

    const command = new UploadTenderDocumentCommand(
      'tender-1',
      'tenant-123',
      'user-1',
      TenderDocumentType.LEGAL,
      'CNPJ',
      'http://s3/cnpj.pdf',
    );

    await expect(handler.execute(command)).rejects.toThrow(BusinessRuleException);
    await expect(handler.execute(command)).rejects.toThrow('Tender not found');
    expect(mockTenderRepo.save).not.toHaveBeenCalled();
  });

  it('deve realizar o upload do documento com sucesso e publicar o evento', async () => {
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

    const command = new UploadTenderDocumentCommand(
      'tender-1',
      'tenant-123',
      'user-1',
      TenderDocumentType.LEGAL,
      'CNPJ',
      'http://s3/cnpj.pdf',
    );

    const documentId = await handler.execute(command);

    expect(documentId).toBeDefined();
    expect(mockTenderRepo.save).toHaveBeenCalledWith(tender);
    expect(tender.documents.length).toBe(1);
    expect(tender.documents[0].fileUrl).toBe('http://s3/cnpj.pdf');
    expect(tender.documents[0].status).toBe('UPLOADED');

    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'bidflow.tender.v1.document_uploaded',
        tenantId: 'tenant-123',
        payload: expect.objectContaining({
          tenderId: 'tender-1',
          documentId,
          type: TenderDocumentType.LEGAL,
          userId: 'user-1',
        }),
      })
    );
  });
});
