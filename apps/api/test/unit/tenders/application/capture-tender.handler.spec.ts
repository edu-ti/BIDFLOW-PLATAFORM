import { CaptureTenderHandler } from '../../../../src/tenders/application/commands/capture-tender/capture-tender.handler';
import { CaptureTenderCommand } from '../../../../src/tenders/application/commands/capture-tender/capture-tender.command';
import { TenderRepository } from '../../../../../../packages/domain/src/repositories/tender.repository';
import { IEventPublisher } from '../../../../src/tenders/application/ports/event-publisher.port';
import { BusinessRuleException } from '../../../../../../packages/domain/src/exceptions';
import { Tender } from '../../../../../../packages/domain/src/tenders/tender.aggregate';

describe('CaptureTenderHandler', () => {
  let handler: CaptureTenderHandler;
  let mockTenderRepository: jest.Mocked<TenderRepository>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;

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

    handler = new CaptureTenderHandler(mockTenderRepository, mockEventPublisher);
  });

  it('deve processar o comando de captura e publicar o evento com sucesso', async () => {
    mockTenderRepository.findByExternalId.mockResolvedValue(null); // Nenhuma duplicidade
    mockTenderRepository.save.mockResolvedValue(undefined);

    const command = new CaptureTenderCommand(
      'tenant-123',
      'ext-001',
      'API',
      '001/2026',
      'Org Teste',
      'Dept Teste',
      'PREGAO_ELETRONICO',
      'MENOR_PRECO',
      'Licitação Teste',
      'Descrição Teste',
      'SP',
      'São Paulo',
      10000,
      'BRL',
      new Date('2026-05-01T10:00:00Z'),
      new Date('2026-06-01T10:00:00Z'),
      'http://test.com/doc',
      'user-xyz'
    );

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(mockTenderRepository.findByExternalId).toHaveBeenCalledWith('ext-001', 'tenant-123');
    expect(mockTenderRepository.save).toHaveBeenCalledTimes(1);

    // Valida que o evento fallback bidflow.tender.v1.captured foi publicado
    expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'bidflow.tender.v1.captured',
        tenantId: 'tenant-123',
      })
    );
  });

  it('deve bloquear a ingestão caso o edital (externalId) já exista para o tenant', async () => {
    // Simula que o edital já existe no banco de dados para este tenant
    mockTenderRepository.findByExternalId.mockResolvedValue({} as Tender);

    const command = new CaptureTenderCommand(
      'tenant-123',
      'ext-001', // duplicado
      'API',
      '001/2026',
      'Org',
      undefined,
      'PREGAO_ELETRONICO',
      'MENOR_PRECO',
      'Teste',
      undefined,
      undefined,
      undefined,
      undefined,
      'BRL',
      new Date('2026-05-01'),
      new Date('2026-06-01'),
      undefined,
      'user-xyz'
    );

    await expect(handler.execute(command)).rejects.toThrow(BusinessRuleException);
    await expect(handler.execute(command)).rejects.toThrow('Tender with externalId ext-001 already exists for this tenant');

    // Garante que o save nunca é chamado
    expect(mockTenderRepository.save).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });
});
