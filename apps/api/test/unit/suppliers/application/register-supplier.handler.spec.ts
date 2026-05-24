import { RegisterSupplierHandler } from '../../../../src/suppliers/application/commands/register-supplier/register-supplier.handler';
import { RegisterSupplierCommand } from '../../../../src/suppliers/application/commands/register-supplier/register-supplier.command';
import { SupplierRepository } from '@bidflow/domain';
import { IEventPublisher } from '../../../../src/tenders/application/ports/event-publisher.port';
import { BusinessRuleException } from '@bidflow/domain';
import { Supplier, SupplierStatus } from '@bidflow/domain';
import { Cnpj } from '@bidflow/domain';

describe('RegisterSupplierHandler', () => {
  let handler: RegisterSupplierHandler;
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

    handler = new RegisterSupplierHandler(supplierRepository, eventPublisher);
  });

  it('should successfully register a supplier and publish event', async () => {
    supplierRepository.findByCnpj.mockResolvedValue(null);

    const command = new RegisterSupplierCommand(
      'tenant-1',
      'user-1',
      'Corporate Name',
      'Trade Name',
      '11.222.333/0001-81',
      { phone: '123' }
    );

    const id = await handler.execute(command);

    expect(id).toBeDefined();
    expect(supplierRepository.save).toHaveBeenCalledTimes(1);
    
    const savedSupplier = supplierRepository.save.mock.calls[0][0];
    expect(savedSupplier.corporateName).toBe('Corporate Name');
    expect(savedSupplier.status).toBe(SupplierStatus.ACTIVE);
    expect(savedSupplier.complianceScore).toBe(100);

    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish.mock.calls[0][0]).toMatchObject({
      type: 'bidflow.supplier.v1.registered',
      tenantId: 'tenant-1',
    });
  });

  it('should throw BusinessRuleException if CNPJ already exists', async () => {
    const existingSupplier = new Supplier({
      id: 'old-sup',
      tenantId: 'tenant-1',
      corporateName: 'Old',
      tradeName: 'Old',
      cnpj: new Cnpj('11.222.333/0001-81'),
      status: SupplierStatus.ACTIVE,
      complianceScore: 100,
    });

    supplierRepository.findByCnpj.mockResolvedValue(existingSupplier);

    const command = new RegisterSupplierCommand(
      'tenant-1',
      'user-1',
      'Corporate Name',
      'Trade Name',
      '11.222.333/0001-81'
    );

    await expect(handler.execute(command)).rejects.toThrow(BusinessRuleException);
    expect(supplierRepository.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });
});
