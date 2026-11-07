import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.sec_edgar import FinancialNormalizerEngine
from app.models.schemas import RawFinancialInput
from app.database import init_db, SessionLocal, CompanyModel

def run_all_tests():
    print("================ PHASE 1 VALIDATION SUITE ================")
    
    # 1. Test Normalization Engine Math
    print("[1/5] Testing Quality of Earnings (QoE) & EBITDA Normalization...")
    raw = RawFinancialInput(
        ticker="HARVARD_PE",
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
    res = FinancialNormalizerEngine.normalize_single_period(raw)
    assert res.reported_ebitda == 25.0, f"Expected 25.0, got {res.reported_ebitda}"
    assert res.total_qoe_addbacks == 3.5, f"Expected 3.5, got {res.total_qoe_addbacks}"
    assert res.normalized_ebitda == 28.5, f"Expected 28.5, got {res.normalized_ebitda}"
    assert res.working_capital == 15.0, f"Expected 15.0, got {res.working_capital}"
    assert round(res.debt_to_ebitda, 2) == 2.11, f"Expected 2.11, got {res.debt_to_ebitda}"
    assert round(res.interest_coverage, 2) == 7.12, f"Expected 7.12, got {res.interest_coverage}"
    assert res.covenant_compliance["leverage_under_4_5x"] is True
    print("  --> Passed: EBITDA normalized to $28.5M, Debt/EBITDA 2.11x, Coverage 7.12x")

    # 2. Test SEC Pre-indexed Database Targets
    print("[2/5] Testing SEC EDGAR Target Summaries...")
    targets = FinancialNormalizerEngine.get_target_summaries()
    assert len(targets) >= 3, "Expected at least 3 target benchmarks"
    tickers = [t.ticker for t in targets]
    assert "APOLLO" in tickers and "BEACON" in tickers and "PRECISION" in tickers
    print(f"  --> Passed: Retrieved {len(targets)} targets: {tickers}")

    # 3. Test Historical Company 10-K Ingestion
    print("[3/5] Testing SEC 10-K Historical Financial Extraction (APOLLO)...")
    comp = FinancialNormalizerEngine.get_company_filings("APOLLO")
    assert comp.ticker == "APOLLO"
    assert len(comp.historical_periods) == 3
    latest = comp.historical_periods[-1]
    assert latest.fiscal_year == 2023
    assert latest.revenue == 250.0
    assert latest.normalized_ebitda == 59.8
    assert latest.working_capital == 47.0
    print(f"  --> Passed: Verified 3-yr 10-K history for {comp.name} (Latest Normalized EBITDA: ${latest.normalized_ebitda}M)")

    # 4. Test Database Auto-seeding & Persistence
    print("[4/5] Testing Database Persistence & Schema Initialization...")
    init_db()
    db = SessionLocal()
    try:
        count = db.query(CompanyModel).count()
        assert count >= 3, f"Expected at least 3 companies in DB, got {count}"
        apollo = db.query(CompanyModel).filter(CompanyModel.ticker == "APOLLO").first()
        assert apollo is not None
        assert len(apollo.statements) == 3
        print(f"  --> Passed: Database contains {count} companies with relational financial statements")
    finally:
        db.close()

    # 5. Direct Endpoint Execution
    print("[5/5] Testing API Route Handlers directly...")
    from app.api.sec_pipeline import get_sec_targets, normalize_custom_financials
    target_list = get_sec_targets()
    assert len(target_list) >= 3
    custom_norm = normalize_custom_financials(raw)
    assert custom_norm.normalized_ebitda == 28.5
    print("  --> Passed: Direct API handler invocation succeeded with matching schemas")

    print("================ ALL PHASE 1 VALIDATION CHECKS PASSED ================")

if __name__ == "__main__":
    run_all_tests()

