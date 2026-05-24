import { SubmitProposalCommand } from './submit-proposal.command';
import { TenderRepository } from '../../../../../../../packages/domain/src/repositories/tender.repository';
import { IEventPublisher } from '../../ports/event-publisher.port';
import { BusinessRuleException } from '../../../../../../../packages/domain/src/exceptions';

export class SubmitProposalHandler {
  constructor(
    private readonly tenderRepository: TenderRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: SubmitProposalCommand): Promise<void> {
    const tender = await this.tenderRepository.findById(command.tenderId, command.tenantId);
    
    if (!tender) {
      throw new BusinessRuleException('Tender not found', 'TENDER_NOT_FOUND');
    }

    // Pass invariants to aggregate root to process proposal submission
    tender.submitProposal(
      command.tenantId,
      {
        totalValue: command.totalValue,
        discountPercent: command.discountPercent,
        itemValues: command.itemValues,
        technicalProposal: command.technicalProposal,
        commercialTerms: command.commercialTerms,
      }
    );

    await this.tenderRepository.save(tender);

    // Fallback event publish
    await this.eventPublisher.publish({
      type: 'bidflow.tender.v1.proposal_submitted',
      tenantId: command.tenantId,
      tenderId: command.tenderId,
      userId: command.userId,
      timestamp: new Date().toISOString(),
      payload: {
        totalValue: command.totalValue,
      },
    });

    // Or via Domain Events internally: 
    // tender.getUncommittedEvents().forEach(e => eventPublisher.publish(e));
    // tender.clearEvents();
  }
}
