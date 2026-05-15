from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal


class UserBase(BaseModel):
    email: str
    name: str


class UserCreate(UserBase):
    role: Optional[str] = "USER"


class UserResponse(UserBase):
    id: str
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuctionBase(BaseModel):
    title: str
    description: str
    start_price: Decimal
    start_date: datetime
    end_date: datetime


class AuctionCreate(AuctionBase):
    user_id: str


class AuctionResponse(AuctionBase):
    id: str
    current_price: Decimal
    status: str
    created_at: datetime
    updated_at: datetime
    user_id: str

    class Config:
        from_attributes = True


class BidBase(BaseModel):
    amount: Decimal


class BidCreate(BidBase):
    user_id: str
    auction_id: str


class BidResponse(BidBase):
    id: str
    created_at: datetime
    user_id: str
    auction_id: str

    class Config:
        from_attributes = True


class AuctionStats(BaseModel):
    total_auctions: int
    active_auctions: int
    completed_auctions: int
    total_value: Decimal
    average_price: Decimal


class BidStats(BaseModel):
    total_bids: int
    average_bid: Decimal
    highest_bid: Decimal
    bids_per_auction: float


class DashboardSummary(BaseModel):
    total_users: int
    total_auctions: int
    active_auctions: int
    total_bids: int
    total_revenue: Decimal
    recent_activity: list