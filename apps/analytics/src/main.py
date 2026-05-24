import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import asyncio
from app.database import init_db
from app.routers import analytics, auctions, bids, dashboard
from consumers.tender_events_consumer import consumer_instance
from analytics.bid_processor import bid_stream_processor
from fastapi import Header, HTTPException

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Start RabbitMQ Consumer in background
    consumer_task = asyncio.create_task(consumer_instance.start_consuming())
    yield
    # Graceful shutdown
    consumer_task.cancel()
    await consumer_instance.stop()


app = FastAPI(
    title="BidFlow Analytics API",
    description="BidFlow Platform Analytics and Reporting Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(auctions.router, prefix="/api/v1/analytics/auctions", tags=["Auction Analytics"])
app.include_router(bids.router, prefix="/api/v1/analytics/bids", tags=["Bid Analytics"])
app.include_router(dashboard.router, prefix="/api/v1/analytics/dashboard", tags=["Dashboard"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "analytics"}


@app.get("/analytics/tenders/{tender_id}/behavior", tags=["Tender Behavior"])
async def get_tender_behavior(tender_id: str, x_tenant_id: str = Header(None, alias="X-Tenant-ID")):
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="X-Tenant-ID header is required")
        
    metrics = bid_stream_processor.get_behavior_analytics(tenant_id=x_tenant_id, tender_id=tender_id)
    return metrics


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", "3002"))
    uvicorn.run(app, host="0.0.0.0", port=port)