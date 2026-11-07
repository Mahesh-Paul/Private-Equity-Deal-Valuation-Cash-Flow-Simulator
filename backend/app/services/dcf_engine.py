from typing import Dict, Any, List
from ..models.schemas import DCFRequest, DCFResponse

def calculate_dcf(req: DCFRequest) -> DCFResponse:
    revenue = req.current_revenue
    projections: List[Dict[str, Any]] = []
    pv_fcff_total = 0.0
    
    final_ebitda = 0.0
    final_fcff = 0.0
    
    for idx, growth_rate in enumerate(req.growth_rates):
        year = idx + 1
        revenue *= (1.0 + growth_rate)
        ebitda = revenue * req.ebitda_margin
        depreciation = revenue * req.depreciation_pct_rev
        ebit = ebitda - depreciation
        taxes = max(0.0, ebit * req.tax_rate)
        nopat = ebit - taxes
        
        capex = revenue * req.capex_pct_rev
        delta_rev = revenue * (growth_rate / (1.0 + growth_rate))
        delta_nwc = delta_rev * req.nwc_pct_rev
        
        fcff = nopat + depreciation - capex - delta_nwc
        discount_factor = 1.0 / ((1.0 + req.wacc) ** year)
        pv_fcff = fcff * discount_factor
        pv_fcff_total += pv_fcff
        
        projections.append({
            "year": year,
            "revenue": round(revenue, 2),
            "growth_rate_pct": round(growth_rate * 100.0, 2),
            "ebitda": round(ebitda, 2),
            "ebit": round(ebit, 2),
            "nopat": round(nopat, 2),
            "depreciation": round(depreciation, 2),
            "capex": round(capex, 2),
            "delta_nwc": round(delta_nwc, 2),
            "fcff": round(fcff, 2),
            "discount_factor": round(discount_factor, 4),
            "pv_fcff": round(pv_fcff, 2)
        })
        
        if year == len(req.growth_rates):
            final_ebitda = ebitda
            final_fcff = fcff
            
    num_years = len(req.growth_rates)
    terminal_discount_factor = 1.0 / ((1.0 + req.wacc) ** num_years)
    
    # 1. Gordon Growth Model (Perpetual Growth)
    adj_wacc = req.wacc if req.wacc > req.terminal_growth_rate else (req.terminal_growth_rate + 0.01)
    terminal_value_gordon = (final_fcff * (1.0 + req.terminal_growth_rate)) / (adj_wacc - req.terminal_growth_rate)
    pv_terminal_value_gordon = terminal_value_gordon * terminal_discount_factor
    ev_gordon = pv_fcff_total + pv_terminal_value_gordon
    equity_val_gordon = max(0.0, ev_gordon - req.net_debt)
    share_price_gordon = (equity_val_gordon / req.shares_outstanding) if req.shares_outstanding > 0 else 0.0
    
    # 2. Exit Multiple Model
    terminal_value_multiple = final_ebitda * req.terminal_exit_multiple
    pv_terminal_value_multiple = terminal_value_multiple * terminal_discount_factor
    ev_multiple = pv_fcff_total + pv_terminal_value_multiple
    equity_val_multiple = max(0.0, ev_multiple - req.net_debt)
    share_price_multiple = (equity_val_multiple / req.shares_outstanding) if req.shares_outstanding > 0 else 0.0
    
    return DCFResponse(
        target_name=req.target_name,
        projections=projections,
        pv_free_cash_flows=round(pv_fcff_total, 2),
        terminal_value_gordon=round(terminal_value_gordon, 2),
        pv_terminal_value_gordon=round(pv_terminal_value_gordon, 2),
        enterprise_value_gordon=round(ev_gordon, 2),
        equity_value_gordon=round(equity_val_gordon, 2),
        implied_share_price_gordon=round(share_price_gordon, 2),
        terminal_value_multiple=round(terminal_value_multiple, 2),
        pv_terminal_value_multiple=round(pv_terminal_value_multiple, 2),
        enterprise_value_multiple=round(ev_multiple, 2),
        equity_value_multiple=round(equity_val_multiple, 2),
        implied_share_price_multiple=round(share_price_multiple, 2)
    )

