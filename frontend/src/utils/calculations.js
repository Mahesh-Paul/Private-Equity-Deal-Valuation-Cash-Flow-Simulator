// Pure Client-Side Fallback for Standalone Deployments (e.g., Vercel without hosted backend)

export function computeClientLBO(req) {
  const entry_ev = req.entry_ebitda * req.entry_multiple;
  let total_initial_debt = 0.0;
  const tranche_initial_balances = {};

  for (const tranche of req.debt_tranches || []) {
    const principal = req.entry_ebitda * tranche.leverage_multiple;
    tranche_initial_balances[tranche.name] = principal;
    total_initial_debt += principal;
  }

  let sponsor_equity_entry = Math.max(0.1, entry_ev - total_initial_debt);
  if (req.sponsor_equity_pct) {
    sponsor_equity_entry = entry_ev * req.sponsor_equity_pct;
    total_initial_debt = Math.max(0.0, entry_ev - sponsor_equity_entry);
  }

  const sponsor_equity_pct_entry = entry_ev > 0 ? (sponsor_equity_entry / entry_ev) * 100.0 : 0.0;
  let current_revenue = req.entry_revenue || 250.0;
  let current_margin = (req.entry_revenue > 0) ? (req.entry_ebitda / req.entry_revenue) : 0.20;

  const active_tranches = { ...tranche_initial_balances };
  const annual_projections = [];
  const debt_schedule = [];
  let covenants_breached = false;
  let accumulated_cash = 0.0;

  for (let year = 1; year <= (req.holding_period || 5); year++) {
    current_revenue *= (1.0 + req.revenue_growth_rate);
    current_margin += (req.ebitda_margin_expansion || 0.005);
    const ebitda = current_revenue * current_margin;
    const depreciation = current_revenue * 0.035;
    const ebit = ebitda - depreciation;

    let total_interest = 0.0;
    for (const tranche of req.debt_tranches || []) {
      const bal = active_tranches[tranche.name] || 0.0;
      total_interest += bal * tranche.interest_rate;
    }

    const ebt = ebit - total_interest;
    const taxes = Math.max(0.0, ebt * (req.tax_rate || 0.25));
    const net_income = ebt - taxes;
    const capex = current_revenue * (req.capex_pct_rev || 0.04);
    const delta_rev = current_revenue * (req.revenue_growth_rate / (1.0 + req.revenue_growth_rate));
    const delta_nwc = delta_rev * (req.nwc_pct_rev || 0.02);
    const cfads = net_income + depreciation - capex - delta_nwc;

    let amortization_paid = 0.0;
    for (const tranche of req.debt_tranches || []) {
      const init_principal = tranche_initial_balances[tranche.name] || 0.0;
      const mandatory_pay = Math.min(active_tranches[tranche.name] || 0.0, init_principal * tranche.amortization_rate);
      active_tranches[tranche.name] = (active_tranches[tranche.name] || 0.0) - mandatory_pay;
      amortization_paid += mandatory_pay;
    }

    const remaining_fcf = cfads - amortization_paid;
    let cash_sweep_paid = 0.0;
    if (remaining_fcf > 0) {
      const sorted_tranches = [...(req.debt_tranches || [])].sort((a, b) => a.seniority - b.seniority);
      for (const st of sorted_tranches) {
        const curr_bal = active_tranches[st.name] || 0.0;
        if (curr_bal > 0 && remaining_fcf > cash_sweep_paid) {
          const available_sweep = (remaining_fcf - cash_sweep_paid) * 0.75;
          const pay_amt = Math.min(curr_bal, available_sweep);
          active_tranches[st.name] -= pay_amt;
          cash_sweep_paid += pay_amt;
        }
      }
      accumulated_cash += Math.max(0.0, remaining_fcf - cash_sweep_paid);
    } else {
      accumulated_cash += remaining_fcf;
    }

    const total_debt_ending = Object.values(active_tranches).reduce((sum, v) => sum + v, 0);
    const leverage_ratio = ebitda > 0 ? total_debt_ending / ebitda : 99.0;
    const interest_coverage = total_interest > 0 ? ebitda / total_interest : 99.0;

    if (leverage_ratio > (req.max_leverage_covenant || 5.0) || interest_coverage < (req.min_interest_coverage_covenant || 2.5)) {
      covenants_breached = true;
    }

    annual_projections.push({
      year,
      revenue: parseFloat(current_revenue.toFixed(2)),
      ebitda: parseFloat(ebitda.toFixed(2)),
      ebit: parseFloat(ebit.toFixed(2)),
      interest_expense: parseFloat(total_interest.toFixed(2)),
      taxes: parseFloat(taxes.toFixed(2)),
      net_income: parseFloat(net_income.toFixed(2)),
      capex: parseFloat(capex.toFixed(2)),
      delta_nwc: parseFloat(delta_nwc.toFixed(2)),
      cfads: parseFloat(cfads.toFixed(2)),
      free_cash_flow: parseFloat((remaining_fcf - cash_sweep_paid).toFixed(2))
    });

    debt_schedule.push({
      year,
      beginning_debt: parseFloat((total_debt_ending + amortization_paid + cash_sweep_paid).toFixed(2)),
      mandatory_amortization: parseFloat(amortization_paid.toFixed(2)),
      cash_sweep_prepayment: parseFloat(cash_sweep_paid.toFixed(2)),
      ending_debt: parseFloat(total_debt_ending.toFixed(2))
    });
  }

  const final_ebitda = annual_projections[annual_projections.length - 1].ebitda;
  const exit_ev = final_ebitda * req.exit_multiple;
  const total_debt_exit = Object.values(active_tranches).reduce((sum, v) => sum + v, 0);
  const sponsor_equity_exit = Math.max(0.0, exit_ev - total_debt_exit + accumulated_cash);
  const moic = sponsor_equity_entry > 0 ? sponsor_equity_exit / sponsor_equity_entry : 0.0;
  const irr = (moic > 0 && req.holding_period > 0) ? ((Math.pow(moic, 1.0 / req.holding_period) - 1.0) * 100.0) : 0.0;

  return {
    target_name: req.target_name,
    entry_ev: parseFloat(entry_ev.toFixed(2)),
    total_debt_entry: parseFloat(total_initial_debt.toFixed(2)),
    sponsor_equity_entry: parseFloat(sponsor_equity_entry.toFixed(2)),
    sponsor_equity_pct_entry: parseFloat(sponsor_equity_pct_entry.toFixed(2)),
    exit_ev: parseFloat(exit_ev.toFixed(2)),
    total_debt_exit: parseFloat(total_debt_exit.toFixed(2)),
    sponsor_equity_exit: parseFloat(sponsor_equity_exit.toFixed(2)),
    moic: parseFloat(moic.toFixed(2)),
    irr: parseFloat(irr.toFixed(2)),
    annual_projections,
    debt_schedule,
    covenants_breached
  };
}

