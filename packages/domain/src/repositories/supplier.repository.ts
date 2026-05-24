import { Supplier } from '../suppliers/entities/supplier.aggregate';
import { Pagination, PaginatedResult } from './index';

export interface SupplierRepository {
  save(supplier: Supplier): Promise<void>;
  findById(id: string, tenantId: string): Promise<Supplier | null>;
  findByCnpj(cnpj: string, tenantId: string): Promise<Supplier | null>;
  findPaginated(
    tenantId: string,
    filters?: Record<string, any>,
    options?: Pagination
  ): Promise<PaginatedResult<Supplier>>;
}
