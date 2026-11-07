import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import datetime
import json

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./financial_analytics.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class CompanyModel(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    cik = Column(String(10), unique=True, index=True)
    ticker = Column(String(10), unique=True, index=True)
    name = Column(String(255), nullable=False)
    sector = Column(String(100), default="Corporate Target")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    statements = relationship("FinancialStatementModel", back_populates="company", cascade="all, delete-orphan")
    valuations = relationship("DealValuationModel", back_populates="company")

class FinancialStatementModel(Base):
    __tablename__ = "financial_statements"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    fiscal_year = Column(Integer, nullable=False)
    revenue = Column(Float, nullable=False)
    gross_profit = Column(Float, default=0.0)
    operating_income = Column(Float, default=0.0)
    depreciation_amortization = Column(Float, default=0.0)
    reported_ebitda = Column(Float, nullable=False)
    normalized_ebitda = Column(Float, nullable=False)
    total_qoe_addbacks = Column(Float, default=0.0)
    adjustments_json = Column(Text, default="{}")
    current_assets = Column(Float, default=0.0)
    current_liabilities = Column(Float, default=0.0)
    working_capital = Column(Float, default=0.0)
    working_capital_pct_revenue = Column(Float, default=0.0)
    total_debt = Column(Float, default=0.0)
    interest_expense = Column(Float, default=0.0)
    debt_to_ebitda = Column(Float, default=0.0)
    interest_coverage = Column(Float, default=0.0)
    
    company = relationship("CompanyModel", back_populates="statements")

class DealValuationModel(Base):
    __tablename__ = "deal_valuations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    target_name = Column(String(255), nullable=False)
    deal_type = Column(String(50), default="LBO")
    entry_ebitda = Column(Float)
    entry_multiple = Column(Float)
    exit_multiple = Column(Float)
    holding_period = Column(Integer, default=5)
    leverage_multiple = Column(Float, default=4.5)
    irr = Column(Float)
    moic = Column(Float)
    covenants_breached = Column(Boolean, default=False)
    assumptions_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    company = relationship("CompanyModel", back_populates="valuations")

def init_db():
    from .services.sec_edgar import load_verified_database
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ver_db = load_verified_database()
        existing_tickers = {c.ticker for c in db.query(CompanyModel).all()}
        
        for key, val in ver_db.items():
            if val["ticker"] not in existing_tickers:
                comp = CompanyModel(
                    cik=val["cik"],
                    ticker=val["ticker"],
                    name=val["name"],
                    sector=val["sector"]
                )
                db.add(comp)
                db.commit()
                db.refresh(comp)
                for p in val["historical_periods"]:
                    stmt = FinancialStatementModel(
                        company_id=comp.id,
                        fiscal_year=p["fiscal_year"],
                        revenue=p["revenue"],
                        gross_profit=p["gross_profit"],
                        operating_income=p["operating_income"],
                        depreciation_amortization=p["depreciation_amortization"],
                        reported_ebitda=p["reported_ebitda"],
                        normalized_ebitda=p["normalized_ebitda"],
                        total_qoe_addbacks=p["total_qoe_addbacks"],
                        adjustments_json=json.dumps(p.get("adjustments_breakdown", {})),
                        current_assets=p["current_assets"],
                        current_liabilities=p["current_liabilities"],
                        working_capital=p["working_capital"],
                        working_capital_pct_revenue=p["working_capital_pct_revenue"],
                        total_debt=p["total_debt"],
                        interest_expense=p["interest_expense"],
                        debt_to_ebitda=p["debt_to_ebitda"],
                        interest_coverage=p["interest_coverage"]
                    )
                    db.add(stmt)
                db.commit()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
