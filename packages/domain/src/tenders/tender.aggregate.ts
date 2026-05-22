import { AggregateRoot } from '../abstractions/aggregate-root';
import { TenderItem } from './entities/tender-item.entity';
import { TenderDispute } from './entities/tender-dispute.entity';
import { BusinessRuleException, TenantMismatchException } from '../exceptions';

export type TenderStatus = 'CAPTURED' | 'ANALYZING' | 'VIABILITY_ANALYSIS' | 'DOCUMENTATION' | 'APPROVAL' | 'PROPOSAL' | 'SUBMITTED' | 'DISPUTE' | 'RESULT_AWAITED' | 'WON' | 'LOST' | 'APPEAL' | 'CONTRACTED' | 'CANCELLED' | 'ARCHIVED';
export type TenderModality = 'PREGAO_ELETRONICO' | 'PREGAO_PRESENCIAL' | 'CONCORRENCIA' | 'TOMADA_PRECOS' | 'CONVITE' | 'CONCURSO' | 'LEILAO' | 'RDC' | 'DISPENSA' | 'INEXIGIBILIDADE';
export type TenderType = 'MENOR_PRECO' | 'MAIOR_DESCONTO' | 'MELHOR_TECNICA' | 'TECNICA_PRECO' | 'MAIOR_LANCE' | 'MAIOR_OFERTA';
export type TenderSource = 'DOU' | 'COMPRASNET' | 'BEC' | 'LICITACOES_JSON' | 'API' | 'MANUAL' | 'IMPORT';

