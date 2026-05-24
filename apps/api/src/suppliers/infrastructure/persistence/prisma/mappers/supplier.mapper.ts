// @ts-nocheck
import { Supplier, SupplierStatus } from '../../../../../../../../packages/domain/src/suppliers/entities/supplier.aggregate';
import { Cnpj } from '../../../../../../../../packages/domain/src/suppliers/value-objects/cnpj.vo';
import { suppliers as PrismaSupplier } from '@prisma/client';

export class SupplierMapper {
  static toPersistence(domain: Supplier): any {
    return {
      id: domain.id,
      tenant_id: domain.tenantId,
      corporate_name: domain.corporateName,
      trade_name: domain.tradeName,
      cnpj: domain.cnpj.value,
      status: domain.status,
      compliance_score: domain.complianceScore,
      metadata: domain.metadata ? JSON.parse(JSON.stringify(domain.metadata)) : {},
    };
  }

  static toDomain(raw: PrismaSupplier): Supplier {
    const supplier = new Supplier({
      id: raw.id,
      tenantId: raw.tenant_id,
      corporateName: raw.corporate_name,
      tradeName: raw.trade_name,
      cnpj: new Cnpj(raw.cnpj),
      status: raw.status as SupplierStatus,
      complianceScore: raw.compliance_score,
      metadata: raw.metadata ? (raw.metadata as Record<string, any>) : {},
    });

    // Clear events if any (assuming BaseEntity has clearEvents)
    supplier.clearEvents();

    return supplier;
  }
}
