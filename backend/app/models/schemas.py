from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

# ==================== STAGE 1 SCHEMAS ====================
class RawFinancialInput(BaseModel):
    ticker: str
    fiscal_year: int
    revenue: float
    operating_income: float
    depreciation_amortization: float
    stock_based_compensation: float = 0.0
    restructuring_costs: float = 0.0
    litigation_reserve: float = 0.0
    other_one_offs: float = 0.0
    current_assets: float
    current_liabilities: float
    total_debt: float
    interest_expense: float

class NormalizedStatement(BaseModel):
    fiscal_year: int
    revenue: float
    gross_profit: float
    operating_income: float
    depreciation_amortization: float
    reported_ebitda: float
    normalized_ebitda: float
    total_qoe_addbacks: float
    adjustments_breakdown: Dict[str, float]
    current_assets: float
    current_liabilities: float
    working_capital: float
    working_capital_pct_revenue: float
    total_debt: float
    interest_expense: float
    debt_to_ebitda: float
    interest_coverage: float
    covenant_compliance: Dict[str, bool]

class SECCompanyResponse(BaseModel):
    cik: str
    ticker: str
    name: str
    sector: str
    data_source: str
    historical_periods: List[NormalizedStatement]

class TargetSummary(BaseModel):
    ticker: str
    name: str
    sector: str
    cik: str
    latest_ebitda: float
    leverage_ratio: float

# ==================== STAGE 2 SCHEMAS ====================
class DebtTranche(BaseModel):
    name: str = "Senior Term Loan A"
    leverage_multiple: float = Field(default=3.0, description="Entry Debt / EBITDA multiple")
    interest_rate: float = Field(default=0.065, description="Annual interest rate (SOFR + spread)")
    amortization_rate: float = Field(default=0.05, description="Annual mandatory principal repayment %")
    seniority: int = Field(default=1, description="1 is senior, 2 is mezzanine/subordinated")

class LBORequest(BaseModel):
    target_name: str = "Apollo Enterprise Cloud"
    entry_ebitda: float = Field(default=59.8, description="Entry EBITDA ($M)")
    entry_multiple: float = Field(default=11.0, description="Entry EV / EBITDA multiple")
    holding_period: int = Field(default=5, ge=1, le=10, description="Holding period in years")
    exit_multiple: float = Field(default=12.0, description="Exit EV / EBITDA multiple")
    revenue_growth_rate: float = Field(default=0.08, description="Annual revenue growth CAGR")
    entry_revenue: float = Field(default=250.0, description="Entry Revenue ($M)")
    ebitda_margin_expansion: float = Field(default=0.005, description="Annual EBITDA margin expansion")
    tax_rate: float = Field(default=0.25, description="Corporate tax rate")
    capex_pct_rev: float = Field(default=0.04, description="CapEx as % of revenue")
    nwc_pct_rev: float = Field(default=0.02, description="Delta NWC as % of delta revenue")
    sponsor_equity_pct: Optional[float] = Field(default=None, description="Optional override for sponsor equity %")
    debt_tranches: List[DebtTranche] = Field(default_factory=lambda: [
        DebtTranche(name="Senior Term Loan A", leverage_multiple=3.0, interest_rate=0.065, amortization_rate=0.05, seniority=1),
        DebtTranche(name="Subordinated Notes", leverage_multiple=1.5, interest_rate=0.095, amortization_rate=0.0, seniority=2)
    ])
    max_leverage_covenant: float = Field(default=5.0, description="Max allowed Debt/EBITDA covenant")
    min_interest_coverage_covenant: float = Field(default=2.5, description="Min allowed EBITDA/Interest covenant")

class LBOResponse(BaseModel):
    target_name: str
    entry_ev: float
    total_debt_entry: float
    sponsor_equity_entry: float
    sponsor_equity_pct_entry: float
    exit_ev: float
    total_debt_exit: float
    sponsor_equity_exit: float
    moic: float
    irr: float
    annual_projections: List[Dict[str, Any]]
    debt_schedule: List[Dict[str, Any]]
    covenants_breached: bool
    covenant_analysis: List[Dict[str, Any]]

