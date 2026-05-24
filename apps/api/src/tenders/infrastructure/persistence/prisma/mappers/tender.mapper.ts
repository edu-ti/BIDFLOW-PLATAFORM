import {
  Tender,
  TenderProps,
  TenderSource,
  TenderModality,
  TenderType,
  TenderStatus,
} from '../../../../../../../../packages/domain/src/tenders/tender.aggregate';
import {
  TenderItem,
  TenderItemProps,
} from '../../../../../../../../packages/domain/src/tenders/entities/tender-item.entity';
import {
  TenderDispute,
  TenderDisputeProps,
  TenderDisputeBid,
  TenderDisputeBidProps,
  DisputeStatus,
} from '../../../../../../../../packages/domain/src/tenders/entities/tender-dispute.entity';
import {
  TenderDocument,
  TenderDocumentProps,
  DocumentStatus,
} from '../../../../../../../../packages/domain/src/tenders/entities/tender-document.entity';
import {
  ChecklistRequirement,
  ChecklistRequirementProps,
  TenderDocumentType,
} from '../../../../../../../../packages/domain/src/tenders/value-objects/checklist-requirement.vo';

export class TenderMapper {
  toDomain(raw: any): Tender {
    if (!raw) return null as any;

    const props: TenderProps = {
      id: raw.id,
      tenantId: raw.tenantId,
      externalId: raw.externalId,
      source: raw.source as TenderSource,
      number: raw.number,
      organization: raw.organization,
      department: raw.department,
      modality: raw.modality as TenderModality,
      type: raw.type as TenderType,
      status: raw.status as TenderStatus,
      title: raw.title,
      description: raw.description,
      uf: raw.uf,
      city: raw.city,
      estimatedValue: raw.estimatedValue,
      currency: raw.currency,
      openingDate: raw.openingDate,
      closingDate: raw.closingDate,
      disputeDate: raw.disputeDate,
      publicationDate: raw.publicationDate,
      documentUrl: raw.documentUrl,
      workflowInstanceId: raw.workflowInstanceId,
      assignedTo: raw.assignedTo,
      assignedTeam: raw.assignedTeam,
      score: raw.score,
      scoreCriteria: raw.scoreCriteria,
      tags: raw.tags,
      metadata: raw.metadata,
      customFields: raw.customFields,
      notes: raw.notes,
      deletedAt: raw.deletedAt,
      createdBy: raw.createdBy,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    const tender = new Tender(props);

    if (raw.items && Array.isArray(raw.items)) {
      const items = raw.items.map((i: any) => {
        const itemProps: TenderItemProps = {
          id: i.id,
          tenantId: i.tenantId,
          tenderId: i.tenderId,
          number: i.number,
          description: i.description,
          quantity: i.quantity,
          unit: i.unit,
          estimatedValue: i.estimatedValue,
          proposalValue: i.proposalValue,
          bidValue: i.bidValue,
          category: i.category,
          specifications: i.specifications,
          hasDispute: i.hasDispute,
          winner: i.winner,
        };
        return new TenderItem(itemProps);
      });
      (tender as any)._items = items;
    }

    if (raw.dispute) {
      const d = raw.dispute;
      const disputeProps: TenderDisputeProps = {
        id: d.id,
        tenantId: d.tenantId,
        tenderId: d.tenderId,
        status: d.status as DisputeStatus,
        startPrice: d.startPrice,
        currentPrice: d.currentPrice,
        minDecrement: d.minDecrement,
        extensionTime: d.extensionTime,
        startedAt: d.startedAt,
        closedAt: d.closedAt,
        winnerId: d.winnerId,
        winnerAmount: d.winnerAmount,
        totalBids: d.totalBids,
        extensions: d.extensions,
        metadata: d.metadata,
      };
      const dispute = new TenderDispute(disputeProps);

      if (d.bids && Array.isArray(d.bids)) {
        const bids = d.bids.map((b: any) => {
          const bidProps: TenderDisputeBidProps = {
            id: b.id,
            tenantId: b.tenantId,
            disputeId: b.disputeId,
            supplierId: b.supplierId,
            amount: b.amount,
            previousAmount: b.previousAmount,
            isAutomatic: b.isAutomatic,
            isWinner: b.isWinner,
            timestamp: b.timestamp,
            round: b.round,
          };
          return new TenderDisputeBid(bidProps);
        });
        (dispute as any)._bids = bids;
      }

      (tender as any)._dispute = dispute;
    }

    if (raw.documents && Array.isArray(raw.documents)) {
      const documents = raw.documents.map((d: any) => {
        const docProps: TenderDocumentProps = {
          id: d.id,
          tenantId: d.tenantId,
          tenderId: d.tenderId,
          type: d.type as TenderDocumentType,
          title: d.title,
          fileUrl: d.fileUrl,
          expiresAt: d.expiresAt,
          status: d.status as DocumentStatus,
          metadata: d.metadata,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        };
        return new TenderDocument(docProps);
      });
      (tender as any)._documents = documents;
    }

    if (raw.checklist && Array.isArray(raw.checklist)) {
      const checklist = raw.checklist.map((c: any) => {
        const checkProps: ChecklistRequirementProps = {
          documentType: c.documentType as TenderDocumentType,
          isRequired: c.isRequired,
          description: c.description,
        };
        return new ChecklistRequirement(checkProps);
      });
      (tender as any)._checklist = checklist;
    }

    return tender;
  }

  toPersistence(tender: Tender): any {
    return {
      id: tender.id,
      tenantId: tender.tenantId,
      externalId: tender.externalId,
      source: tender.source,
      number: tender.number,
      organization: tender.organization,
      department: tender.department,
      modality: tender.modality,
      type: tender.type,
      status: tender.status,
      title: tender.title,
      description: tender.description,
      uf: tender.uf,
      city: tender.city,
      estimatedValue: tender.estimatedValue,
      currency: tender.currency,
      openingDate: tender.openingDate,
      closingDate: tender.closingDate,
      disputeDate: tender.disputeDate,
      publicationDate: tender.publicationDate,
      documentUrl: tender.documentUrl,
      workflowInstanceId: tender.workflowInstanceId,
      assignedTo: tender.assignedTo,
      assignedTeam: tender.assignedTeam,
      score: tender.score,
      scoreCriteria: tender.scoreCriteria,
      tags: tender.tags,
      metadata: tender.metadata,
      customFields: tender.customFields,
      notes: tender.notes,
      deletedAt: tender.deletedAt,
      createdBy: tender.createdBy,
      createdAt: tender.createdAt,
      updatedAt: tender.updatedAt,
    };
  }

  itemToPersistence(item: TenderItem): any {
    return {
      id: item.id,
      tenantId: item.tenantId,
      tenderId: item.tenderId,
      number: item.number,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      estimatedValue: item.estimatedValue,
      proposalValue: item.proposalValue,
      bidValue: item.bidValue,
      category: item.category,
      specifications: item.specifications,
      hasDispute: item.hasDispute,
      winner: item.winner,
    };
  }

  disputeToPersistence(dispute: TenderDispute): any {
    return {
      id: dispute.id,
      tenantId: dispute.tenantId,
      tenderId: dispute.tenderId,
      status: dispute.status,
      startPrice: dispute.startPrice.amount,
      currentPrice: dispute.currentPrice.amount,
      minDecrement: dispute.minDecrement.amount,
      extensionTime: dispute.extensionTime,
      startedAt: dispute.startedAt,
      closedAt: dispute.closedAt,
      winnerId: dispute.winnerId,
      winnerAmount: dispute.winnerAmount?.amount,
      totalBids: dispute.totalBids,
      extensions: dispute.extensions,
      metadata: dispute.metadata,
    };
  }

  disputeBidToPersistence(bid: TenderDisputeBid): any {
    return {
      id: bid.id,
      tenantId: bid.tenantId,
      disputeId: bid.disputeId,
      supplierId: bid.supplierId,
      amount: bid.amount.amount,
      previousAmount: bid.previousAmount?.amount,
      isAutomatic: bid.isAutomatic,
      isWinner: bid.isWinner,
      timestamp: bid.timestamp,
      round: bid.round,
    };
  }

  documentToPersistence(document: TenderDocument): any {
    return {
      id: document.id,
      tenantId: document.tenantId,
      tenderId: document.tenderId,
      type: document.type,
      title: document.title,
      fileUrl: document.fileUrl,
      expiresAt: document.expiresAt,
      status: document.status,
      metadata: document.metadata,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  checklistToPersistence(checklist: ChecklistRequirement, tenderId: string, tenantId: string): any {
    return {
      tenantId,
      tenderId,
      documentType: checklist.documentType,
      isRequired: checklist.isRequired,
      description: checklist.description,
    };
  }
}
