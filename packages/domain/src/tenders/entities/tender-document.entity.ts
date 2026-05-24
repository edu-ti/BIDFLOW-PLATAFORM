import { TenderDocumentType } from '../value-objects/checklist-requirement.vo';

export enum DocumentStatus {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  VALIDATED = 'VALIDATED',
  EXPIRED = 'EXPIRED',
}

export interface TenderDocumentProps {
  id: string;
  tenderId: string;
  tenantId: string;
  type: TenderDocumentType;
  title: string;
  fileUrl?: string | null;
  expiresAt?: Date | null;
  status: DocumentStatus;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TenderDocument {
  private props: TenderDocumentProps;

  constructor(props: TenderDocumentProps) {
    this.props = {
      ...props,
      fileUrl: props.fileUrl || null,
      expiresAt: props.expiresAt || null,
      metadata: props.metadata || {},
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    };
  }

  get id(): string { return this.props.id; }
  get tenderId(): string { return this.props.tenderId; }
  get tenantId(): string { return this.props.tenantId; }
  get type(): TenderDocumentType { return this.props.type; }
  get title(): string { return this.props.title; }
  get fileUrl(): string | null { return this.props.fileUrl || null; }
  get expiresAt(): Date | null { return this.props.expiresAt || null; }
  get status(): DocumentStatus { return this.props.status; }
  get metadata(): Record<string, any> { return this.props.metadata || {}; }
  get createdAt(): Date { return this.props.createdAt!; }
  get updatedAt(): Date { return this.props.updatedAt!; }

  public uploadFile(url: string, expiresAt: Date | null = null): void {
    if (this.props.status === DocumentStatus.VALIDATED) {
      throw new Error('Cannot upload file to a validated document. Invalidate or mark it as expired first.');
    }
    
    this.props.fileUrl = url;
    this.props.expiresAt = expiresAt;
    this.props.status = DocumentStatus.UPLOADED;
    this.props.updatedAt = new Date();
  }

  public validateDocument(userId: string): void {
    if (this.props.status !== DocumentStatus.UPLOADED) {
      throw new Error('Document must be uploaded before it can be validated.');
    }
    
    if (this.isExpired()) {
      throw new Error('Cannot validate an expired document.');
    }

    this.props.status = DocumentStatus.VALIDATED;
    this.props.metadata = {
      ...this.props.metadata,
      validatedBy: userId,
      validatedAt: new Date().toISOString(),
    };
    this.props.updatedAt = new Date();
  }

  public markAsExpired(): void {
    this.props.status = DocumentStatus.EXPIRED;
    this.props.updatedAt = new Date();
  }

  public invalidate(reason: string, userId: string): void {
    this.props.status = DocumentStatus.PENDING;
    this.props.fileUrl = null;
    this.props.metadata = {
      ...this.props.metadata,
      invalidatedBy: userId,
      invalidatedAt: new Date().toISOString(),
      invalidationReason: reason,
    };
    this.props.updatedAt = new Date();
  }

  public isExpired(): boolean {
    if (this.props.status === DocumentStatus.EXPIRED) return true;
    if (this.props.expiresAt && this.props.expiresAt < new Date()) {
      return true;
    }
    return false;
  }
}
