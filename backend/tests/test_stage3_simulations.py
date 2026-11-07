import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.monte_carlo import run_monte_carlo_simulation
from app.services.sensitivity import generate_sensitivity_matrix
from app.models.schemas import LBORequest, MonteCarloRequest, SensitivityRequest

def run_stage3_tests():
    print("================ STAGE 3 MONTE CARLO & SENSITIVITY VALIDATION ================")
    
    base_lbo = LBORequest(
        target_name="Apollo Cloud Institutional Target",
        entry_ebitda=59.8,
        entry_multiple=11.0,
        holding_period=5,
        exit_multiple=12.0,
        revenue_growth_rate=0.08,
        entry_revenue=250.0,
        max_leverage_covenant=5.0
    )

    # 1. Test 10,000+ Monte Carlo Simulations
    print("[1/3] Testing Vectorized 10,000+ Monte Carlo Engine...")
    mc_req = MonteCarloRequest(
        lbo_base=base_lbo,
        num_simulations=10000,
        rev_growth_std=0.03,
        exit_multiple_std=1.5,
        interest_rate_std=0.015,
        ebitda_margin_std=0.02
    )
    mc_res = run_monte_carlo_simulation(mc_req)
    
    assert mc_res.simulations_count == 10000, f"Expected 10,000 runs, got {mc_res.simulations_count}"
    assert mc_res.computation_time_ms < 1000.0, f"Vectorized engine too slow: {mc_res.computation_time_ms}ms"
    
    # Statistical consistency check
    assert mc_res.p5_irr <= mc_res.p25_irr <= mc_res.median_irr <= mc_res.p75_irr <= mc_res.p95_irr, "Percentile ordering failed"
    assert 0.0 <= mc_res.probability_covenant_breach <= 100.0
    assert 0.0 <= mc_res.probability_loss <= 100.0
    assert 0.0 <= mc_res.probability_hurdle_rate_20pct <= 100.0
    assert len(mc_res.irr_distribution_bins) == len(mc_res.irr_distribution_counts) == 25
    assert len(mc_res.sample_scenarios) == 5
    
    print(f"  --> Passed: 10,000 runs completed in {mc_res.computation_time_ms}ms!")
    print(f"      Median IRR: {mc_res.median_irr}%, P5 (Downside VaR): {mc_res.p5_irr}%, P95 (Bull): {mc_res.p95_irr}%")
    print(f"      Covenant Breach Probability: {mc_res.probability_covenant_breach}%, Loss Prob: {mc_res.probability_loss}%")

    # 2. Test 2D Sensitivity Matrix (Exit Multiple vs Revenue Growth Rate)
    print("[2/3] Testing 2D Sensitivity Matrix Generator (Exit Multiple vs Rev Growth)...")
    sens_req = SensitivityRequest(
        lbo_base=base_lbo,
        x_param="exit_multiple",
        x_range=[9.0, 10.0, 11.0, 12.0, 13.0, 14.0],
        y_param="revenue_growth_rate",
        y_range=[0.04, 0.06, 0.08, 0.10, 0.12],
        metric="irr"
    )
    sens_res = generate_sensitivity_matrix(sens_req)
    
    assert len(sens_res.matrix) == 5, "Expected 5 rows (y_values)"
    assert len(sens_res.matrix[0]) == 6, "Expected 6 columns (x_values)"
    
    # Financial monotonicity check: Higher exit multiple in same row must yield higher IRR
    row_0 = sens_res.matrix[0]
    for i in range(len(row_0) - 1):
        assert row_0[i] <= row_0[i+1], f"Monotonicity failed: {row_0[i]} > {row_0[i+1]}"
        
    print(f"  --> Passed: 5x6 Sensitivity Matrix computed. Range: {sens_res.matrix[0][0]}% to {sens_res.matrix[-1][-1]}% IRR")

    # 3. Test MoIC Sensitivity Matrix
    print("[3/3] Testing 2D MoIC Sensitivity Matrix...")
    sens_moic_req = SensitivityRequest(
        lbo_base=base_lbo,
        x_param="exit_multiple",
        x_range=[10.0, 12.0, 14.0],
        y_param="revenue_growth_rate",
        y_range=[0.05, 0.10],
        metric="moic"
    )
    sens_moic_res = generate_sensitivity_matrix(sens_moic_req)
    assert len(sens_moic_res.matrix) == 2
    assert len(sens_moic_res.matrix[0]) == 3
    assert sens_moic_res.matrix[-1][-1] > sens_moic_res.matrix[0][0]
    print(f"  --> Passed: MoIC Sensitivity Matrix validated (Range {sens_moic_res.matrix[0][0]}x - {sens_moic_res.matrix[-1][-1]}x)")

    print("================ ALL STAGE 3 VALIDATION CHECKS PASSED ================")

if __name__ == "__main__":
    run_stage3_tests()
