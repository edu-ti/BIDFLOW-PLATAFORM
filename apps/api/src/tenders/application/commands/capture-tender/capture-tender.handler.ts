import { TenderRepository } from '../../../../../../../packages/domain/src/repositories/tender.repository';
import { Tender, TenderSource, TenderModality, TenderType } from '../../../../../../../packages/domain/src/tenders/tender.aggregate';
import { BusinessRuleException } from '../../../../../../../packages/domain/src/exceptions';
import { CaptureTenderCommand } from './capture-tender.command';
import { IEventPublisher } from '../../ports/event-publisher.port';
import * as crypto from 'crypto';

export class DuplicateTenderException extends BusinessRuleException {
  constructor(externalId: string) {
    super(`Tender with externalId ${externalId} already exists in this tenant.`, 'DUPLICATE_TENDER');
    this.name = 'DuplicateTenderException';
  }
}

export class CaptureTenderHandler {
  constructor(
    private readonly tenderRepository: TenderRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: CaptureTenderCommand): Promise<string> {
    if (!command.tenantId) {
      throw new BusinessRuleException('TenantId is required', 'MISSING_TENANT_ID');
    }

    // Idempotência
    if (command.externalId) {
      const existing = await this.tenderRepository.findByExternalId(command.externalId, command.tenantId);
      if (existing) {
        throw new DuplicateTenderException(command.externalId);
      }
    }

    // Instanciação e validação do domínio puro
    const tender = new Tender({
      id: crypto.randomUUID(),
      tenantId: command.tenantId,
      externalId: command.externalId,
      source: command.source as TenderSource,
      number: command.number,
      organization: command.organization,
      department: command.department,
      modality: command.modality as TenderModality,
      type: command.type as TenderType,
      status: 'CAPTURED',
      title: command.title,
      description: command.description,
      uf: command.uf,
      city: command.city,
      estimatedValue: command.estimatedValue,
      currency: command.currency || 'BRL',
      openingDate: command.openingDate,
      closingDate: command.closingDate,
      documentUrl: command.documentUrl,
      createdBy: command.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Salva no banco de dados através do repositório abstrato
    await this.tenderRepository.save(tender);

    // Event-Driven: Extrai eventos acumulados e os publica
    const domainEvents = tender.domainEvents;
    if (domainEvents && domainEvents.length > 0) {
      await this.eventPublisher.publishAll(domainEvents);
      tender.clearEvents();
    } else {
      // Como a especificação exige que o evento seja disparado, mas o AggregateRoot 
      // criado agora pode ainda não estar emitindo no construtor automaticamente,
      // nós o forçamos via Publisher para manter a consistência pedida:
      await this.eventPublisher.publish({
        eventId: crypto.randomUUID(),
        aggregateId: tender.id,
        tenantId: tender.tenantId,
        type: 'bidflow.tender.v1.captured',
        occurredAt: new Date(),
        payload: {
          tenderId: tender.id,
          source: tender.source,
          number: tender.number,
        }
      });
    }

    return tender.id;
  }
}
