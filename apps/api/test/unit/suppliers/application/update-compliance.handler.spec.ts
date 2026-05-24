import { UpdateSupplierComplianceHandler } from '../../../../src/suppliers/application/commands/update-compliance/update-compliance.handler';
import { UpdateSupplierComplianceCommand } from '../../../../src/suppliers/application/commands/update-compliance/update-compliance.command';
import { SupplierRepository } from '@bidflow/domain';
import { IEventPublisher } from '../../../../src/tenders/application/ports/event-publisher.port';
import { SupplierNotFoundException } from '@bidflow/domain';
import { Supplier, SupplierStatus } from '@bidflow/domain';
import { Cnpj } from '@bidflow/domain';

describe('UpdateSupplierComplianceHandler', () => {
  let handler: UpdateSupplierComplianceHandler;
  let supplierRepository: jest.Mocked<SupplierRepository>;
  let eventPublisher: jest.Mocked<IEventPublisher>;

  beforeEach(() => {
    supplierRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCnpj: jest.fn(),
      findPaginated: jest.fn(),
    };

    eventPublisher = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    handler = new UpdateSupplierComplianceHandler(supplierRepository, eventPublisher);
  });

  it('should successfully update compliance and publish event', async () => {
    const supplier = new Supplier({
      id: 'sup-1',
      tenantId: 'tenant-1',
      corporateName: 'Corp',
      tradeName: 'Trade',
      cnpj: new Cnpj('11.222.333/0001-81'),
      status: SupplierStatus.ACTIVE,
      complianceScore: 100,
    });

    supplierRepository.findById.mockResolvedValue(supplier);

    const command = new UpdateSupplierComplianceCommand('sup-1', 'tenant-1', 'user-1', 85);

    await handler.execute(command);

    expect(supplier.complianceScore).toBe(85);
    expect(supplierRepository.save).toHaveBeenCalledWith(supplier);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish.mock.calls[0][0]).toMatchObject({
      type: 'bidflow.supplier.v1.compliance_updated',
      payload: {
        newScore: 85,
        status: SupplierStatus.ACTIVE,
      }
    });
  });

  it('should throw SupplierNotFoundException if not found', async () => {
    supplierRepository.findById.mockResolvedValue(null);

    const command = new UpdateSupplierComplianceCommand('sup-1', 'tenant-1', 'user-1', 85);

    await expect(handler.execute(command)).rejects.toThrow(SupplierNotFoundException);
    expect(supplierRepository.save).not.toHaveBeenCalled();
  });
});
