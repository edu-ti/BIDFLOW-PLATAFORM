import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  TenderRepository,
  TenderFilter,
  Pagination,
  PaginatedResult,
} from '../../../../../../../packages/domain/src/repositories';
import { Tender } from '../../../../../../../packages/domain/src/tenders/tender.aggregate';
import { TenderMapper } from './mappers/tender.mapper';

@Injectable()
export class PrismaTenderRepository implements TenderRepository {
  private readonly logger = new Logger(PrismaTenderRepository.name);
  private readonly mapper = new TenderMapper();

  constructor(private readonly prisma: PrismaService) {}

  async save(tender: Tender): Promise<void> {
    const data = this.mapper.toPersistence(tender);
    const itemsData = tender.items.map((i) => this.mapper.itemToPersistence(i));
    const disputeData = tender.dispute ? this.mapper.disputeToPersistence(tender.dispute) : null;
    const bidsData = tender.dispute ? tender.dispute.bids.map((b) => this.mapper.disputeBidToPersistence(b)) : [];
    const documentsData = tender.documents.map((d) => this.mapper.documentToPersistence(d));
    const checklistData = tender.checklist.map((c) => this.mapper.checklistToPersistence(c, tender.id, tender.tenantId));

    await this.prisma.$transaction(async (tx: any) => {
      // Upsert do Aggregate Root
      await tx.tender.upsert({
        where: { id: tender.id },
        create: data,
        update: data,
      });

      // Sincronização dos Items: a forma mais segura em aggregates 
      // complexos é limpar e re-inserir para garantir espelhamento exato do domínio.
      await tx.tenderItem.deleteMany({
        where: { tenderId: tender.id, tenantId: tender.tenantId },
      });
      if (itemsData.length > 0) {
        await tx.tenderItem.createMany({ data: itemsData });
      }

      // Sincronização dos Documentos
      await tx.tenderDocument.deleteMany({
        where: { tenderId: tender.id, tenantId: tender.tenantId },
      });
      if (documentsData.length > 0) {
        await tx.tenderDocument.createMany({ data: documentsData });
      }

      // Sincronização do Checklist
      await tx.tenderChecklistRequirement.deleteMany({
        where: { tenderId: tender.id, tenantId: tender.tenantId },
      });
      if (checklistData.length > 0) {
        await tx.tenderChecklistRequirement.createMany({ data: checklistData });
      }

      // Sincronização do Dispute e seus Bids
      if (disputeData) {
        await tx.tenderDispute.upsert({
          where: { id: disputeData.id },
          create: disputeData,
          update: disputeData,
        });

        await tx.tenderDisputeBid.deleteMany({
          where: { disputeId: disputeData.id, tenantId: tender.tenantId },
        });

        if (bidsData.length > 0) {
          await tx.tenderDisputeBid.createMany({ data: bidsData });
        }
      } else {
        await tx.tenderDispute.deleteMany({
          where: { tenderId: tender.id, tenantId: tender.tenantId },
        });
      }
    });

    this.logger.log(`Tender ${tender.id} saved for tenant ${tender.tenantId}`);
  }

  async findById(id: string, tenantId?: string): Promise<Tender | null> {
    const where: any = { id, deletedAt: null };
    if (tenantId) where.tenantId = tenantId;

    const record = await this.prisma.tender.findFirst({
      where,
      include: {
        items: true,
        documents: true,
        checklists: true,
        dispute: {
          include: {
            bids: true,
          },
        },
      },
    });

    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.tender.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tender.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.tender.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<void> {
    await this.prisma.tender.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async findDeleted(tenantId: string): Promise<Tender[]> {
    const records = await this.prisma.tender.findMany({
      where: { tenantId, deletedAt: { not: null } },
      include: {
        items: true,
        documents: true,
        checklists: true,
        dispute: { include: { bids: true } },
      },
    });
    return records.map((r: any) => this.mapper.toDomain(r));
  }

  async findByExternalId(externalId: string, tenantId: string): Promise<Tender | null> {
    const record = await this.prisma.tender.findFirst({
      where: { externalId, tenantId, deletedAt: null },
      include: {
        items: true,
        documents: true,
        checklists: true,
        dispute: { include: { bids: true } },
      },
    });

    if (!record) return null;
    return this.mapper.toDomain(record);
  }

  async findPaginated(
    tenantId: string,
    filter: TenderFilter,
    pagination: Pagination,
  ): Promise<PaginatedResult<Tender>> {
    const where: any = { tenantId, deletedAt: null };

    if (filter.status) where.status = filter.status;
    if (filter.modality) where.modality = filter.modality;
    if (filter.uf) where.uf = filter.uf;
    if (filter.organization) where.organization = { contains: filter.organization, mode: 'insensitive' };
    
    if (filter.openingDateStart || filter.openingDateEnd) {
      where.openingDate = {};
      if (filter.openingDateStart) where.openingDate.gte = filter.openingDateStart;
      if (filter.openingDateEnd) where.openingDate.lte = filter.openingDateEnd;
    }

    const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
    const limit = pagination.limit && pagination.limit > 0 ? pagination.limit : 10;
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: 'desc' };
    if (pagination.sort) {
      orderBy = { [pagination.sort]: pagination.order || 'asc' };
    }

    const [total, records] = await Promise.all([
      this.prisma.tender.count({ where }),
      this.prisma.tender.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          items: true,
          documents: true,
          checklists: true,
          dispute: { include: { bids: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: records.map((r: any) => this.mapper.toDomain(r)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
    };
  }
}
