import pytest
from datetime import datetime, timedelta
from typing import Dict, Any

from src.analytics.bid_processor import BidStreamProcessor
from src.schemas.events import BidPlacedEvent, BidPlacedPayload

# Common Fixtures
@pytest.fixture
def processor():
    """Provides a fresh instance of BidStreamProcessor for each test."""
    return BidStreamProcessor()

@pytest.fixture
def default_tenant():
    return "tenant-test-123"

@pytest.fixture
def default_tender():
    return "tender-abc-999"

@pytest.fixture
def base_time():
    """Returns a fixed base datetime to make time math predictable."""
    return datetime(2026, 5, 22, 10, 0, 0)

def create_mock_event(tenant_id: str, tender_id: str, supplier_id: str, amount: float, time: datetime) -> BidPlacedEvent:
    """Helper to generate a valid BidPlacedEvent payload"""
    return BidPlacedEvent(
        eventId="event-1",
        aggregateId=tender_id,
        tenantId=tenant_id,
        type="bidflow.tender.v1.bid_placed",
        occurredAt=time,
        payload=BidPlacedPayload(
            tenderId=tender_id,
            supplierId=supplier_id,
            amount=amount
        )
    )

def test_edge_case_first_bid(processor: BidStreamProcessor, default_tenant: str, default_tender: str, base_time: datetime):
    """
    Teste de Borda (O Primeiro Lance): O pipeline deve tratar o cálculo de diferença temporal de forma graciosa, 
    sem estourar exceções de KeyError ou retornar valores infinitos.
    """
    event = create_mock_event(default_tenant, default_tender, "supplier-A", 10000.0, base_time)
    
    # Ingest the very first bid
    processor.ingest_bid(
        tenant_id=event.tenantId,
        tender_id=event.payload.tenderId,
        supplier_id=event.payload.supplierId,
        amount=event.payload.amount,
        timestamp=event.occurredAt
    )
    
    analytics = processor.get_behavior_analytics(default_tenant, default_tender)
    
    # Validations
    assert isinstance(analytics, dict)
    
    # 1. Depreciation Curve should have 1 point
    assert len(analytics["depreciation_curve"]) == 1
    assert analytics["depreciation_curve"][0]["amount"] == 10000.0
    
    # 2. Reaction times should be empty because there is only one bid (no reaction yet)
    assert analytics["reaction_times_seconds"] == {}
    
    # 3. Efficiency ranking should be empty (no drops yet)
    assert analytics["efficiency_ranking"] == []


def test_depreciation_curve(processor: BidStreamProcessor, default_tenant: str, default_tender: str, base_time: datetime):
    """
    Teste da Curva de Depreciação: Injete uma série de 3 lances decrescentes com timestamps ordenados 
    e valide se o Pandas calcula corretamente a taxa e o histórico de queda livre do preço.
    """
    events = [
        create_mock_event(default_tenant, default_tender, "supplier-A", 10000.0, base_time),
        create_mock_event(default_tenant, default_tender, "supplier-B", 9500.0, base_time + timedelta(seconds=10)),
        create_mock_event(default_tenant, default_tender, "supplier-A", 9000.0, base_time + timedelta(seconds=25)),
    ]
    
    for evt in events:
        processor.ingest_bid(
            tenant_id=evt.tenantId,
            tender_id=evt.payload.tenderId,
            supplier_id=evt.payload.supplierId,
            amount=evt.payload.amount,
            timestamp=evt.occurredAt
        )
        
    analytics = processor.get_behavior_analytics(default_tenant, default_tender)
    curve = analytics["depreciation_curve"]
    
    assert len(curve) == 3
    assert curve[0]["amount"] == 10000.0
    assert curve[1]["amount"] == 9500.0
    assert curve[2]["amount"] == 9000.0
    
    # Ensure timestamps are ISO formatted strings
    assert isinstance(curve[0]["timestamp"], str)
    assert curve[0]["timestamp"] == base_time.isoformat()


