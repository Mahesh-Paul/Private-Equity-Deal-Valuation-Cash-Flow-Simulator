import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.lbo_engine import calculate_lbo
from app.services.dcf_engine import calculate_dcf
from app.models.schemas import LBORequest, DebtTranche, DCFRequest
from app.database import init_db, SessionLocal, DealValuationModel

def run_stage2_tests():
    print("================ STAGE 2 LBO & DCF ENGINE VALIDATION ================")
    
    # 1. Test LBO Engine
    print("[1/4] Testing LBO Financial Modeling Engine...")
    lbo_req = LBORequest(
        target_name="Apollo Cloud Systems",
        entry_ebitda=50.0,
        entry_multiple=10.0,      # Entry EV = 50 * 10 = $500M
        holding_period=5,
        exit_multiple=12.0,
        revenue_growth_rate=0.08,
        entry_revenue=250.0,
        ebitda_margin_expansion=0.005,
        tax_rate=0.25,
        debt_tranches=[
            DebtTranche(name="Senior Term Loan A", leverage_multiple=3.0, interest_rate=0.065, amortization_rate=0.05, seniority=1),
            DebtTranche(name="Subordinated Notes", leverage_multiple=1.5, interest_rate=0.095, amortization_rate=0.0, seniority=2)
        ]
    )
    lbo_res = calculate_lbo(lbo_req)
    
    # Check Entry EV
    assert lbo_res.entry_ev == 500.0, f"Expected 500.0, got {lbo_res.entry_ev}"
    # Total entry debt = 50 * (3.0 + 1.5) = $225M
    assert lbo_res.total_debt_entry == 225.0, f"Expected 225.0, got {lbo_res.total_debt_entry}"
    # Sponsor equity entry = 500 - 225 = $275M
    assert lbo_res.sponsor_equity_entry == 275.0, f"Expected 275.0, got {lbo_res.sponsor_equity_entry}"
    
    # Check 5 years of projections and deleveraging
    assert len(lbo_res.annual_projections) == 5
    assert len(lbo_res.debt_schedule) == 5
    assert lbo_res.total_debt_exit < lbo_res.total_debt_entry, "Debt was not paid down"
    assert lbo_res.moic > 1.0, f"MoIC should be profitable, got {lbo_res.moic}x"
    assert lbo_res.irr > 0.0, f"IRR should be positive, got {lbo_res.irr}%"
    print(f"  --> Passed LBO Engine: Entry EV ${lbo_res.entry_ev}M, Exit EV ${lbo_res.exit_ev}M, MoIC {lbo_res.moic}x, IRR {lbo_res.irr}%")

    # 2. Test DCF Engine
    print("[2/4] Testing DCF Valuation Engine (Gordon Growth & Exit Multiple)...")
    dcf_req = DCFRequest(
        target_name="Apollo Cloud Systems",
        current_revenue=250.0,
        growth_rates=[0.08, 0.07, 0.06, 0.05, 0.04],
        ebitda_margin=0.24,
        tax_rate=0.25,
        wacc=0.095,
        terminal_growth_rate=0.025,
        terminal_exit_multiple=11.0,
        net_debt=120.0,
        shares_outstanding=25.0
    )
    dcf_res = calculate_dcf(dcf_req)
    assert len(dcf_res.projections) == 5
    assert dcf_res.pv_free_cash_flows > 0.0
    assert dcf_res.enterprise_value_gordon > 0.0
    assert dcf_res.implied_share_price_gordon > 0.0
    assert dcf_res.enterprise_value_multiple > 0.0
    assert dcf_res.implied_share_price_multiple > 0.0
    print(f"  --> Passed DCF Engine: PV of FCFF ${dcf_res.pv_free_cash_flows}M, Gordon EV ${dcf_res.enterprise_value_gordon}M (${dcf_res.implied_share_price_gordon}/sh), Multiple EV ${dcf_res.enterprise_value_multiple}M (${dcf_res.implied_share_price_multiple}/sh)")

    # 3. Test Covenants Stress Detection
    print("[3/4] Testing Covenant Stress Tracking...")
    stressed_lbo = LBORequest(
        target_name="Overleveraged Asset",
        entry_ebitda=30.0,
        entry_multiple=9.0,
        revenue_growth_rate=-0.05, # contraction
        debt_tranches=[
            DebtTranche(name="Excessive Debt", leverage_multiple=5.5, interest_rate=0.11, amortization_rate=0.0)
        ],
        max_leverage_covenant=4.0
    )
    stressed_res = calculate_lbo(stressed_lbo)
    assert stressed_res.covenants_breached is True, "Expected covenant breach under heavy leverage and negative growth"
    print("  --> Passed: Successfully identified high leverage covenant violation")

    # 4. Test Database Deal Persistence
    print("[4/4] Testing Deal Persistence in Database...")
    init_db()
    db = SessionLocal()
    try:
        from app.api.valuation import api_save_deal
        res = api_save_deal({
            "target_name": "Apollo Cloud Deal Test",
            "deal_type": "LBO",
            "entry_ebitda": 50.0,
            "entry_multiple": 10.0,
            "exit_multiple": 12.0,
            "holding_period": 5,
            "leverage_multiple": 4.5,
            "irr": lbo_res.irr,
            "moic": lbo_res.moic,
            "covenants_breached": lbo_res.covenants_breached
        }, db)
        assert res["status"] == "success"
        saved = db.query(DealValuationModel).filter(DealValuationModel.id == res["deal_id"]).first()
        assert saved is not None
        assert saved.target_name == "Apollo Cloud Deal Test"
        print(f"  --> Passed: Deal successfully persisted into DB (Record ID #{saved.id})")
    finally:
        db.close()

    print("================ ALL STAGE 2 VALIDATION CHECKS PASSED ================")

if __name__ == "__main__":
    run_stage2_tests()