class DCFRequest(BaseModel):
    target_name: str = "Apollo Enterprise Cloud"
    current_revenue: float = Field(default=250.0, description="Baseline Revenue ($M)")
    growth_rates: List[float] = Field(default=[0.09, 0.08, 0.07, 0.06, 0.05], description="5-year growth rates")
    ebitda_margin: float = Field(default=0.239, description="EBITDA margin")
    tax_rate: float = Field(default=0.25, description="Corporate tax rate")
    depreciation_pct_rev: float = Field(default=0.035, description="D&A as % of revenue")
    capex_pct_rev: float = Field(default=0.04, description="CapEx as % of revenue")
    nwc_pct_rev: float = Field(default=0.02, description="Delta NWC as % of delta revenue")
    wacc: float = Field(default=0.095, description="Weighted Average Cost of Capital")
    terminal_growth_rate: float = Field(default=0.025, description="Gordon perpetual growth rate")
    terminal_exit_multiple: float = Field(default=11.0, description="Terminal EV/EBITDA multiple")
    net_debt: float = Field(default=130.0, description="Net Debt (Total Debt - Cash) ($M)")
    shares_outstanding: float = Field(default=20.0, description="Diluted shares count (M)")

class DCFResponse(BaseModel):
    target_name: str
    projections: List[Dict[str, Any]]
    pv_free_cash_flows: float
    terminal_value_gordon: float
    pv_terminal_value_gordon: float
    enterprise_value_gordon: float
    equity_value_gordon: float
    implied_share_price_gordon: float
    terminal_value_multiple: float
    pv_terminal_value_multiple: float
    enterprise_value_multiple: float
    equity_value_multiple: float
    implied_share_price_multiple: float

# ==================== STAGE 3 SCHEMAS ====================
class MonteCarloRequest(BaseModel):
    lbo_base: LBORequest
    num_simulations: int = Field(default=10000, ge=1000, le=50000, description="Number of Monte Carlo simulation runs")
    rev_growth_std: float = Field(default=0.03, description="Standard deviation for revenue growth rate")
    exit_multiple_std: float = Field(default=1.5, description="Standard deviation for exit multiple")
    interest_rate_std: float = Field(default=0.015, description="Standard deviation for interest rate shocks")
    ebitda_margin_std: float = Field(default=0.02, description="Standard deviation for EBITDA margin shifts")

class MonteCarloResponse(BaseModel):
    simulations_count: int
    computation_time_ms: float
    mean_irr: float
    median_irr: float
    std_irr: float
    p5_irr: float
    p25_irr: float
    p75_irr: float
    p95_irr: float
    mean_moic: float
    median_moic: float
    p5_moic: float
    p95_moic: float
    probability_covenant_breach: float
    probability_loss: float
    probability_hurdle_rate_20pct: float
    irr_distribution_bins: List[float]
    irr_distribution_counts: List[int]
    sample_scenarios: List[Dict[str, Any]]

class SensitivityRequest(BaseModel):
    lbo_base: LBORequest
    x_param: str = Field(default="exit_multiple", description="Parameter on horizontal axis")
    x_range: List[float] = Field(default=[9.0, 10.0, 11.0, 12.0, 13.0, 14.0])
    y_param: str = Field(default="revenue_growth_rate", description="Parameter on vertical axis")
    y_range: List[float] = Field(default=[0.04, 0.06, 0.08, 0.10, 0.12])
    metric: str = Field(default="irr", description="'irr' or 'moic'")

class SensitivityResponse(BaseModel):
    x_param: str
    x_values: List[float]
    y_param: str
    y_values: List[float]
    metric: str
    matrix: List[List[float]]
