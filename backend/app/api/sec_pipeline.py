from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json

from ..models.schemas import RawFinancialInput, NormalizedStatement, SECCompanyResponse, TargetSummary
from ..services.sec_edgar import FinancialNormalizerEngine
from ..database import get_db, CompanyModel, FinancialStatementModel

router = APIRouter()

@router.get("/sec/targets", response_model=List[TargetSummary])
def get_sec_targets():
    """
    Returns pre-indexed SEC target company benchmarks with latest normalized EBITDA and leverage ratios.
    """
    return FinancialNormalizerEngine.get_target_summaries()

@router.get("/sec/company/{ticker_or_cik}", response_model=SECCompanyResponse)
def get_sec_company_filings(ticker_or_cik: str, db: Session = Depends(get_db)):
    """
    Ingests and normalizes SEC EDGAR 10-K / 10-Q filings for a specific target asset or public CIK.
    """
    # 1. Try fetching from PostgreSQL / SQLite cache
    comp = db.query(CompanyModel).filter(
        (CompanyModel.ticker == ticker_or_cik.upper()) | (CompanyModel.cik == ticker_or_cik)
    ).first()
    
    if comp and comp.statements:
        periods = []
        for s in comp.statements:
            try:
                adj = json.loads(s.adjustments_json) if s.adjustments_json else {}
            except Exception:
                adj = {}
                
            periods.append(NormalizedStatement(
                fiscal_year=s.fiscal_year,
                revenue=s.revenue,
                gross_profit=s.gross_profit,
                operating_income=s.operating_income,
                depreciation_amortization=s.depreciation_amortization,
                reported_ebitda=s.reported_ebitda,
                normalized_ebitda=s.normalized_ebitda,
                total_qoe_addbacks=s.total_qoe_addbacks,
                adjustments_breakdown=adj,
                current_assets=s.current_assets,
                current_liabilities=s.current_liabilities,
                working_capital=s.working_capital,
                working_capital_pct_revenue=s.working_capital_pct_revenue,
                total_debt=s.total_debt,
                interest_expense=s.interest_expense,
                debt_to_ebitda=s.debt_to_ebitda,
                interest_coverage=s.interest_coverage,
                covenant_compliance={
                    "leverage_under_4_5x": bool(s.debt_to_ebitda <= 4.5),
                    "interest_coverage_over_3_0x": bool(s.interest_coverage >= 3.0)
                }
            ))
            
        return SECCompanyResponse(
            cik=comp.cik,
            ticker=comp.ticker,
            name=comp.name,
            sector=comp.sector,
            data_source="PostgreSQL Persistent Store (SEC EDGAR Verified)",
            historical_periods=sorted(periods, key=lambda p: p.fiscal_year)
        )
        
    # 2. Ingest via engine
    return FinancialNormalizerEngine.get_company_filings(ticker_or_cik)

@router.post("/sec/normalize", response_model=NormalizedStatement)
def normalize_custom_financials(inp: RawFinancialInput):
    """
    Normalizes a custom corporate financial statement period:
    Calculates EBITDA, applies Quality of Earnings (QoE) adjustments, and evaluates debt covenants.
    """
    try:
        return FinancialNormalizerEngine.normalize_single_period(inp)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Normalization failed: {str(e)}")

@router.get("/sec/database/records")
def list_database_records(db: Session = Depends(get_db)):
    """
    Lists company records currently persisted in PostgreSQL/SQLite.
    """
    comps = db.query(CompanyModel).all()
    return [
        {
            "id": c.id,
            "cik": c.cik,
            "ticker": c.ticker,
            "name": c.name,
            "sector": c.sector,
            "statement_count": len(c.statements),
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in comps
    ]

