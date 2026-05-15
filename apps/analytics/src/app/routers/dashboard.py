from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, Auction, Bid

router = APIRouter()


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_auctions = db.query(Auction).count()
    active_auctions = db.query(Auction).filter(Auction.status == "ACTIVE").count()
    total_bids = db.query(Bid).count()

    all_auctions = db.query(Auction).all()
    total_revenue = sum(float(a.current_price or 0) for a in all_auctions if a.status == "COMPLETED")

    return {
        "total_users": total_users,
        "total_auctions": total_auctions,
        "active_auctions": active_auctions,
        "total_bids": total_bids,
        "total_revenue": total_revenue,
    }


@router.get("/activity")
def get_recent_activity(db: Session = Depends(get_db)):
    recent_bids = (
        db.query(Bid)
        .order_by(Bid.created_at.desc())
        .limit(10)
        .all()
    )

    activity = []
    for bid in recent_bids:
        auction = db.query(Auction).filter(Auction.id == bid.auction_id).first()
        activity.append({
            "type": "bid",
            "id": bid.id,
            "amount": float(bid.amount),
            "auction_title": auction.title if auction else "Unknown",
            "created_at": bid.created_at.isoformat(),
        })

    return {"activity": activity}


@router.get("/charts/auctions-by-status")
def get_auctions_by_status(db: Session = Depends(get_db)):
    status_counts = (
        db.query(Auction.status, func.count(Auction.id))
        .group_by(Auction.status)
        .all()
    )

    return {
        "labels": [s.value if s else "UNKNOWN" for s, _ in status_counts],
        "data": [count for _, count in status_counts],
    }


@router.get("/charts/revenue-trend")
def get_revenue_trend(days: int = 30, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)

    bids = db.query(Bid).filter(Bid.created_at >= since).all()

    daily_revenue = {}
    for bid in bids:
        day = bid.created_at.strftime("%Y-%m-%d")
        daily_revenue[day] = daily_revenue.get(day, 0) + float(b.amount)

    return {
        "labels": list(daily_revenue.keys()),
        "data": list(daily_revenue.values()),
    }