export interface TenderProps {
  id: string;
  tenantId: string;
  externalId?: string;
  source: TenderSource;
  number: string;
  organization: string;
  department?: string;
  modality: TenderModality;
  type: TenderType;
  status: TenderStatus;
  title: string;
  description?: string;
  uf?: string;
  city?: string;
  estimatedValue?: number;
  currency: string;
  openingDate: Date;
  closingDate: Date;
  disputeDate?: Date;
  publicationDate?: Date;
  documentUrl?: string;
  workflowInstanceId?: string;
  assignedTo?: string;
  assignedTeam?: any;
  score?: number;
  scoreCriteria?: any;
  tags?: any;
  metadata?: any;
  customFields?: any;
  notes?: string;
  deletedAt?: Date;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Tender extends AggregateRoot<string> {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private _externalId?: string;
  private _source: TenderSource;
  private _number: string;
  private _organization: string;
  private _department?: string;
  private _modality: TenderModality;
  private _type: TenderType;
  private _status: TenderStatus;
  private _title: string;
  private _description?: string;
  private _uf?: string;
  private _city?: string;
  private _estimatedValue?: number;
  private _currency: string;
  private _openingDate: Date;
  private _closingDate: Date;
  private _disputeDate?: Date;
  private _publicationDate?: Date;
  private _documentUrl?: string;
  private _workflowInstanceId?: string;
  private _assignedTo?: string;
  private _assignedTeam?: any;
  private _score?: number;
  private _scoreCriteria?: any;
  private _tags?: any;
  private _metadata?: any;
  private _customFields?: any;
  private _notes?: string;
  private _deletedAt?: Date;
  private _createdBy: string;

  private _items: TenderItem[] = [];
  private _dispute?: TenderDispute;

  constructor(props: TenderProps) {
    super();
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    if (props.closingDate <= props.openingDate) {
      throw new BusinessRuleException('closingDate must be after openingDate', 'INVALID_DATES');
    }

    if (props.score !== undefined && (props.score < 0 || props.score > 100)) {
      throw new BusinessRuleException('Score must be between 0 and 100', 'INVALID_SCORE');
    }

    this._externalId = props.externalId;
    this._source = props.source;
    this._number = props.number;
    this._organization = props.organization;
    this._department = props.department;
    this._modality = props.modality;
    this._type = props.type;
    this._status = props.status;
    this._title = props.title;
    this._description = props.description;
    this._uf = props.uf;
    this._city = props.city;
    this._estimatedValue = props.estimatedValue;
    this._currency = props.currency;
    this._openingDate = props.openingDate;
    this._closingDate = props.closingDate;
    this._disputeDate = props.disputeDate;
    this._publicationDate = props.publicationDate;
    this._documentUrl = props.documentUrl;
    this._workflowInstanceId = props.workflowInstanceId;
    this._assignedTo = props.assignedTo;
    this._assignedTeam = props.assignedTeam;
    this._score = props.score;
    this._scoreCriteria = props.scoreCriteria;
    this._tags = props.tags || [];
    this._metadata = props.metadata || {};
    this._customFields = props.customFields || {};
    this._notes = props.notes;
    this._deletedAt = props.deletedAt;
    this._createdBy = props.createdBy;
  }

  // Properties exposure (readonly)
  get externalId() { return this._externalId; }
  get source() { return this._source; }
  get number() { return this._number; }
  get organization() { return this._organization; }
  get department() { return this._department; }
  get modality() { return this._modality; }
  get type() { return this._type; }
  get status() { return this._status; }
  get title() { return this._title; }
  get description() { return this._description; }
  get uf() { return this._uf; }
  get city() { return this._city; }
  get estimatedValue() { return this._estimatedValue; }
  get currency() { return this._currency; }
  get openingDate() { return this._openingDate; }
  get closingDate() { return this._closingDate; }
  get disputeDate() { return this._disputeDate; }
  get publicationDate() { return this._publicationDate; }
  get documentUrl() { return this._documentUrl; }
  get workflowInstanceId() { return this._workflowInstanceId; }
  get assignedTo() { return this._assignedTo; }
  get assignedTeam() { return this._assignedTeam; }
  get score() { return this._score; }
  get scoreCriteria() { return this._scoreCriteria; }
  get tags() { return this._tags; }
  get metadata() { return this._metadata; }
  get customFields() { return this._customFields; }
  get notes() { return this._notes; }
  get deletedAt() { return this._deletedAt; }
  get createdBy() { return this._createdBy; }

  get items(): ReadonlyArray<TenderItem> {
    return this._items;
  }

  get dispute(): TenderDispute | undefined {
    return this._dispute;
  }

  // --- Aggregate Methods ---

  public changeStatus(newStatus: TenderStatus, tenantId: string): void {
    this.ensureTenant(tenantId);
    
    if (newStatus === 'WON' && !this.hasWinner()) {
      throw new BusinessRuleException('Tender status WON requires a winner in results', 'NO_WINNER');
    }

    if (newStatus === 'VIABILITY_ANALYSIS' && this._score !== undefined && (this._score < 0 || this._score > 100)) {
      throw new BusinessRuleException('Score must be between 0 and 100 during viability analysis', 'INVALID_SCORE');
    }

    this._status = newStatus;
  }

  public bindWorkflow(workflowInstanceId: string, tenantId: string): void {
    this.ensureTenant(tenantId);
    if (this._status !== 'ANALYZING' && this._status !== 'CAPTURED') {
      throw new BusinessRuleException('Workflow can only be bound during initial stages', 'INVALID_STATE');
    }
    this._workflowInstanceId = workflowInstanceId;
  }

  public addItem(item: TenderItem, tenantId: string): void {
    this.ensureTenant(tenantId);
    
    if (this._status === 'SUBMITTED' || this._status === 'DISPUTE') {
      throw new BusinessRuleException('Cannot modify items when tender is submitted or in dispute', 'PROPOSAL_ALREADY_SUBMITTED');
    }

    if (item.tenantId !== this.tenantId) {
      throw new TenantMismatchException();
    }

    if (item.tenderId !== this.id) {
       throw new BusinessRuleException('Item does not belong to this tender', 'INVALID_TENDER_ID');
    }

    const exists = this._items.find(i => i.number === item.number);
    if (exists) {
      throw new BusinessRuleException(`Item with number ${item.number} already exists`, 'DUPLICATE_ITEM_NUMBER');
    }

    this._items.push(item);
  }

  public removeItem(itemNumber: number, tenantId: string): void {
    this.ensureTenant(tenantId);
    if (this._status === 'SUBMITTED' || this._status === 'DISPUTE') {
      throw new BusinessRuleException('Cannot modify items when tender is submitted or in dispute', 'PROPOSAL_ALREADY_SUBMITTED');
    }
    this._items = this._items.filter(i => i.number !== itemNumber);
  }

  public registerDispute(dispute: TenderDispute, tenantId: string): void {
    this.ensureTenant(tenantId);
    if (dispute.tenantId !== this.tenantId) {
      throw new TenantMismatchException();
    }
    if (dispute.tenderId !== this.id) {
      throw new BusinessRuleException('Dispute does not belong to this tender', 'INVALID_TENDER_ID');
    }
    this._dispute = dispute;
  }

  private hasWinner(): boolean {
    return this._items.some(i => i.winner === true);
  }

  private ensureTenant(tenantId: string): void {
    if (this.tenantId !== tenantId) {
      throw new TenantMismatchException();
    }
  }
}
