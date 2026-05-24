// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SupplierRepository } from '../../../../packages/domain/src/repositories/supplier.repository';
import { Supplier } from '../../../../packages/domain/src/suppliers/entities/supplier.aggregate';
import { PaginationOptions, PaginatedResult } from '../../../../packages/domain/src/abstractions/pagination';
import { SupplierMapper } from './mappers/supplier.mapper';

@Injectable()
export class PrismaSupplierRepository implements SupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(supplier: Supplier): Promise<void> {
    const data = SupplierMapper.toPersistence(supplier);

    await this.prisma.supplier.upsert({
      where: { id: supplier.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string, tenantId: string): Promise<Supplier | null> {
    const raw = await this.prisma.supplier.findUnique({
      where: {
        id,
        tenant_id: tenantId,
      },
    });

    if (!raw) return null;

    return SupplierMapper.toDomain(raw);
  }

  async findByCnpj(cnpj: string, tenantId: string): Promise<Supplier | null> {
    // Note: Assuming clean CNPJ is passed or we could clean it here
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    
    const raw = await this.prisma.supplier.findFirst({
      where: {
        cnpj: cleanCnpj,
        tenant_id: tenantId,
      },
    });

    if (!raw) return null;

    return SupplierMapper.toDomain(raw);
  }

  async findPaginated(
    tenantId: string,
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Supplier>> {
    const { page = 1, limit = 10 } = options || {};
    const skip = (page - 1) * limit;

    const whereClause: any = {
      tenant_id: tenantId,
      ...filters,
    };

    const [total, rawSuppliers] = await Promise.all([
      this.prisma.supplier.count({ where: whereClause }),
      this.prisma.supplier.findMany({
        where: whereClause,
        skip,
        take: limit,
      }),
    ]);

    const data = rawSuppliers.map(SupplierMapper.toDomain);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
