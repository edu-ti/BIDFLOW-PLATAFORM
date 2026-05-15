import { AuctionStatus } from './index';
import { Bid } from './bid';

export interface Auction {
  id: string;
  title: string;
  description: string;
  startPrice: number;
  currentPrice: number;
  status: AuctionStatus;
  startDate: string;
  endDate: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    bids: number;
  };
}

export interface CreateAuctionDto {
  title: string;
  description: string;
  startPrice: number;
  startDate: string;
  endDate: string;
  userId: string;
}

export interface UpdateAuctionDto {
  title?: string;
  description?: string;
  startPrice?: number;
  currentPrice?: number;
  status?: AuctionStatus;
  startDate?: string;
  endDate?: string;
}

export interface AuctionWithBids extends Auction {
  bids: Bid[];
}