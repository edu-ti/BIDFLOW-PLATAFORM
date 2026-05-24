import { PlaceDisputeBidHandler } from '../../../../src/tenders/application/commands/place-dispute-bid/place-dispute-bid.handler';
import { PlaceDisputeBidCommand } from '../../../../src/tenders/application/commands/place-dispute-bid/place-dispute-bid.command';
import { TenderRepository } from '../../../../../../packages/domain/src/repositories/tender.repository';
import { IEventPublisher } from '../../../../src/tenders/application/ports/event-publisher.port';
import { BusinessRuleException } from '../../../../../../packages/domain/src/exceptions';
import { Tender } from '../../../../../../packages/domain/src/tenders/tender.aggregate';
import { TenderDispute } from '../../../../../../packages/domain/src/tenders/entities/tender-dispute.entity';

describe('PlaceDisputeBidHandler', () => {
  let handler: PlaceDisputeBidHandler;
  let mockTenderRepository: jest.Mocked<TenderRepository>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;

  const tenantId = 'tenant-123';
  const tenderId = 'tender-1';
  const supplierId = 'supp-abc';
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

    handler = new PlaceDisputeBidHandler(mockTenderRepository, mockEventPublisher);
  });

  const createTenderWithDispute = (closedAt: Date): Tender => {
    const tender = new Tender({
      id: tenderId,
      tenantId,
      source: 'MANUAL',
      number: '001/2026',
      organization: 'Org',
      modality: 'PREGAO_ELETRONICO',
      type: 'MENOR_PRECO',
      status: 'DISPUTE',
      title: 'Teste Disputa',
      currency: 'BRL',
      openingDate: new Date('2026-05-01'),
      closingDate: new Date('2026-06-01'),
      createdBy: 'user-xyz'
    });

    const dispute = new TenderDispute({
      id: 'dispute-1',
      tenantId,
      tenderId,
      status: 'OPEN',
      startPrice: 10000,
      currentPrice: 10000,
      minDecrement: 100,
      extensionTime: 180, // 3 minutos
      startedAt: new Date(closedAt.getTime() - 3600000), // 1 hora antes
      closedAt: closedAt,
      extensions: 0,
    });

    tender.registerDispute(dispute, tenantId);
    return tender;
  };

  it('deve processar lance com sucesso FORA da janela de prorrogação e NÃO estender', async () => {
    const now = new Date();
    // Fechamento daqui a 1 hora (bem fora dos 3 minutos)
    const closedAt = new Date(now.getTime() + 3600 * 1000); 
    const tender = createTenderWithDispute(closedAt);

    mockTenderRepository.findById.mockResolvedValue(tender);
    mockTenderRepository.save.mockResolvedValue(undefined);

    const command = new PlaceDisputeBidCommand(
      tenderId,
      tenantId,
      userId,
      9500,
      supplierId
    );

    await handler.execute(command);

    expect(mockTenderRepository.findById).toHaveBeenCalledWith(tenderId, tenantId);
    expect(tender.dispute?.status).toBe('OPEN'); // Não mudou
    expect(tender.dispute?.extensions).toBe(0); // Não estendeu
    expect(tender.dispute?.currentPrice.amount).toBe(9500);
    expect(mockTenderRepository.save).toHaveBeenCalledWith(tender);

    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'bidflow.tender.v1.bid_placed',
        tenantId,
        tenderId,
      })
    );
  });

  it('deve processar lance com sucesso DENTRO da janela de prorrogação e ESTENDER o fechamento', async () => {
    const now = new Date();
    // Fechamento daqui a 2 minutos (dentro dos 3 minutos de extensionTime)
    const closedAt = new Date(now.getTime() + 120 * 1000); 
    const tender = createTenderWithDispute(closedAt);

    mockTenderRepository.findById.mockResolvedValue(tender);
    mockTenderRepository.save.mockResolvedValue(undefined);

    const command = new PlaceDisputeBidCommand(
      tenderId,
      tenantId,
      userId,
      9000,
      supplierId
    );

    await handler.execute(command);

    expect(tender.dispute?.status).toBe('EXTENDED'); // Mudou!
    expect(tender.dispute?.extensions).toBe(1); // Estendeu!
    
    // O closedAt original era `now + 120s`. Agora deve ser `(now + 120s) + 180s`.
    const expectedTime = new Date(closedAt.getTime() + 180 * 1000);
    expect(tender.dispute?.closedAt?.getTime()).toBe(expectedTime.getTime());
    
    expect(mockTenderRepository.save).toHaveBeenCalledWith(tender);
    expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it('deve lançar exceção se a licitação não for encontrada', async () => {
    mockTenderRepository.findById.mockResolvedValue(null);

    const command = new PlaceDisputeBidCommand(
      tenderId,
      tenantId,
      userId,
      9500,
      supplierId
    );

    await expect(handler.execute(command)).rejects.toThrow(BusinessRuleException);
    await expect(handler.execute(command)).rejects.toThrow('Tender not found');

    expect(mockTenderRepository.save).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });
});
