import { TenantRepository, SoftDeleteRepository, Pagination, PaginatedResult } from './index';
import { Tender, TenderStatus, TenderModality } from '../tenders/tender.aggregate';

export interface TenderFilter {
  status?: TenderStatus;
  modality?: TenderModality;
  uf?: string;
  organization?: string;
  openingDateStart?: Date;
  openingDateEnd?: Date;
}

export interface TenderRepository extends TenantRepository<Tender, string>, SoftDeleteRepository<Tender, string> {
  findById(id: string, tenantId?: string): Promise<Tender | null>;
  findByExternalId(externalId: string, tenantId: string): Promise<Tender | null>;
  findPaginated(tenantId: string, filter: TenderFilter, pagination: Pagination): Promise<PaginatedResult<Tender>>;
}
