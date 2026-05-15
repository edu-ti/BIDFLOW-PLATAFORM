from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Bid, Auction

router = APIRouter()


@router.get("/")
def get_bids(
    skip: int = 0,
    limit: int = 10,
    auction_id: str = None,
    user_id: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Bid)

    if auction_id:
        query = query.filter(Bid.auction_id == auction_id)
    if user_id:
        query = query.filter(Bid.user_id == user_id)

    total = query.count()
    bids = query.order_by(Bid.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "bids": [
            {
                "id": b.id,
                "amount": float(b.amount),
                "created_at": b.created_at.isoformat(),
                "auction_id": b.auction_id,
                "user_id": b.user_id,
            }
            for b in bids
        ],
    }


@router.get("/recent")
def get_recent_bids(hours: int = Query(default=24, le=168), db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(hours=hours)
    bids = (
        db.query(Bid)
        .filter(Bid.created_at >= since)
        .order_by(Bid.created_at.desc())
        .all()
    )

    return {
        "count": len(bids),
        "bids": [
            {
                "id": b.id,
                "amount": float(b.amount),
                "created_at": b.created_at.isoformat(),
                "auction_id": b.auction_id,
            }
            for b in bids
        ],
    }


@router.get("/user/{user_id}")
def get_user_bids(user_id: str, db: Session = Depends(get_db)):
    bids = (
        db.query(Bid)
        .filter(Bid.user_id == user_id)
        .order_by(Bid.created_at.desc())
        .all()
    )

    total_spent = sum(float(b.amount) for b in bids)

    return {
        "total_bids": len(bids),
        "total_spent": total_spent,
        "bids": [
            {
                "id": b.id,
                "amount": float(b.amount),
                "created_at": b.created_at.isoformat(),
                "auction_id": b.auction_id,
            }
            for b in bids
        ],
    }