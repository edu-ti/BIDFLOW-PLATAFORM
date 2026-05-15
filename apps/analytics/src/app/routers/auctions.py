from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Auction, Bid

router = APIRouter()


@router.get("/")
def get_auctions(
    skip: int = 0,
    limit: int = 10,
    status: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Auction)

    if status:
        query = query.filter(Auction.status == status)

    total = query.count()
    auctions = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "auctions": [
            {
                "id": a.id,
                "title": a.title,
                "status": a.status.value if a.status else None,
                "current_price": float(a.current_price) if a.current_price else 0,
                "bid_count": len(a.bids),
                "end_date": a.end_date.isoformat() if a.end_date else None,
            }
            for a in auctions
        ],
    }


@router.get("/{auction_id}")
def get_auction_detail(auction_id: str, db: Session = Depends(get_db)):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()

    if not auction:
        return {"error": "Auction not found"}

    bids = db.query(Bid).filter(Bid.auction_id == auction_id).order_by(Bid.created_at.desc()).all()

    return {
        "id": auction.id,
        "title": auction.title,
        "description": auction.description,
        "status": auction.status.value if auction.status else None,
        "start_price": float(auction.start_price) if auction.start_price else 0,
        "current_price": float(auction.current_price) if auction.current_price else 0,
        "start_date": auction.start_date.isoformat() if auction.start_date else None,
        "end_date": auction.end_date.isoformat() if auction.end_date else None,
        "bid_count": len(bids),
        "bids": [
            {
                "id": b.id,
                "amount": float(b.amount),
                "created_at": b.created_at.isoformat(),
                "user_id": b.user_id,
            }
            for b in bids
        ],
    }


@router.get("/top/performance")
def get_top_auctions(db: Session = Depends(get_db)):
    auctions = (
        db.query(Auction)
        .join(Bid)
        .group_by(Auction.id)
        .order_by(func.count(Bid.id).desc())
        .limit(10)
        .all()
    )

    return {
        "auctions": [
            {
                "id": a.id,
                "title": a.title,
                "current_price": float(a.current_price) if a.current_price else 0,
                "bid_count": len(a.bids),
            }
            for a in auctions
        ]
    }