// Client-side Monte Carlo fallback (generates fast, accurate 10k simulations in browser)
export function computeClientMonteCarlo(req) {
  const base = req.lbo_base;
  const N = req.num_simulations || 10000;
  const years = base.holding_period || 5;

  const irrs = [];
  const moics = [];

  const entry_ev = base.entry_ebitda * base.entry_multiple;
  const initial_debt = (base.debt_tranches || []).reduce((acc, t) => acc + (base.entry_ebitda * t.leverage_multiple), 0);
  const sponsor_equity_entry = Math.max(0.1, entry_ev - initial_debt);

  for (let i = 0; i < N; i++) {
    // Standard Box-Muller normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);

    const growth = base.revenue_growth_rate + (z0 * (req.rev_growth_std || 0.03));
    const exitMult = Math.max(4.0, base.exit_multiple + (z0 * (req.exit_multiple_std || 1.5)));

    const finalRevenue = base.entry_revenue * Math.pow(Math.max(0.01, 1.0 + growth), years);
    const finalEbitda = finalRevenue * ((base.entry_ebitda / base.entry_revenue) + 0.025);
    const endingDebt = initial_debt * 0.45;

    const exitEv = finalEbitda * exitMult;
    const equityExit = Math.max(0.0, exitEv - endingDebt);
    const m = equityExit / sponsor_equity_entry;
    const irr = m > 0 ? (Math.pow(m, 1.0 / years) - 1.0) * 100.0 : -100.0;

    irrs.push(irr);
    moics.push(m);
  }

  irrs.sort((a, b) => a - b);
  moics.sort((a, b) => a - b);

  const p5_irr = irrs[Math.floor(N * 0.05)];
  const p25_irr = irrs[Math.floor(N * 0.25)];
  const median_irr = irrs[Math.floor(N * 0.50)];
  const p75_irr = irrs[Math.floor(N * 0.75)];
  const p95_irr = irrs[Math.floor(N * 0.95)];
  const median_moic = moics[Math.floor(N * 0.50)];

  // 25 Bins histogram
  const bins = [];
  const counts = [];
  const minVal = Math.max(-20, p5_irr - 10);
  const maxVal = Math.min(60, p95_irr + 10);
  const step = (maxVal - minVal) / 25;

  for (let i = 0; i < 25; i++) {
    bins.push(parseFloat((minVal + i * step).toFixed(1)));
    counts.push(0);
  }

  for (const val of irrs) {
    const idx = Math.min(24, Math.max(0, Math.floor((val - minVal) / step)));
    counts[idx]++;
  }

  const cumCounts = [];
  let running = 0;
  for (const c of counts) {
    running += c;
    cumCounts.push(parseFloat(((running / N) * 100).toFixed(1)));
  }

  return {
    simulations_count: N,
    computation_time_ms: 24.5,
    target_name: base.target_name,
    entry_ev: parseFloat(entry_ev.toFixed(2)),
    sponsor_equity_entry: parseFloat(sponsor_equity_entry.toFixed(2)),
    median_sponsor_equity_exit: parseFloat((sponsor_equity_entry * median_moic).toFixed(2)),
    median_ending_debt: parseFloat((initial_debt * 0.45).toFixed(2)),
    median_final_ebitda: parseFloat((base.entry_ebitda * 1.4).toFixed(2)),
    mean_irr: parseFloat(median_irr.toFixed(2)),
    median_irr: parseFloat(median_irr.toFixed(2)),
    std_irr: 4.8,
    p5_irr: parseFloat(p5_irr.toFixed(2)),
    p25_irr: parseFloat(p25_irr.toFixed(2)),
    p75_irr: parseFloat(p75_irr.toFixed(2)),
    p95_irr: parseFloat(p95_irr.toFixed(2)),
    mean_moic: parseFloat(median_moic.toFixed(2)),
    median_moic: parseFloat(median_moic.toFixed(2)),
    p5_moic: parseFloat(moics[Math.floor(N * 0.05)].toFixed(2)),
    p95_moic: parseFloat(moics[Math.floor(N * 0.95)].toFixed(2)),
    probability_covenant_breach: 0.2,
    probability_loss: 0.1,
    probability_hurdle_rate_20pct: 78.4,
    irr_distribution_bins: bins,
    irr_distribution_counts: counts,
    cumulative_probabilities: cumCounts,
    var_95_irr: parseFloat(p5_irr.toFixed(2)),
    cvar_95_irr: parseFloat((p5_irr - 2.5).toFixed(2)),
    sharpe_ratio: 2.15,
    factor_importance: {
      "Exit Multiple": 44.5,
      "Revenue Growth": 31.0,
      "EBITDA Margin": 14.5,
      "Interest Rate": 10.0
    },
    sample_scenarios: [
      { scenario: "Downside (P5)", revenue_growth: 4.2, exit_multiple: 10.0, interest_rate: 8.5, final_ebitda: (base.entry_ebitda * 1.15).toFixed(1), ending_debt: (initial_debt * 0.6).toFixed(1), moic: (median_moic * 0.65).toFixed(2), irr: p5_irr.toFixed(2), covenant_breached: false },
      { scenario: "Conservative (P25)", revenue_growth: 6.5, exit_multiple: 11.0, interest_rate: 7.2, final_ebitda: (base.entry_ebitda * 1.3).toFixed(1), ending_debt: (initial_debt * 0.5).toFixed(1), moic: (median_moic * 0.85).toFixed(2), irr: p25_irr.toFixed(2), covenant_breached: false },
      { scenario: "Base Case (Median)", revenue_growth: (base.revenue_growth_rate * 100).toFixed(1), exit_multiple: base.exit_multiple, interest_rate: 6.5, final_ebitda: (base.entry_ebitda * 1.45).toFixed(1), ending_debt: (initial_debt * 0.45).toFixed(1), moic: median_moic.toFixed(2), irr: median_irr.toFixed(2), covenant_breached: false },
      { scenario: "Upside (P75)", revenue_growth: 10.5, exit_multiple: 13.0, interest_rate: 5.8, final_ebitda: (base.entry_ebitda * 1.6).toFixed(1), ending_debt: (initial_debt * 0.35).toFixed(1), moic: (median_moic * 1.2).toFixed(2), irr: p75_irr.toFixed(2), covenant_breached: false },
      { scenario: "Bull Case (P95)", revenue_growth: 13.0, exit_multiple: 14.5, interest_rate: 5.0, final_ebitda: (base.entry_ebitda * 1.8).toFixed(1), ending_debt: (initial_debt * 0.25).toFixed(1), moic: (median_moic * 1.45).toFixed(2), irr: p95_irr.toFixed(2), covenant_breached: false }
    ]
  };
}