def test_reaction_time_detection(processor: BidStreamProcessor, default_tenant: str, default_tender: str, base_time: datetime):
    """
    Teste do Tempo de Reação (Detecção de Bots): Monte um cenário onde o Fornecedor B responde a um lance 
    do Fornecedor A em exatamente 0.5 segundos. Garanta que a métrica capture essa diferença milimetricamente.
    """
    events = [
        create_mock_event(default_tenant, default_tender, "supplier-A", 5000.0, base_time),
        # Supplier B is a bot, reacts in exactly 0.5s
        create_mock_event(default_tenant, default_tender, "supplier-B", 4950.0, base_time + timedelta(seconds=0.5)),
        # Supplier A thinks about it for 10 seconds
        create_mock_event(default_tenant, default_tender, "supplier-A", 4800.0, base_time + timedelta(seconds=10.5)),
        # Supplier B bot reacts again in 0.5s
        create_mock_event(default_tenant, default_tender, "supplier-B", 4750.0, base_time + timedelta(seconds=11.0)),
    ]
    
    for evt in events:
        processor.ingest_bid(
            tenant_id=evt.tenantId,
            tender_id=evt.payload.tenderId,
            supplier_id=evt.payload.supplierId,
            amount=evt.payload.amount,
            timestamp=evt.occurredAt
        )
        
    analytics = processor.get_behavior_analytics(default_tenant, default_tender)
    reaction_times = analytics["reaction_times_seconds"]
    
    # B has two reactions of 0.5s. Average is 0.5.
    assert "supplier-B" in reaction_times
    assert reaction_times["supplier-B"] == 0.5
    
    # A has one reaction of 10.0s
    assert "supplier-A" in reaction_times
    assert reaction_times["supplier-A"] == 10.0
    
    # Asserting types (Pandas float types should be converted to native Python floats implicitly or explicitly in dict output)
    assert isinstance(reaction_times["supplier-B"], float)


def test_efficiency_ranking(processor: BidStreamProcessor, default_tenant: str, default_tender: str, base_time: datetime):
    """
    Teste do Ranking de Eficiência: Valide se o sumatório acumulado de pressão financeira 
    (redução de preço provocada por cada player) ordena corretamente os competidores mais agressivos.
    """
    events = [
        create_mock_event(default_tenant, default_tender, "supplier-A", 1000.0, base_time),
        create_mock_event(default_tenant, default_tender, "supplier-B", 900.0, base_time + timedelta(seconds=5)),  # Drop = 100
        create_mock_event(default_tenant, default_tender, "supplier-C", 750.0, base_time + timedelta(seconds=10)), # Drop = 150
        create_mock_event(default_tenant, default_tender, "supplier-B", 700.0, base_time + timedelta(seconds=15)), # Drop = 50
        create_mock_event(default_tenant, default_tender, "supplier-A", 400.0, base_time + timedelta(seconds=20)), # Drop = 300
    ]
    
    for evt in events:
        processor.ingest_bid(
            tenant_id=evt.tenantId,
            tender_id=evt.payload.tenderId,
            supplier_id=evt.payload.supplierId,
            amount=evt.payload.amount,
            timestamp=evt.occurredAt
        )
        
    analytics = processor.get_behavior_analytics(default_tenant, default_tender)
    ranking = analytics["efficiency_ranking"]
    
    # Expectation logic:
    # A initial 1000 (no drop)
    # B drops 1000 -> 900 (Drop = 100)
    # C drops 900 -> 750 (Drop = 150)
    # B drops 750 -> 700 (Drop = 50)  -- Total B = 150
    # A drops 700 -> 400 (Drop = 300) -- Total A = 300
    
    # Ranking should be: 
    # 1. A (300)
    # 2. C (150) or B (150) [Order for ties depends on pandas, but we can check existence/value]
    
    assert len(ranking) == 3
    
    # Validate the most aggressive is A
    assert ranking[0]["supplier_id"] == "supplier-A"
    assert ranking[0]["total_price_drop"] == 300.0
    
    # Map the rest for easy checking
    drops_map = {item["supplier_id"]: item["total_price_drop"] for item in ranking}
    assert drops_map["supplier-B"] == 150.0
    assert drops_map["supplier-C"] == 150.0
    assert drops_map["supplier-A"] == 300.0

def test_missing_tenant_or_tender_returns_empty(processor: BidStreamProcessor):
    """
    Teste que garante o retorno estruturado vazio caso o tenantId ou tenderId 
    solicitados ainda não possuam nenhum lance processado.
    """
    analytics = processor.get_behavior_analytics("tenant-404", "tender-404")
    
    assert analytics["depreciation_curve"] == []
    assert analytics["reaction_times_seconds"] == {}
    assert analytics["efficiency_ranking"] == []
