from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Auction, Bid, User
from app.schemas import AuctionStats, BidStats

router = APIRouter()


@router.get("/auctions/stats", response_model=AuctionStats)
def get_auction_stats(db: Session = Depends(get_db)):
    auctions = db.query(Auction).all()

    total = len(auctions)
    active = len([a for a in auctions if a.status == "ACTIVE"])
    completed = len([a for a in auctions if a.status == "COMPLETED"])

    total_value = sum(float(a.current_price or 0) for a in auctions)
    avg_price = total_value / total if total > 0 else 0

    return AuctionStats(
        total_auctions=total,
        active_auctions=active,
        completed_auctions=completed,
        total_value=total_value,
        average_price=avg_price,
    )


@router.get("/bids/stats", response_model=BidStats)
def get_bid_stats(db: Session = Depends(get_db)):
    bids = db.query(Bid).all()

    if not bids:
        return BidStats(
            total_bids=0,
            average_bid=0,
            highest_bid=0,
            bids_per_auction=0,
        )

    total = len(bids)
    amounts = [float(b.amount) for b in bids]
    avg = sum(amounts) / total
    highest = max(amounts)

    auctions_with_bids = len(set(b.auction_id for b in bids))
    bids_per_auction = total / auctions_with_bids if auctions_with_bids > 0 else 0

    return BidStats(
        total_bids=total,
        average_bid=avg,
        highest_bid=highest,
        bids_per_auction=bids_per_auction,
    )


@router.get("/revenue")
def get_revenue_stats(db: Session = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    recent_bids = db.query(Bid).filter(Bid.created_at >= thirty_days_ago).all()
    total_revenue = sum(float(b.amount) for b in recent_bids)

    daily_revenue = {}
    for bid in recent_bids:
        day = bid.created_at.strftime("%Y-%m-%d")
        daily_revenue[day] = daily_revenue.get(day, 0) + float(b.amount)

    return {
        "total_revenue_30d": total_revenue,
        "daily_revenue": daily_revenue,
    }