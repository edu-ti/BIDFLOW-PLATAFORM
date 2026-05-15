export interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  userId: string;
  auctionId: string;
}

export interface CreateBidDto {
  amount: number;
  userId: string;
  auctionId: string;
}

export interface BidWithUser extends Bid {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BidWithAuction extends Bid {
  auction: {
    id: string;
    title: string;
    currentPrice: number;
  };
}