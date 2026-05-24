import { RegisterSupplierCommand } from './register-supplier.command';
import { SupplierRepository } from '../../../../../../../packages/domain/src/repositories/supplier.repository';
import { IEventPublisher } from '../../../../tenders/application/ports/event-publisher.port';
import { Supplier, SupplierStatus } from '../../../../../../../packages/domain/src/suppliers/entities/supplier.aggregate';
import { Cnpj } from '../../../../../../../packages/domain/src/suppliers/value-objects/cnpj.vo';
import { BusinessRuleException } from '../../../../../../../packages/domain/src/exceptions';
import { randomUUID } from 'crypto';

export class RegisterSupplierHandler {
  constructor(
    private readonly supplierRepository: SupplierRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(command: RegisterSupplierCommand): Promise<string> {
    const { tenantId, userId, corporateName, tradeName, cnpj, metadata } = command;

    // Validate Uniqueness
    const existingSupplier = await this.supplierRepository.findByCnpj(cnpj, tenantId);
    if (existingSupplier) {
      throw new BusinessRuleException('Supplier already registered under this CNPJ', 'SUPPLIER_DUPLICATED');
    }

    // VO Instantiation (Will validate mod 11)
    const cnpjVo = new Cnpj(cnpj);

    // Create Aggregate
    const id = randomUUID();
    const supplier = new Supplier({
      id,
      tenantId,
      corporateName,
      tradeName,
      cnpj: cnpjVo,
      status: SupplierStatus.ACTIVE,
      complianceScore: 100,
      metadata: metadata || {},
    });

    // Persist
    await this.supplierRepository.save(supplier);

    // Publish event
    await this.eventPublisher.publish({
      eventId: randomUUID(),
      aggregateId: id,
      tenantId,
      type: 'bidflow.supplier.v1.registered',
      occurredAt: new Date(),
      payload: {
        id,
        corporateName,
        cnpj: cnpjVo.value,
        userId,
      },
    });

    return id;
  }
}
