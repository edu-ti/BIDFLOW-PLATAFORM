import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import analytics, auctions, bids, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


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


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", "3002"))
    uvicorn.run(app, host="0.0.0.0", port=port)