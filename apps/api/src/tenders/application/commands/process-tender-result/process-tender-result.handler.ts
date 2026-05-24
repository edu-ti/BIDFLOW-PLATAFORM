import { ProcessTenderResultCommand } from './process-tender-result.command';
import { TenderRepository } from '../../../../../../../packages/domain/src/repositories/tender.repository';
import { IEventPublisher } from '../../ports/event-publisher.port';
import { BusinessRuleException } from '../../../../../../../packages/domain/src/exceptions';

export class ProcessTenderResultHandler {
  constructor(
    private readonly tenderRepository: TenderRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: ProcessTenderResultCommand): Promise<void> {
    const tender = await this.tenderRepository.findById(command.tenderId, command.tenantId);
    
    if (!tender) {
      throw new BusinessRuleException('Tender not found', 'TENDER_NOT_FOUND');
    }

    tender.closeAndEvaluateResult(command.tenantId, {
      status: command.status,
      classification: command.classification,
      winnerValue: command.winnerValue,
      winnerName: command.winnerName,
      winnerDocument: command.winnerDocument,
      rankings: command.rankings,
      observations: command.observations,
    });

    await this.tenderRepository.save(tender);

    // Publicar evento de fechamento
    await this.eventPublisher.publish({
      type: 'bidflow.tender.v1.result_processed',
      tenantId: command.tenantId,
      tenderId: command.tenderId,
      userId: command.userId,
      timestamp: new Date().toISOString(),
      payload: {
        status: command.status,
        classification: command.classification,
        winnerValue: command.winnerValue,
        winnerName: command.winnerName,
      },
    });
  }
}
