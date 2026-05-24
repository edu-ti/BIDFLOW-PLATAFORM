import pandas as pd
from typing import Dict, List, Any
from datetime import datetime

class BidStreamProcessor:
    def __init__(self):
        # Dictionary structure: { "tenant_id": { "tender_id": pd.DataFrame } }
        self._streams: Dict[str, Dict[str, pd.DataFrame]] = {}

    def ingest_bid(self, tenant_id: str, tender_id: str, supplier_id: str, amount: float, timestamp: datetime) -> None:
        if tenant_id not in self._streams:
            self._streams[tenant_id] = {}
        
        if tender_id not in self._streams[tenant_id]:
            self._streams[tenant_id][tender_id] = pd.DataFrame(columns=["timestamp", "supplier_id", "amount"])

        df = self._streams[tenant_id][tender_id]
        
        # Ingest new record
        new_record = pd.DataFrame([{
            "timestamp": pd.to_datetime(timestamp),
            "supplier_id": supplier_id,
            "amount": float(amount)
        }])
        
        # Concat and sort
        updated_df = pd.concat([df, new_record], ignore_index=True)
        updated_df = updated_df.sort_values(by="timestamp").reset_index(drop=True)
        self._streams[tenant_id][tender_id] = updated_df

    def get_behavior_analytics(self, tenant_id: str, tender_id: str) -> Dict[str, Any]:
        if tenant_id not in self._streams or tender_id not in self._streams[tenant_id]:
            return {
                "depreciation_curve": [],
                "reaction_times_seconds": {},
                "efficiency_ranking": []
            }

        df = self._streams[tenant_id][tender_id]
        if df.empty:
            return {
                "depreciation_curve": [],
                "reaction_times_seconds": {},
                "efficiency_ranking": []
            }

        # 1. Depreciation Curve (ritmo de queda do valor)
        # Assuming bits are sorted by timestamp
        depreciation_curve = df[["timestamp", "amount"]].copy()
        depreciation_curve["timestamp"] = pd.to_datetime(depreciation_curve["timestamp"]).apply(lambda x: x.isoformat())
        curve_data = depreciation_curve.to_dict(orient="records")

        # 2. Average Reaction Time by Supplier
        # Calculate time diff between consecutive bids
        df["timestamp_dt"] = pd.to_datetime(df["timestamp"])
        df["time_diff"] = df["timestamp_dt"].diff().dt.total_seconds()
        
        # We only consider reaction time if the previous bid was from a DIFFERENT supplier
        # Shift supplier_id to see the previous bidder
        df["prev_supplier_id"] = df["supplier_id"].shift(1)
        
        # Filter where current supplier is different from previous
        reaction_df = df[df["supplier_id"] != df["prev_supplier_id"]].dropna(subset=["time_diff"])
        
        reaction_times = {}
        if not reaction_df.empty:
            # Group by supplier to get average reaction time
            avg_reactions = reaction_df.groupby("supplier_id")["time_diff"].mean()
            reaction_times = avg_reactions.round(2).to_dict()

        # 3. Dynamic Efficiency Ranking (Quem força mais reduções)
        # Drop is the difference between previous bid and current bid
        df["amount_drop"] = df["amount"].shift(1) - df["amount"]
        
        # Again, only consider drops when beating a different supplier, or just sum total drops
        # Here we just sum all drops by supplier
        drop_df = df.dropna(subset=["amount_drop"])
        
        efficiency_ranking = []
        if not drop_df.empty:
            drops_by_supplier = drop_df.groupby("supplier_id")["amount_drop"].sum()
            # Sort descending
            drops_by_supplier = drops_by_supplier.sort_values(ascending=False)
            
            for supplier, total_drop in drops_by_supplier.items():
                efficiency_ranking.append({
                    "supplier_id": supplier,
                    "total_price_drop": round(float(total_drop), 2)
                })

        return {
            "depreciation_curve": curve_data,
            "reaction_times_seconds": reaction_times,
            "efficiency_ranking": efficiency_ranking
        }

# Global singleton instance for the FastAPI app to use
bid_stream_processor = BidStreamProcessor()
