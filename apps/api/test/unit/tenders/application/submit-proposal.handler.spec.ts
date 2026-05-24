import { SubmitProposalHandler } from '../../../../src/tenders/application/commands/submit-proposal/submit-proposal.handler';
import { SubmitProposalCommand } from '../../../../src/tenders/application/commands/submit-proposal/submit-proposal.command';
import { TenderRepository } from '../../../../../../packages/domain/src/repositories/tender.repository';
import { IEventPublisher } from '../../../../src/tenders/application/ports/event-publisher.port';
import { BusinessRuleException } from '../../../../../../packages/domain/src/exceptions';
import { Tender } from '../../../../../../packages/domain/src/tenders/tender.aggregate';

describe('SubmitProposalHandler', () => {
  let handler: SubmitProposalHandler;
  let mockTenderRepository: jest.Mocked<TenderRepository>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;

  const tenantId = 'tenant-123';
  const tenderId = 'tender-1';
  const userId = 'user-xyz';

  beforeEach(() => {
    mockTenderRepository = {
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

    handler = new SubmitProposalHandler(mockTenderRepository, mockEventPublisher);
  });

  it('deve processar o comando de submissão e publicar o evento com sucesso', async () => {
    const tender = new Tender({
      id: tenderId,
      tenantId,
      source: 'MANUAL',
      number: '001/2026',
      organization: 'Org',
      modality: 'PREGAO_ELETRONICO',
      type: 'MENOR_PRECO',
      status: 'CAPTURED', // Status válido para submissão
      title: 'Teste',
      currency: 'BRL',
      openingDate: new Date('2026-05-01'),
      closingDate: new Date('2026-06-01'),
      createdBy: 'user-xyz'
    });

    mockTenderRepository.findById.mockResolvedValue(tender);
    mockTenderRepository.save.mockResolvedValue(undefined);

    const command = new SubmitProposalCommand(
      tenderId,
      tenantId,
      userId,
      50000,
      10,
      { '1': 1000 },
      'Tech proposal',
      'Commercial terms'
    );

    await handler.execute(command);

    expect(mockTenderRepository.findById).toHaveBeenCalledWith(tenderId, tenantId);
    expect(tender.status).toBe('SUBMITTED');
    expect(mockTenderRepository.save).toHaveBeenCalledWith(tender);

    expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'bidflow.tender.v1.proposal_submitted',
        tenantId,
        tenderId,
        userId,
      })
    );
  });

  it('deve lançar exceção se a licitação não for encontrada', async () => {
    mockTenderRepository.findById.mockResolvedValue(null);

    const command = new SubmitProposalCommand(
      tenderId,
      tenantId,
      userId,
      50000
    );

    await expect(handler.execute(command)).rejects.toThrow(BusinessRuleException);
    await expect(handler.execute(command)).rejects.toThrow('Tender not found');

    expect(mockTenderRepository.save).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });
});
