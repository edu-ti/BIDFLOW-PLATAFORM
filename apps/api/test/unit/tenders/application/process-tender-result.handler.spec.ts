import { ProcessTenderResultHandler } from '../../../../src/tenders/application/commands/process-tender-result/process-tender-result.handler';
import { ProcessTenderResultCommand } from '../../../../src/tenders/application/commands/process-tender-result/process-tender-result.command';
import { TenderRepository } from '../../../../../../packages/domain/src/repositories/tender.repository';
import { IEventPublisher } from '../../../../src/tenders/application/ports/event-publisher.port';
import { BusinessRuleException } from '../../../../../../packages/domain/src/exceptions';
import { Tender } from '../../../../../../packages/domain/src/tenders/tender.aggregate';

describe('ProcessTenderResultHandler', () => {
  let handler: ProcessTenderResultHandler;
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

    handler = new ProcessTenderResultHandler(mockTenderRepository, mockEventPublisher);
  });

  it('deve lançar exceção se a licitação não for encontrada (simulando vazamento de tenant ou não existência)', async () => {
    mockTenderRepository.findById.mockResolvedValue(null);

    const command = new ProcessTenderResultCommand(
      tenderId,
      tenantId,
      userId,
      'WON',
      1,
      45000,
      'Minha Empresa',
      '00.000.000/0001-00'
    );

    await expect(handler.execute(command)).rejects.toThrow(BusinessRuleException);
    await expect(handler.execute(command)).rejects.toThrow('Tender not found');

    expect(mockTenderRepository.save).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });

  it('deve recuperar a licitação, aplicar o resultado, persistir e despachar o evento com sucesso', async () => {
    const tender = new Tender({
      id: tenderId,
      tenantId,
      source: 'MANUAL',
      number: '001/2026',
      organization: 'Org',
      modality: 'PREGAO_ELETRONICO',
      type: 'MENOR_PRECO',
      status: 'DISPUTE', // Status válido para fechamento
      title: 'Teste',
      currency: 'BRL',
      openingDate: new Date('2026-05-01'),
      closingDate: new Date('2026-06-01'),
      createdBy: 'user-xyz'
    });

    mockTenderRepository.findById.mockResolvedValue(tender);
    mockTenderRepository.save.mockResolvedValue(undefined);

    const rankings = [
      { position: 1, name: 'Minha Empresa', value: 45000 },
      { position: 2, name: 'Concorrente SA', value: 46000 }
    ];

    const command = new ProcessTenderResultCommand(
      tenderId,
      tenantId,
      userId,
      'WON',
      1,
      45000,
      'Minha Empresa',
      '00.000.000/0001-00',
      rankings,
      'Ganhamos no lance final'
    );

    await handler.execute(command);

    // Valida fluxo
    expect(mockTenderRepository.findById).toHaveBeenCalledWith(tenderId, tenantId);
    expect(tender.status).toBe('WON');
    expect(tender.metadata.result).toBeDefined();
    expect(tender.metadata.result.rankings).toEqual(rankings);
    expect(mockTenderRepository.save).toHaveBeenCalledWith(tender);

    // Valida despacho do evento
    expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'bidflow.tender.v1.result_processed',
        tenantId,
        tenderId,
        userId,
        payload: expect.objectContaining({
          status: 'WON',
          classification: 1,
          winnerValue: 45000,
          winnerName: 'Minha Empresa'
        })
      })
    );
  });
});
