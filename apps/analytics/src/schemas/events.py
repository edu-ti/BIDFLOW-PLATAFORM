from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BidPlacedPayload(BaseModel):
    tenderId: str
    supplierId: str
    amount: float

class BidPlacedEvent(BaseModel):
    eventId: str
    aggregateId: str
    tenantId: str
    type: str
    occurredAt: datetime
    payload: BidPlacedPayload
