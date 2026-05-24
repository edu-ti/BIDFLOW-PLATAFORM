import { UpdateSupplierComplianceCommand } from './update-compliance.command';
import { SupplierRepository } from '../../../../../../../packages/domain/src/repositories/supplier.repository';
import { IEventPublisher } from '../../../../tenders/application/ports/event-publisher.port';
import { SupplierNotFoundException } from '../../../../../../../packages/domain/src/exceptions/supplier-not-found.exception';
import { randomUUID } from 'crypto';

export class UpdateSupplierComplianceHandler {
  constructor(
    private readonly supplierRepository: SupplierRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(command: UpdateSupplierComplianceCommand): Promise<void> {
    const { id, tenantId, userId, newScore } = command;

    const supplier = await this.supplierRepository.findById(id, tenantId);
    if (!supplier) {
      throw new SupplierNotFoundException(id);
    }

    const previousStatus = supplier.status;

    supplier.updateComplianceScore(newScore);

    await this.supplierRepository.save(supplier);

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      aggregateId: id,
      tenantId,
      type: 'bidflow.supplier.v1.compliance_updated',
      occurredAt: new Date(),
      payload: {
        id,
        newScore,
        status: supplier.status,
        previousStatus,
        userId,
      },
    });
  }
}
