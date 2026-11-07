import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.sec_edgar import FinancialNormalizerEngine
from app.models.schemas import RawFinancialInput

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Phase 1" in data["phase"]

def test_normalization_engine_math():
    raw_input = RawFinancialInput(
        ticker="TESTCO",
        fiscal_year=2023,
        revenue=100.0,
        operating_income=20.0,
        depreciation_amortization=5.0,
        stock_based_compensation=2.0,
        restructuring_costs=1.0,
        litigation_reserve=0.5,
        other_one_offs=0.0,
        current_assets=40.0,
        current_liabilities=25.0,
        total_debt=60.0,
        interest_expense=4.0
    )
    res = FinancialNormalizerEngine.normalize_single_period(raw_input)
    
    # 1. Reported EBITDA = EBIT (20) + D&A (5) = 25.0
    assert res.reported_ebitda == 25.0
    
    # 2. Addbacks = 2.0 + 1.0 + 0.5 = 3.5
    assert res.total_qoe_addbacks == 3.5
    
    # 3. Normalized EBITDA = 25.0 + 3.5 = 28.5
    assert res.normalized_ebitda == 28.5
    
    # 4. Working Capital = 40.0 - 25.0 = 15.0
    assert res.working_capital == 15.0
    assert res.working_capital_pct_revenue == 15.0
    
    # 5. Debt to EBITDA = 60.0 / 28.5 = 2.11
    assert round(res.debt_to_ebitda, 2) == 2.11
    assert res.covenant_compliance["leverage_under_4_5x"] is True
    
    # 6. Interest Coverage = 28.5 / 4.0 = 7.125 -> 7.12
    assert round(res.interest_coverage, 2) == 7.12
    assert res.covenant_compliance["interest_coverage_over_3_0x"] is True

def test_get_sec_targets():
    response = client.get("/api/sec/targets")
    assert response.status_code == 200
    targets = response.json()
    assert len(targets) >= 3
    tickers = [t["ticker"] for t in targets]
    assert "APOLLO" in tickers
    assert "BEACON" in tickers
    assert "PRECISION" in tickers

def test_get_company_filings():
    response = client.get("/api/sec/company/APOLLO")
    assert response.status_code == 200
    data = response.json()
    assert data["ticker"] == "APOLLO"
    assert len(data["historical_periods"]) == 3
    
    latest = data["historical_periods"][-1]
    assert latest["fiscal_year"] == 2023
    assert latest["revenue"] == 250.0
    assert latest["normalized_ebitda"] == 59.8
    assert latest["working_capital"] == 47.0

def test_api_normalize_endpoint():
    payload = {
        "ticker": "HEALTHCO",
        "fiscal_year": 2023,
        "revenue": 500.0,
        "operating_income": 75.0,
        "depreciation_amortization": 25.0,
        "stock_based_compensation": 5.0,
        "restructuring_costs": 3.0,
        "litigation_reserve": 2.0,
        "other_one_offs": 0.0,
        "current_assets": 120.0,
        "current_liabilities": 70.0,
        "total_debt": 330.0,
        "interest_expense": 22.0
    }
    response = client.post("/api/sec/normalize", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["reported_ebitda"] == 100.0
    assert result["normalized_ebitda"] == 110.0
    assert result["working_capital"] == 50.0
    assert result["debt_to_ebitda"] == 3.0
    assert result["covenant_compliance"]["leverage_under_4_5x"] is True

def test_database_persistence():
    response = client.get("/api/sec/database/records")
    assert response.status_code == 200
    records = response.json()
    assert len(records) >= 3

