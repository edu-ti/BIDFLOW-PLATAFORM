import { PlaceDisputeBidCommand } from './place-dispute-bid.command';
import { TenderRepository } from '../../../../../../../packages/domain/src/repositories/tender.repository';
import { IEventPublisher } from '../../ports/event-publisher.port';
import { BusinessRuleException } from '../../../../../../../packages/domain/src/exceptions';
import { randomUUID } from 'crypto';

export class PlaceDisputeBidHandler {
  constructor(
    private readonly tenderRepository: TenderRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: PlaceDisputeBidCommand): Promise<void> {
    const tender = await this.tenderRepository.findById(command.tenderId, command.tenantId);
    
    if (!tender) {
      throw new BusinessRuleException('Tender not found', 'TENDER_NOT_FOUND');
    }

    const dispute = tender.dispute;
    if (!dispute) {
      throw new BusinessRuleException('Tender does not have an active dispute', 'NO_ACTIVE_DISPUTE');
    }

    const bidId = randomUUID();
    
    // O domínio já valida se o status é OPEN/EXTENDED e se o decremento mínimo foi respeitado.
    // Se falhar, BusinessRuleException será lançada e capturada na borda HTTP ou na API.
    dispute.registerBid(bidId, command.supplierId, command.amount, false);

    // Lógica de Prorrogação Automática (Lei 14.133/2021)
    if (dispute.closedAt) {
      const now = new Date();
      const timeRemainingMs = dispute.closedAt.getTime() - now.getTime();
      const extensionTimeMs = dispute.extensionTime * 1000;

      // Se o lance foi aceito e faltam menos minutos que o tempo de extensão (ex: 3 min)
      if (timeRemainingMs > 0 && timeRemainingMs <= extensionTimeMs) {
        dispute.extend();
      }
    }

    await this.tenderRepository.save(tender);

    // Publicar evento em tempo real
    await this.eventPublisher.publish({
      type: 'bidflow.tender.v1.bid_placed',
      tenantId: command.tenantId,
      tenderId: command.tenderId,
      userId: command.userId,
      timestamp: new Date().toISOString(),
      payload: {
        bidId: bidId,
        supplierId: command.supplierId,
        amount: command.amount,
        disputeStatus: dispute.status,
        closedAt: dispute.closedAt?.toISOString(),
      },
    });
  }
}
