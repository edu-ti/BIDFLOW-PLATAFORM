import { Entity } from '../../abstractions/entity';
import { BusinessRuleException } from '../../exceptions';

export interface TenderItemProps {
  id: string;
  tenantId: string;
  tenderId: string;
  number: number;
  description: string;
  quantity: number;
  unit: string;
  estimatedValue?: number;
  proposalValue?: number;
  bidValue?: number;
  category?: string;
  specifications?: any;
  hasDispute?: boolean;
  winner?: boolean;
}

export class TenderItem extends Entity<string> {
  public readonly id: string;
  public readonly tenantId: string;

  private _tenderId: string;
  private _number: number;
  private _description: string;
  private _quantity: number;
  private _unit: string;
  private _estimatedValue?: number;
  private _proposalValue?: number;
  private _bidValue?: number;
  private _category?: string;
  private _specifications?: any;
  private _hasDispute: boolean;
  private _winner?: boolean;

  constructor(props: TenderItemProps) {
    super();
    this.id = props.id;
    this.tenantId = props.tenantId;
    this._tenderId = props.tenderId;
    this._number = props.number;
    this._description = props.description;
    this._quantity = props.quantity;
    this._unit = props.unit;
    this._estimatedValue = props.estimatedValue;
    this._proposalValue = props.proposalValue;
    this._bidValue = props.bidValue;
    this._category = props.category;
    this._specifications = props.specifications;
    this._hasDispute = props.hasDispute ?? false;
    this._winner = props.winner;

    if (this._quantity <= 0) {
      throw new BusinessRuleException('Item quantity must be greater than zero', 'INVALID_QUANTITY');
    }
  }

  // Getters for read-only access
  get tenderId() { return this._tenderId; }
  get number() { return this._number; }
  get description() { return this._description; }
  get quantity() { return this._quantity; }
  get unit() { return this._unit; }
  get estimatedValue() { return this._estimatedValue; }
  get proposalValue() { return this._proposalValue; }
  get bidValue() { return this._bidValue; }
  get category() { return this._category; }
  get specifications() { return this._specifications; }
  get hasDispute() { return this._hasDispute; }
  get winner() { return this._winner; }

  // Expose methods for state transitions
  public markAsWinner(): void {
    this._winner = true;
  }
}
