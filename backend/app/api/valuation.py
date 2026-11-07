from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json

from ..models.schemas import (
    LBORequest, LBOResponse,
    DCFRequest, DCFResponse,
    MonteCarloRequest, MonteCarloResponse,
    SensitivityRequest, SensitivityResponse
)
from ..services.lbo_engine import calculate_lbo
from ..services.dcf_engine import calculate_dcf
from ..services.monte_carlo import run_monte_carlo_simulation
from ..services.sensitivity import generate_sensitivity_matrix
from ..database import get_db, DealValuationModel

router = APIRouter()

@router.post("/lbo", response_model=LBOResponse)
def api_calculate_lbo(req: LBORequest):
    """
    Computes complete LBO financial structure:
    Sources & Uses, Debt Schedule, Cash Sweep, MoIC, and exact annualized IRR.
    """
    try:
        return calculate_lbo(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"LBO computation failed: {str(e)}")

@router.post("/dcf", response_model=DCFResponse)
def api_calculate_dcf(req: DCFRequest):
    """
    Computes 5-Year Unlevered Free Cash Flow (FCFF) DCF Model:
    WACC discounting, Gordon Growth TV, Exit Multiple TV, and implied share prices.
    """
    try:
        return calculate_dcf(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DCF computation failed: {str(e)}")

@router.post("/monte-carlo", response_model=MonteCarloResponse)
def api_run_monte_carlo(req: MonteCarloRequest):
    """
    Executes 10,000+ Vectorized Monte Carlo Stress-Test Simulations:
    Evaluates returns distributions, covenant breach probabilities, and Value-at-Risk (VaR).
    """
    try:
        return run_monte_carlo_simulation(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Monte Carlo simulation failed: {str(e)}")

@router.post("/sensitivity", response_model=SensitivityResponse)
def api_generate_sensitivity(req: SensitivityRequest):
    """
    Generates 2D IRR or MoIC sensitivity matrices across key valuation and operating drivers.
    """
    try:
        return generate_sensitivity_matrix(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Sensitivity matrix calculation failed: {str(e)}")

@router.post("/save-deal")
def api_save_deal(deal: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Persists an executed LBO/DCF deal into PostgreSQL/SQLite portfolio storage.
    """
    try:
        rec = DealValuationModel(
            target_name=deal.get("target_name", "Target Asset"),
            deal_type=deal.get("deal_type", "LBO"),
            entry_ebitda=deal.get("entry_ebitda", 50.0),
            entry_multiple=deal.get("entry_multiple", 11.0),
            exit_multiple=deal.get("exit_multiple", 12.0),
            holding_period=deal.get("holding_period", 5),
            leverage_multiple=deal.get("leverage_multiple", 4.5),
            irr=deal.get("irr"),
            moic=deal.get("moic"),
            covenants_breached=deal.get("covenants_breached", False),
            assumptions_json=json.dumps(deal)
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return {"status": "success", "deal_id": rec.id, "target_name": rec.target_name}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to persist deal: {str(e)}")

@router.get("/deals")
def api_list_deals(db: Session = Depends(get_db)):
    """
    Lists saved portfolio deals from the database.
    """
    deals = db.query(DealValuationModel).order_by(DealValuationModel.created_at.desc()).limit(20).all()
    return [
        {
            "id": d.id,
            "target_name": d.target_name,
            "deal_type": d.deal_type,
            "irr": d.irr,
            "moic": d.moic,
            "covenants_breached": d.covenants_breached,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in deals
    ]
