import { Entity } from '../../abstractions/entity';
import { BidAmount } from '../../value-objects/bid-amount.vo';
import { BusinessRuleException } from '../../exceptions';

export type DisputeStatus = 'SCHEDULED' | 'OPEN' | 'EXTENDED' | 'CLOSED' | 'CANCELLED';

export interface TenderDisputeBidProps {
  id: string;
  tenantId: string;
  disputeId: string;
  supplierId: string;
  amount: number;
  previousAmount?: number;
  isAutomatic?: boolean;
  isWinner?: boolean;
  timestamp?: Date;
  round: number;
}

export class TenderDisputeBid extends Entity<string> {
  public readonly id: string;
  public readonly tenantId: string;

  private _disputeId: string;
  private _supplierId: string;
  private _amount: BidAmount;
  private _previousAmount?: BidAmount;
  private _isAutomatic: boolean;
  private _isWinner?: boolean;
  private _timestamp: Date;
  private _round: number;

  constructor(props: TenderDisputeBidProps) {
    super();
    this.id = props.id;
    this.tenantId = props.tenantId;
    this._disputeId = props.disputeId;
    this._supplierId = props.supplierId;
    this._amount = new BidAmount(props.amount);
    
    if (props.previousAmount !== undefined) {
      this._previousAmount = new BidAmount(props.previousAmount);
      if (!this._amount.isLessThan(this._previousAmount)) {
        throw new BusinessRuleException('New bid amount must be less than previous amount', 'INVALID_BID_AMOUNT');
      }
    }

    this._isAutomatic = props.isAutomatic ?? false;
    this._isWinner = props.isWinner;
    this._timestamp = props.timestamp || new Date();
    this._round = props.round;
  }

  get disputeId() { return this._disputeId; }
  get supplierId() { return this._supplierId; }
  get amount() { return this._amount; }
  get previousAmount() { return this._previousAmount; }
  get isAutomatic() { return this._isAutomatic; }
  get isWinner() { return this._isWinner; }
  get timestamp() { return this._timestamp; }
  get round() { return this._round; }
}

export interface TenderDisputeProps {
  id: string;
  tenantId: string;
  tenderId: string;
  status: DisputeStatus;
  startPrice: number;
  currentPrice: number;
  minDecrement: number;
  extensionTime?: number;
  startedAt?: Date;
  closedAt?: Date;
  winnerId?: string;
  winnerAmount?: number;
  totalBids?: number;
  extensions?: number;
  metadata?: any;
}

export class TenderDispute extends Entity<string> {
  public readonly id: string;
  public readonly tenantId: string;

  private _tenderId: string;
  private _status: DisputeStatus;
  private _startPrice: BidAmount;
  private _currentPrice: BidAmount;
  private _minDecrement: BidAmount;
  private _extensionTime: number; // in seconds
  private _startedAt?: Date;
  private _closedAt?: Date;
  private _winnerId?: string;
  private _winnerAmount?: BidAmount;
  private _totalBids: number;
  private _extensions: number;
  private _metadata: any;

  private _bids: TenderDisputeBid[] = [];

  constructor(props: TenderDisputeProps) {
    super();
    this.id = props.id;
    this.tenantId = props.tenantId;
    this._tenderId = props.tenderId;
    this._status = props.status;
    
    this._startPrice = new BidAmount(props.startPrice);
    this._currentPrice = new BidAmount(props.currentPrice);
    this._minDecrement = new BidAmount(props.minDecrement);
    
    if (this._minDecrement.amount <= 0) {
      throw new BusinessRuleException('Minimum decrement must be greater than 0', 'INVALID_MIN_DECREMENT');
    }

    if (!this._currentPrice.isLessThanOrEqual(this._startPrice)) {
      throw new BusinessRuleException('Current price must be less than or equal to start price', 'INVALID_CURRENT_PRICE');
    }

    if (this._status === 'OPEN' && !props.startedAt) {
      throw new BusinessRuleException('startedAt must be provided when status is OPEN', 'MISSING_STARTED_AT');
    }

    if (this._status === 'CLOSED' && !props.closedAt) {
      throw new BusinessRuleException('closedAt must be provided when status is CLOSED', 'MISSING_CLOSED_AT');
    }

    this._extensionTime = props.extensionTime ?? 180;
    this._startedAt = props.startedAt;
    this._closedAt = props.closedAt;
    this._winnerId = props.winnerId;
    
    if (props.winnerAmount !== undefined) {
      this._winnerAmount = new BidAmount(props.winnerAmount);
    }
    
    this._totalBids = props.totalBids || 0;
    this._extensions = props.extensions || 0;
    this._metadata = props.metadata || {};
  }

  // Getters
  get tenderId() { return this._tenderId; }
  get status() { return this._status; }
  get startPrice() { return this._startPrice; }
  get currentPrice() { return this._currentPrice; }
  get minDecrement() { return this._minDecrement; }
  get extensionTime() { return this._extensionTime; }
  get startedAt() { return this._startedAt; }
  get closedAt() { return this._closedAt; }
  get winnerId() { return this._winnerId; }
  get winnerAmount() { return this._winnerAmount; }
  get totalBids() { return this._totalBids; }
  get extensions() { return this._extensions; }
  get metadata() { return this._metadata; }
  get bids(): ReadonlyArray<TenderDisputeBid> { return this._bids; }

  // Business logic
  public open(): void {
    if (this._status !== 'SCHEDULED') {
      throw new BusinessRuleException('Only SCHEDULED dispute can be OPENED', 'INVALID_STATE');
    }
    this._status = 'OPEN';
    this._startedAt = new Date();
  }

  public close(): void {
    if (this._status !== 'OPEN' && this._status !== 'EXTENDED') {
      throw new BusinessRuleException('Only OPEN or EXTENDED dispute can be CLOSED', 'INVALID_STATE');
    }
    this._status = 'CLOSED';
    this._closedAt = new Date();
  }

  public registerBid(bidId: string, supplierId: string, amount: number, isAutomatic: boolean = false): void {
    if (this._status !== 'OPEN' && this._status !== 'EXTENDED') {
      throw new BusinessRuleException('Bids can only be registered when dispute is OPEN or EXTENDED', 'DISPUTE_NOT_OPEN');
    }

    const proposedAmount = new BidAmount(amount);

    if (!proposedAmount.hasMinimumDecrement(this._currentPrice, this._minDecrement)) {
      throw new BusinessRuleException('Bid is below the minimum decrement allowed', 'BID_BELOW_MIN_DECREMENT');
    }

    const previousAmount = this._currentPrice.amount;
    const round = this._bids.length + 1;

    const bid = new TenderDisputeBid({
      id: bidId,
      tenantId: this.tenantId,
      disputeId: this.id,
      supplierId: supplierId,
      amount: amount,
      previousAmount: previousAmount,
      isAutomatic: isAutomatic,
      round: round
    });

    this._bids.push(bid);
    this._currentPrice = proposedAmount;
    this._totalBids += 1;
  }

  public extend(): void {
    if (this._status !== 'OPEN' && this._status !== 'EXTENDED') {
      throw new BusinessRuleException('Cannot extend a closed or cancelled dispute', 'INVALID_STATE');
    }
    this._status = 'EXTENDED';
    this._extensions += 1;
  }
}
