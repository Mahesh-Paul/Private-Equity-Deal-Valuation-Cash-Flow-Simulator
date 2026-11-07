from typing import List
from copy import deepcopy
from ..models.schemas import SensitivityRequest, SensitivityResponse
from .lbo_engine import calculate_lbo

def generate_sensitivity_matrix(req: SensitivityRequest) -> SensitivityResponse:
    matrix: List[List[float]] = []
    
    for y_val in req.y_range:
        row: List[float] = []
        for x_val in req.x_range:
            sim_req = deepcopy(req.lbo_base)
            
            # Apply horizontal parameter
            if req.x_param == "exit_multiple":
                sim_req.exit_multiple = float(x_val)
            elif req.x_param == "revenue_growth_rate":
                sim_req.revenue_growth_rate = float(x_val)
            elif req.x_param == "entry_multiple":
                sim_req.entry_multiple = float(x_val)
            elif req.x_param == "leverage_multiple":
                if sim_req.debt_tranches:
                    sim_req.debt_tranches[0].leverage_multiple = float(x_val)
            elif req.x_param == "interest_rate":
                for t in sim_req.debt_tranches:
                    t.interest_rate = float(x_val)
                    
            # Apply vertical parameter
            if req.y_param == "revenue_growth_rate":
                sim_req.revenue_growth_rate = float(y_val)
            elif req.y_param == "exit_multiple":
                sim_req.exit_multiple = float(y_val)
            elif req.y_param == "entry_multiple":
                sim_req.entry_multiple = float(y_val)
            elif req.y_param == "leverage_multiple":
                if sim_req.debt_tranches:
                    sim_req.debt_tranches[0].leverage_multiple = float(y_val)
            elif req.y_param == "interest_rate":
                for t in sim_req.debt_tranches:
                    t.interest_rate = float(y_val)
                    
            # Compute LBO outcome for this scenario grid cell
            res = calculate_lbo(sim_req)
            val = res.irr if req.metric.lower() == "irr" else res.moic
            row.append(round(val, 2))
            
        matrix.append(row)
        
    return SensitivityResponse(
        x_param=req.x_param,
        x_values=req.x_range,
        y_param=req.y_param,
        y_values=req.y_range,
        metric=req.metric,
        matrix=matrix
    )

