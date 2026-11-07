from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.sec_pipeline import router as sec_router
from .api.valuation import router as valuation_router
from .database import init_db

app = FastAPI(
    title="Private Equity Deal Valuation & Financial Analytics Engine",
    description="Automated LBO, DCF, SEC EDGAR Ingestion, and Debt Covenant Engine",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "stages": ["Stage 1: SEC EDGAR Ingestion Pipeline", "Stage 2: LBO & DCF Valuation Engines"],
        "database": "SQLAlchemy (PostgreSQL / SQLite Dual Engine)",
        "version": "2.0.0"
    }

# Register API Routers
app.include_router(sec_router, prefix="/api")
app.include_router(valuation_router, prefix="/api/valuation")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
