from sqlalchemy import Column, String, Integer, Numeric, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    MANAGER = "MANAGER"


class AuctionStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.USER)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    auctions = relationship("Auction", back_populates="user")
    bids = relationship("Bid", back_populates="user")


class Auction(Base):
    __tablename__ = "auctions"

    id = Column(String, primary_key=True)
    title = Column(String)
    description = Column(String)
    start_price = Column(Numeric(10, 2))
    current_price = Column(Numeric(10, 2))
    status = Column(Enum(AuctionStatus), default=AuctionStatus.PENDING)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    user_id = Column(String, ForeignKey("users.id"))

    user = relationship("User", back_populates="auctions")
    bids = relationship("Bid", back_populates="auction")


class Bid(Base):
    __tablename__ = "bids"

    id = Column(String, primary_key=True)
    amount = Column(Numeric(10, 2))
    created_at = Column(DateTime, default=func.now())
    user_id = Column(String, ForeignKey("users.id"))
    auction_id = Column(String, ForeignKey("auctions.id", ondelete="CASCADE"))

    user = relationship("User", back_populates="bids")
    auction = relationship("Auction", back_populates="bids")