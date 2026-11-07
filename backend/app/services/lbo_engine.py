from typing import Dict, Any, List
from ..models.schemas import LBORequest, LBOResponse

def calculate_lbo(req: LBORequest) -> LBOResponse:
    entry_ev = req.entry_ebitda * req.entry_multiple
    
    # Calculate initial debt balances per tranche
    total_initial_debt = 0.0
    tranche_initial_balances = {}
    for tranche in req.debt_tranches:
        principal = req.entry_ebitda * tranche.leverage_multiple
        tranche_initial_balances[tranche.name] = principal
        total_initial_debt += principal
        
    sponsor_equity_entry = max(0.1, entry_ev - total_initial_debt)
    if req.sponsor_equity_pct is not None:
        sponsor_equity_entry = entry_ev * req.sponsor_equity_pct
        total_initial_debt = max(0.0, entry_ev - sponsor_equity_entry)
        
    sponsor_equity_pct_entry = (sponsor_equity_entry / entry_ev * 100.0) if entry_ev > 0 else 0.0
    
    current_revenue = req.entry_revenue
    initial_margin = (req.entry_ebitda / req.entry_revenue) if req.entry_revenue > 0 else 0.20
    current_margin = initial_margin
    
    active_tranches = dict(tranche_initial_balances)
    annual_projections: List[Dict[str, Any]] = []
    debt_schedule: List[Dict[str, Any]] = []
    covenant_analysis: List[Dict[str, Any]] = []
    covenants_breached = False
    
    accumulated_cash = 0.0
    
    for year in range(1, req.holding_period + 1):
        # 1. Top-line revenue and EBITDA projection
        current_revenue *= (1.0 + req.revenue_growth_rate)
        current_margin += req.ebitda_margin_expansion
        ebitda = current_revenue * current_margin
        
        # 2. Operating income (EBIT)
        depreciation = current_revenue * 0.035
        ebit = ebitda - depreciation
        
        # 3. Interest expense across active debt tranches
        total_interest = 0.0
        for tranche in req.debt_tranches:
            bal = active_tranches.get(tranche.name, 0.0)
            total_interest += bal * tranche.interest_rate
            
        ebt = ebit - total_interest
        taxes = max(0.0, ebt * req.tax_rate)
        net_income = ebt - taxes
        
        # 4. CapEx & Working Capital
        capex = current_revenue * req.capex_pct_rev
        delta_rev = current_revenue * (req.revenue_growth_rate / (1.0 + req.revenue_growth_rate))
        delta_nwc = delta_rev * req.nwc_pct_rev
        
        # 5. Cash Flow Available for Debt Service (CFADS)
        cfads = net_income + depreciation - capex - delta_nwc
        
        # 6. Mandatory Debt Amortization
        amortization_paid = 0.0
        for tranche in req.debt_tranches:
            init_principal = tranche_initial_balances.get(tranche.name, 0.0)
            mandatory_pay = min(active_tranches[tranche.name], init_principal * tranche.amortization_rate)
            active_tranches[tranche.name] -= mandatory_pay
            amortization_paid += mandatory_pay
            
        remaining_fcf = cfads - amortization_paid
        
        # 7. Cash Sweep (75% applied to senior debt first)
        cash_sweep_paid = 0.0
        if remaining_fcf > 0:
            sorted_tranches = sorted(req.debt_tranches, key=lambda t: t.seniority)
            for st in sorted_tranches:
                curr_bal = active_tranches[st.name]
                if curr_bal > 0 and remaining_fcf > cash_sweep_paid:
                    available_sweep = (remaining_fcf - cash_sweep_paid) * 0.75
                    pay_amt = min(curr_bal, available_sweep)
                    active_tranches[st.name] -= pay_amt
                    cash_sweep_paid += pay_amt
            accumulated_cash += max(0.0, remaining_fcf - cash_sweep_paid)
        else:
            accumulated_cash += remaining_fcf
            
        total_debt_ending = sum(active_tranches.values())
        
        # 8. Covenants check
        leverage_ratio = (total_debt_ending / ebitda) if ebitda > 0 else 99.0
        interest_coverage = (ebitda / total_interest) if total_interest > 0 else 99.0
        
        breach = (leverage_ratio > req.max_leverage_covenant) or (interest_coverage < req.min_interest_coverage_covenant)
        if breach:
            covenants_breached = True
            
        annual_projections.append({
            "year": year,
            "revenue": round(current_revenue, 2),
            "ebitda": round(ebitda, 2),
            "ebit": round(ebit, 2),
            "interest_expense": round(total_interest, 2),
            "taxes": round(taxes, 2),
            "net_income": round(net_income, 2),
            "capex": round(capex, 2),
            "delta_nwc": round(delta_nwc, 2),
            "cfads": round(cfads, 2),
            "free_cash_flow": round(remaining_fcf - cash_sweep_paid, 2)
        })
        
        debt_schedule.append({
            "year": year,
            "beginning_debt": round(total_debt_ending + amortization_paid + cash_sweep_paid, 2),
            "mandatory_amortization": round(amortization_paid, 2),
            "cash_sweep_prepayment": round(cash_sweep_paid, 2),
            "ending_debt": round(total_debt_ending, 2),
            "tranches": {k: round(v, 2) for k, v in active_tranches.items()}
        })
        
        covenant_analysis.append({
            "year": year,
            "leverage_ratio": round(leverage_ratio, 2),
            "max_leverage_threshold": req.max_leverage_covenant,
            "interest_coverage": round(interest_coverage, 2),
            "min_interest_threshold": req.min_interest_coverage_covenant,
            "is_breached": breach
        })
        
    final_ebitda = annual_projections[-1]["ebitda"]
    exit_ev = final_ebitda * req.exit_multiple
    total_debt_exit = sum(active_tranches.values())
    
    # Exit Equity = Exit EV - Ending Debt + Cash
    sponsor_equity_exit = max(0.0, exit_ev - total_debt_exit + accumulated_cash)
    
    # MoIC and IRR
    moic = sponsor_equity_exit / sponsor_equity_entry if sponsor_equity_entry > 0 else 0.0
    irr = ((moic ** (1.0 / req.holding_period)) - 1.0) * 100.0 if (moic > 0 and req.holding_period > 0) else -100.0
    
    return LBOResponse(
        target_name=req.target_name,
        entry_ev=round(entry_ev, 2),
        total_debt_entry=round(total_initial_debt, 2),
        sponsor_equity_entry=round(sponsor_equity_entry, 2),
        sponsor_equity_pct_entry=round(sponsor_equity_pct_entry, 2),
        exit_ev=round(exit_ev, 2),
        total_debt_exit=round(total_debt_exit, 2),
        sponsor_equity_exit=round(sponsor_equity_exit, 2),
        moic=round(moic, 2),
        irr=round(irr, 2),
        annual_projections=annual_projections,
        debt_schedule=debt_schedule,
        covenants_breached=covenants_breached,
        covenant_analysis=covenant_analysis
    )

