// ═══════════════════════════════════════════════════════════════════════════
// @bidflow/domain — Repository Contracts
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generic repository interface.
 * Cada aggregate root define seu próprio repositório extendendo esta base.
 */
export interface Repository<T, TId = string> {
  save(entity: T): Promise<void>;
  findById(id: TId): Promise<T | null>;
  exists(id: TId): Promise<boolean>;
  delete(id: TId): Promise<void>;
}

/**
 * Tenant-aware repository.
 * Toda consulta é filtrada por tenantId automaticamente.
 */
export interface TenantRepository<T, TId = string> extends Repository<T, TId> {
  findById(id: TId, tenantId?: string): Promise<T | null>;
}

/**
 * Pagination helper.
 */
export interface Pagination {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Paginated result.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}

/**
 * Soft-delete repository.
 */
export interface SoftDeleteRepository<T, TId = string> extends Repository<T, TId> {
  softDelete(id: TId): Promise<void>;
  restore(id: TId): Promise<void>;
  findDeleted(tenantId: string): Promise<T[]>;
}

export * from './tender.repository';
