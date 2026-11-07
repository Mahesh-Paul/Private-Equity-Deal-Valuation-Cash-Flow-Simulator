import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.sec_edgar import FinancialNormalizerEngine
from app.services.lbo_engine import calculate_lbo
from app.services.dcf_engine import calculate_dcf
from app.services.monte_carlo import run_monte_carlo_simulation
from app.services.sensitivity import generate_sensitivity_matrix
from app.models.schemas import LBORequest, DCFRequest, MonteCarloRequest, SensitivityRequest
from app.database import init_db, SessionLocal, CompanyModel, DealValuationModel

def verify_full_stack_engine():
    print("================ FULL SYSTEM VERIFICATION ================")
    
    # 1. Database & 40 Companies
    print("[1/5] Verifying 40-Company Cross-Sector SEC EDGAR Database...")
    init_db()
    db = SessionLocal()
    try:
        count = db.query(CompanyModel).count()
        assert count == 40, f"Expected 40 companies, found {count}"
        targets = FinancialNormalizerEngine.get_target_summaries()
        assert len(targets) == 40, f"Expected 40 summaries, got {len(targets)}"
        sectors = {t.sector for t in targets}
        assert len(sectors) == 6, f"Expected 6 sectors, got {len(sectors)}"
        print(f"  --> Verified: 40 companies across {len(sectors)} institutional PE sectors in DB")
    finally:
        db.close()

    # 2. LBO Engine
    print("[2/5] Verifying LBO Financial Modeling Engine...")
    lbo_req = LBORequest(
        target_name="Apollo Enterprise Cloud Systems",
        entry_ebitda=59.8,
        entry_multiple=11.0,
        holding_period=5,
        exit_multiple=12.0,
        revenue_growth_rate=0.08,
        entry_revenue=250.0
    )
    lbo_res = calculate_lbo(lbo_req)
    assert lbo_res.entry_ev == 657.8
    assert lbo_res.moic > 2.0
    assert lbo_res.irr > 15.0
    print(f"  --> Verified: LBO Model computed. MoIC: {lbo_res.moic}x | IRR: {lbo_res.irr}%")

    # 3. DCF Engine
    print("[3/5] Verifying DCF Valuation Engine...")
    dcf_req = DCFRequest(
        target_name="Apollo Enterprise Cloud Systems",
        current_revenue=250.0,
        wacc=0.095,
        terminal_growth_rate=0.025
    )
    dcf_res = calculate_dcf(dcf_req)
    assert dcf_res.enterprise_value_gordon > 0
    assert dcf_res.implied_share_price_gordon > 0
    print(f"  --> Verified: DCF Gordon EV: ${dcf_res.enterprise_value_gordon}M (${dcf_res.implied_share_price_gordon}/sh)")

    # 4. 10,000+ Monte Carlo Simulations
    print("[4/5] Verifying 10,000+ Vectorized Monte Carlo Stress-Test Engine...")
    mc_req = MonteCarloRequest(lbo_base=lbo_req, num_simulations=10000)
    mc_res = run_monte_carlo_simulation(mc_req)
    assert mc_res.simulations_count == 10000
    assert mc_res.computation_time_ms < 1000.0
    print(f"  --> Verified: 10,000 simulations completed in {mc_res.computation_time_ms}ms (Median IRR: {mc_res.median_irr}%)")

    # 5. Sensitivity Matrix
    print("[5/5] Verifying 2D IRR Sensitivity Matrix...")
    sens_req = SensitivityRequest(
        lbo_base=lbo_req,
        x_param="exit_multiple",
        x_range=[9.0, 11.0, 13.0],
        y_param="revenue_growth_rate",
        y_range=[0.05, 0.08, 0.12]
    )
    sens_res = generate_sensitivity_matrix(sens_req)
    assert len(sens_res.matrix) == 3 and len(sens_res.matrix[0]) == 3
    print(f"  --> Verified: 3x3 Sensitivity Matrix computed successfully")

    print("================ ALL SYSTEM VALIDATION CHECKS PASSED ================")

if __name__ == "__main__":
    verify_full_stack_engine()

