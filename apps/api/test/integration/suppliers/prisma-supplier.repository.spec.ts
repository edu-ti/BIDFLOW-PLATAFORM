import { PrismaService } from '../../../src/prisma/prisma.service';
import { PrismaSupplierRepository } from '../../../src/suppliers/infrastructure/persistence/prisma/prisma-supplier.repository';
import { Supplier, SupplierStatus } from '../../../../../packages/domain/src/suppliers/entities/supplier.aggregate';
import { Cnpj } from '../../../../../packages/domain/src/suppliers/value-objects/cnpj.vo';
import { randomUUID } from 'crypto';

describe('PrismaSupplierRepository (Integration)', () => {
  let prisma: PrismaService;
  let repository: PrismaSupplierRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repository = new PrismaSupplierRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Cleanup using raw query to avoid cascading limits or just deleteMany
    await prisma.supplier.deleteMany({});
  });

  it('should save a new supplier and retrieve it by id with exact state reconstitution', async () => {
    const tenantId = `tenant-${randomUUID()}`;
    const id = randomUUID();

    const supplier = new Supplier({
      id,
      tenantId,
      corporateName: 'Integration Corp',
      tradeName: 'Integration Trade',
      cnpj: new Cnpj('11.222.333/0001-81'),
      status: SupplierStatus.ACTIVE,
      complianceScore: 100,
      metadata: { contact: 'test@integration.com' },
    });

    // Act - Save
    await repository.save(supplier);

    // Act - Retrieve
    const retrievedSupplier = await repository.findById(id, tenantId);

    // Assert
    expect(retrievedSupplier).toBeDefined();
    expect(retrievedSupplier?.id).toBe(id);
    expect(retrievedSupplier?.tenantId).toBe(tenantId);
    expect(retrievedSupplier?.corporateName).toBe('Integration Corp');
    expect(retrievedSupplier?.tradeName).toBe('Integration Trade');
    expect(retrievedSupplier?.cnpj.value).toBe('11222333000181');
    expect(retrievedSupplier?.status).toBe(SupplierStatus.ACTIVE);
    expect(retrievedSupplier?.complianceScore).toBe(100);
    expect(retrievedSupplier?.metadata).toMatchObject({ contact: 'test@integration.com' });
  });

  it('should retrieve a supplier by CNPJ respecting tenant isolation', async () => {
    const tenantA = `tenant-${randomUUID()}`;
    const tenantB = `tenant-${randomUUID()}`;
    const idA = randomUUID();
    const idB = randomUUID();

    const supplierA = new Supplier({
      id: idA,
      tenantId: tenantA,
      corporateName: 'Corp A',
      tradeName: 'Trade A',
      cnpj: new Cnpj('11.222.333/0001-81'),
      status: SupplierStatus.ACTIVE,
      complianceScore: 90,
    });

    const supplierB = new Supplier({
      id: idB,
      tenantId: tenantB,
      corporateName: 'Corp B',
      tradeName: 'Trade B',
      cnpj: new Cnpj('11.222.333/0001-81'), // Same CNPJ, different tenant
      status: SupplierStatus.SUSPENDED,
      complianceScore: 20,
    });

    await repository.save(supplierA);
    await repository.save(supplierB);

    // Find by CNPJ in Tenant A
    const retrievedA = await repository.findByCnpj('11.222.333/0001-81', tenantA);
    expect(retrievedA).toBeDefined();
    expect(retrievedA?.id).toBe(idA);

    // Find by CNPJ in Tenant B
    const retrievedB = await repository.findByCnpj('11.222.333/0001-81', tenantB);
    expect(retrievedB).toBeDefined();
    expect(retrievedB?.id).toBe(idB);
  });
});
