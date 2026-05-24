import { AggregateRoot } from '../../abstractions/aggregate-root';
import { BusinessRuleException } from '../../exceptions';
import { Cnpj } from '../value-objects/cnpj.vo';

export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

export interface SupplierProps {
  id: string;
  tenantId: string;
  corporateName: string;
  tradeName: string;
  cnpj: Cnpj;
  status: SupplierStatus;
  complianceScore: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Supplier extends AggregateRoot<string> {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private _corporateName: string;
  private _tradeName: string;
  private _cnpj: Cnpj;
  private _status: SupplierStatus;
  private _complianceScore: number;
  private _metadata: Record<string, any>;

  constructor(props: SupplierProps) {
    super();
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    if (props.complianceScore < 0 || props.complianceScore > 100) {
      throw new BusinessRuleException('Compliance score must be between 0 and 100', 'INVALID_SCORE');
    }

    this._corporateName = props.corporateName;
    this._tradeName = props.tradeName;
    this._cnpj = props.cnpj;
    this._status = props.status;
    this._complianceScore = props.complianceScore;
    this._metadata = props.metadata || {};
  }

  get corporateName(): string {
    return this._corporateName;
  }

  get tradeName(): string {
    return this._tradeName;
  }

  get cnpj(): Cnpj {
    return this._cnpj;
  }

  get status(): SupplierStatus {
    return this._status;
  }

  get complianceScore(): number {
    return this._complianceScore;
  }

  get metadata(): Record<string, any> {
    return this._metadata;
  }

  public suspendSupplier(reason: string): void {
    if (this._status === SupplierStatus.SUSPENDED) {
      throw new BusinessRuleException('Supplier is already suspended', 'ALREADY_SUSPENDED');
    }

    this._status = SupplierStatus.SUSPENDED;
    
    this._metadata = {
      ...this._metadata,
      suspensionReason: reason,
      suspendedAt: new Date().toISOString(),
    };
  }

  public activateSupplier(): void {
    if (this._status === SupplierStatus.ACTIVE) {
      throw new BusinessRuleException('Supplier is already active', 'ALREADY_ACTIVE');
    }

    if (this._complianceScore <= 50) {
      throw new BusinessRuleException('Supplier cannot be activated with a compliance score of 50 or below', 'INSUFFICIENT_SCORE');
    }

    this._status = SupplierStatus.ACTIVE;
    
    delete this._metadata.suspensionReason;
    delete this._metadata.suspendedAt;
  }

  public updateComplianceScore(newScore: number): void {
    if (newScore < 0 || newScore > 100) {
      throw new BusinessRuleException('Compliance score must be between 0 and 100', 'INVALID_SCORE');
    }

    this._complianceScore = newScore;

    if (this._complianceScore < 30 && this._status === SupplierStatus.ACTIVE) {
      this._status = SupplierStatus.UNDER_REVIEW;
      
      this._metadata = {
        ...this._metadata,
        reviewTriggeredAt: new Date().toISOString(),
        reviewReason: 'Compliance score dropped below 30 threshold',
      };
    }
  }
}
