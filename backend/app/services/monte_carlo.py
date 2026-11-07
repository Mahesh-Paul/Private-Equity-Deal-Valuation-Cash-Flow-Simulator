import numpy as np
import time
from typing import Dict, Any, List
from ..models.schemas import MonteCarloRequest, MonteCarloResponse

def run_monte_carlo_simulation(req: MonteCarloRequest) -> MonteCarloResponse:
    start_time = time.perf_counter()
    N = req.num_simulations
    base = req.lbo_base
    years = base.holding_period
    
    # Deterministic company-specific seed so each target has its unique stochastic path
    company_seed = (abs(hash(base.target_name)) % (2**31 - 1)) if base.target_name else 42
    np.random.seed(company_seed)
    
    # Macroeconomic scenario modifiers
    scenario = getattr(req, 'macro_scenario', 'baseline') or 'baseline'
    growth_mean_shift = 0.0
    exit_mean_shift = 0.0
    rate_mean_shift = 0.0
    margin_mean_shift = 0.0

    if scenario == 'stagflation':
        growth_mean_shift = -0.03
        rate_mean_shift = 0.02
        exit_mean_shift = -1.5
        margin_mean_shift = -0.01
    elif scenario == 'tech_recession':
        growth_mean_shift = -0.05
        exit_mean_shift = -2.5
        margin_mean_shift = -0.03
    elif scenario == 'bull_market':
        growth_mean_shift = 0.03
        exit_mean_shift = 2.0
        margin_mean_shift = 0.02
    
    # 1. Vectorized Stochastic Sampling
    rev_growth_samples = np.random.normal(base.revenue_growth_rate + growth_mean_shift, req.rev_growth_std, N)
    exit_mult_samples = np.clip(np.random.normal(base.exit_multiple + exit_mean_shift, req.exit_multiple_std, N), 4.0, 25.0)
    interest_rate_shift = np.random.normal(rate_mean_shift, req.interest_rate_std, N)
    margin_shift = np.random.normal(margin_mean_shift, req.ebitda_margin_std, N)
    
    # 2. Capital Structure at Entry
    entry_ev = base.entry_ebitda * base.entry_multiple
    initial_debt = sum(base.entry_ebitda * t.leverage_multiple for t in base.debt_tranches)
    sponsor_equity_entry = max(0.1, entry_ev - initial_debt)
    if base.sponsor_equity_pct is not None:
        sponsor_equity_entry = entry_ev * base.sponsor_equity_pct
        initial_debt = max(0.0, entry_ev - sponsor_equity_entry)
        
    total_tranche_mult = sum(t.leverage_multiple for t in base.debt_tranches)
    if total_tranche_mult > 0:
        weighted_interest = sum(t.interest_rate * t.leverage_multiple for t in base.debt_tranches) / total_tranche_mult
        weighted_amort = sum(t.amortization_rate * t.leverage_multiple for t in base.debt_tranches) / total_tranche_mult
    else:
        weighted_interest = 0.07
        weighted_amort = 0.05
        
    simulated_interests = np.clip(weighted_interest + interest_rate_shift, 0.02, 0.20)
    
    # 3. Vectorized Financial Trajectory
    base_margin = (base.entry_ebitda / base.entry_revenue) if base.entry_revenue > 0 else 0.20
    simulated_margins = np.clip(base_margin + (base.ebitda_margin_expansion * years) + margin_shift, 0.05, 0.60)
    
    growth_factors = np.maximum(0.01, 1.0 + rev_growth_samples)
    final_revenue = base.entry_revenue * (growth_factors ** years)
    final_ebitda = final_revenue * simulated_margins
    
    # Deleveraging dynamic: Higher margin companies generate more CFADS to sweep debt faster
    margin_fcf_benefit = np.clip((base_margin - 0.20) * 1.2, -0.15, 0.25)
    amort_reduction = np.maximum(0.0, 1.0 - (weighted_amort * years))
    interest_drag = 1.0 - np.clip(simulated_interests - 0.06, -0.05, 0.15) * 1.8
    debt_reduction_ratio = np.clip(amort_reduction * interest_drag - margin_fcf_benefit, 0.10, 1.05)
    ending_debt = initial_debt * debt_reduction_ratio
    
    final_leverage = ending_debt / np.maximum(final_ebitda, 0.01)
    covenant_breaches = final_leverage > base.max_leverage_covenant
    prob_covenant_breach = float(np.mean(covenant_breaches)) * 100.0
    
    # 4. Exit Valuation & Returns Distribution
    exit_ev = final_ebitda * exit_mult_samples
    sponsor_equity_exit = np.maximum(0.0, exit_ev - ending_debt)
    
    moic = sponsor_equity_exit / sponsor_equity_entry
    irr = np.where(moic > 0, ((moic ** (1.0 / years)) - 1.0) * 100.0, -100.0)
    
    # 5. Statistical Calculations
    percentiles = np.percentile(irr, [5, 25, 50, 75, 95])
    p5_irr, p25_irr, median_irr, p75_irr, p95_irr = percentiles
    
    mean_irr = float(np.mean(irr))
    std_irr = float(np.std(irr))
    
    # Advanced Quant Metrics: VaR 95%, CVaR 95%, Sharpe Ratio
    var_95_irr = float(p5_irr)
    worst_tail = irr[irr <= p5_irr]
    cvar_95_irr = float(np.mean(worst_tail)) if len(worst_tail) > 0 else var_95_irr
    sharpe_ratio = float((mean_irr - 4.5) / std_irr) if std_irr > 0.01 else 0.0
    
    moic_percentiles = np.percentile(moic, [5, 50, 95])
    p5_moic, median_moic, p95_moic = moic_percentiles
    mean_moic = float(np.mean(moic))
    
    prob_loss = float(np.mean(moic < 1.0)) * 100.0
    prob_hurdle = float(np.mean(irr >= 20.0)) * 100.0
    
    # Histogram generation for frontend visualization
    chart_irrs = np.clip(irr, -40.0, 80.0)
    counts, bin_edges = np.histogram(chart_irrs, bins=25)
    bin_centers = [(bin_edges[i] + bin_edges[i+1]) / 2.0 for i in range(len(counts))]
    
    # Cumulative probability curve (CDF: Probability of achieving <= X%)
    cum_counts = np.cumsum(counts) / float(len(chart_irrs)) * 100.0
    cumulative_probabilities = [round(float(c), 1) for c in cum_counts]
    
    # Factor Importance (Variance decomposition via Pearson correlation squared)
    corr_rev = float(np.corrcoef(rev_growth_samples, irr)[0, 1]) ** 2
    corr_exit = float(np.corrcoef(exit_mult_samples, irr)[0, 1]) ** 2
    corr_interest = float(np.corrcoef(simulated_interests, irr)[0, 1]) ** 2
    corr_margin = float(np.corrcoef(margin_shift, irr)[0, 1]) ** 2
    
    total_corr = corr_rev + corr_exit + corr_interest + corr_margin
    if total_corr > 0:
        factor_importance = {
            "Exit Multiple": round((corr_exit / total_corr) * 100.0, 1),
            "Revenue Growth": round((corr_rev / total_corr) * 100.0, 1),
            "EBITDA Margin": round((corr_margin / total_corr) * 100.0, 1),
            "Interest Rate": round((corr_interest / total_corr) * 100.0, 1)
        }
    else:
        factor_importance = {"Exit Multiple": 45.0, "Revenue Growth": 30.0, "EBITDA Margin": 15.0, "Interest Rate": 10.0}
    
    # Representative scenarios matching percentiles
    sample_scenarios: List[Dict[str, Any]] = []
    scenario_targets = [("Downside (P5)", p5_irr), ("Conservative (P25)", p25_irr), 
                        ("Base Case (Median)", median_irr), ("Upside (P75)", p75_irr), 
                        ("Bull Case (P95)", p95_irr)]
                        
    for label, target_val in scenario_targets:
        idx = int(np.argmin(np.abs(irr - target_val)))
        sample_scenarios.append({
            "scenario": label,
            "revenue_growth": round(float(rev_growth_samples[idx]) * 100, 2),
            "exit_multiple": round(float(exit_mult_samples[idx]), 2),
            "interest_rate": round(float(simulated_interests[idx]) * 100, 2),
            "final_ebitda": round(float(final_ebitda[idx]), 2),
            "ending_debt": round(float(ending_debt[idx]), 2),
            "moic": round(float(moic[idx]), 2),
            "irr": round(float(irr[idx]), 2),
            "covenant_breached": bool(covenant_breaches[idx])
        })
        
    execution_time = (time.perf_counter() - start_time) * 1000.0
    
    return MonteCarloResponse(
        simulations_count=N,
        computation_time_ms=round(execution_time, 2),
        target_name=base.target_name,
        entry_ev=round(entry_ev, 2),
        sponsor_equity_entry=round(sponsor_equity_entry, 2),
        median_sponsor_equity_exit=round(float(np.median(sponsor_equity_exit)), 2),
        median_ending_debt=round(float(np.median(ending_debt)), 2),
        median_final_ebitda=round(float(np.median(final_ebitda)), 2),
        mean_irr=round(mean_irr, 2),
        median_irr=round(median_irr, 2),
        std_irr=round(std_irr, 2),
        p5_irr=round(p5_irr, 2),
        p25_irr=round(p25_irr, 2),
        p75_irr=round(p75_irr, 2),
        p95_irr=round(p95_irr, 2),
        mean_moic=round(mean_moic, 2),
        median_moic=round(median_moic, 2),
        p5_moic=round(p5_moic, 2),
        p95_moic=round(p95_moic, 2),
        probability_covenant_breach=round(prob_covenant_breach, 2),
        probability_loss=round(prob_loss, 2),
        probability_hurdle_rate_20pct=round(prob_hurdle, 2),
        irr_distribution_bins=[round(b, 1) for b in bin_centers],
        irr_distribution_counts=[int(c) for c in counts],
        sample_scenarios=sample_scenarios,
        var_95_irr=round(var_95_irr, 2),
        cvar_95_irr=round(cvar_95_irr, 2),
        sharpe_ratio=round(sharpe_ratio, 2),
        cumulative_probabilities=cumulative_probabilities,
        factor_importance=factor_importance
    )
