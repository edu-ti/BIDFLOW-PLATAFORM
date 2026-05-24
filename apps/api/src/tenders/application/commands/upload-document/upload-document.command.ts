import { TenderDocumentType } from '../../../../../../../packages/domain/src/tenders/value-objects/checklist-requirement.vo';

export class UploadTenderDocumentCommand {
  constructor(
    public readonly tenderId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly type: TenderDocumentType,
    public readonly title: string,
    public readonly fileUrl: string,
    public readonly expiresAt?: Date,
  ) {}
}
