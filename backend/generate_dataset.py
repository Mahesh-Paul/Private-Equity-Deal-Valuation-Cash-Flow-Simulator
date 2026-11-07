import json
import csv
import os

SECTOR_COMPANIES = {
    "Enterprise Software & Cloud SaaS": [
        {"ticker": "APOLLO", "cik": "0001850123", "name": "Apollo Enterprise Cloud Systems", "base_rev": 250.0, "ebitda_m": 0.239, "debt_mult": 2.17},
        {"ticker": "DATASYNC", "cik": "0001564408", "name": "DataSync Analytics Corp", "base_rev": 320.0, "ebitda_m": 0.285, "debt_mult": 1.85},
        {"ticker": "CYBERVAULT", "cik": "0001735738", "name": "CyberVault Security Solutions", "base_rev": 195.0, "ebitda_m": 0.220, "debt_mult": 2.40},
        {"ticker": "CLOUDFLOW", "cik": "0001644406", "name": "CloudFlow Infrastructure Inc", "base_rev": 410.0, "ebitda_m": 0.310, "debt_mult": 1.95},
        {"ticker": "OMNICOMM", "cik": "0001408356", "name": "OmniCommerce SaaS Group", "base_rev": 165.0, "ebitda_m": 0.195, "debt_mult": 2.65},
        {"ticker": "DEVSCALE", "cik": "0001659482", "name": "DevScale Platform Technologies", "base_rev": 280.0, "ebitda_m": 0.260, "debt_mult": 2.10},
        {"ticker": "APEXAI", "cik": "0001822839", "name": "Apex Enterprise AI Systems", "base_rev": 140.0, "ebitda_m": 0.180, "debt_mult": 1.70}
    ],
    "Healthcare & Medical Devices": [
        {"ticker": "BEACON", "cik": "0001420999", "name": "Beacon Medical Technologies", "base_rev": 395.0, "ebitda_m": 0.270, "debt_mult": 2.72},
        {"ticker": "NOVABIO", "cik": "0001043219", "name": "NovaBio Therapeutics Group", "base_rev": 480.0, "ebitda_m": 0.320, "debt_mult": 2.25},
        {"ticker": "CARDIOCORE", "cik": "0000885721", "name": "CardioCore Diagnostics Inc", "base_rev": 290.0, "ebitda_m": 0.245, "debt_mult": 2.80},
        {"ticker": "GENEXIS", "cik": "0001344401", "name": "Genexis Molecular Labs", "base_rev": 210.0, "ebitda_m": 0.210, "debt_mult": 3.10},
        {"ticker": "PULSEMED", "cik": "0000072444", "name": "PulseMed Surgical Robotics", "base_rev": 550.0, "ebitda_m": 0.290, "debt_mult": 2.30},
        {"ticker": "VITALIS", "cik": "0001524409", "name": "Vitalis Care Facilities Inc", "base_rev": 620.0, "ebitda_m": 0.175, "debt_mult": 3.85},
        {"ticker": "OPTIPHARM", "cik": "0000078003", "name": "OptiPharm Specialty Formulations", "base_rev": 340.0, "ebitda_m": 0.255, "debt_mult": 2.60}
    ],
    "Industrial Automation & Aerospace": [
        {"ticker": "PRECISION", "cik": "0000987654", "name": "Precision Industrial Automation", "base_rev": 535.0, "ebitda_m": 0.182, "debt_mult": 3.39},
        {"ticker": "AEROVECTOR", "cik": "0000091419", "name": "AeroVector Defense Systems", "base_rev": 750.0, "ebitda_m": 0.215, "debt_mult": 2.90},
        {"ticker": "KINETIC", "cik": "0000055135", "name": "Kinetic Robotics & Powertrain", "base_rev": 410.0, "ebitda_m": 0.165, "debt_mult": 3.50},
        {"ticker": "TURBOPAK", "cik": "0000030554", "name": "TurboPak Heavy Machinery", "base_rev": 680.0, "ebitda_m": 0.190, "debt_mult": 3.15},
        {"ticker": "HYDRAFLOW", "cik": "0000076334", "name": "HydraFlow Valves & Controls", "base_rev": 320.0, "ebitda_m": 0.205, "debt_mult": 2.80},
        {"ticker": "FORGETECH", "cik": "0000093634", "name": "ForgeTech Advanced Alloys", "base_rev": 460.0, "ebitda_m": 0.155, "debt_mult": 3.70},
        {"ticker": "CIRCUITEK", "cik": "0000789019", "name": "CircuiTek Embedded Modules", "base_rev": 275.0, "ebitda_m": 0.225, "debt_mult": 2.45}
    ],
    "Consumer & E-Commerce Retail": [
        {"ticker": "VELOCE", "cik": "0001397187", "name": "Veloce Athletic Apparel Group", "base_rev": 820.0, "ebitda_m": 0.190, "debt_mult": 2.10},
        {"ticker": "BEVTREND", "cik": "0000865752", "name": "BevTrend Organic Beverages", "base_rev": 450.0, "ebitda_m": 0.260, "debt_mult": 1.75},
        {"ticker": "PUREGLOW", "cik": "0001403568", "name": "PureGlow Beauty & Cosmetics", "base_rev": 390.0, "ebitda_m": 0.215, "debt_mult": 2.30},
        {"ticker": "URBANHOME", "cik": "0000913142", "name": "UrbanHome Direct Furnishings", "base_rev": 510.0, "ebitda_m": 0.140, "debt_mult": 3.25},
        {"ticker": "PETNOURISH", "cik": "0001764423", "name": "PetNourish Premium Petcare", "base_rev": 290.0, "ebitda_m": 0.170, "debt_mult": 2.80},
        {"ticker": "GOURMETB", "cik": "0001099801", "name": "GourmetBlend Artisan Foods", "base_rev": 330.0, "ebitda_m": 0.155, "debt_mult": 2.95},
        {"ticker": "OUTDOORX", "cik": "0001644409", "name": "OutdoorX Gear & Recreation", "base_rev": 420.0, "ebitda_m": 0.185, "debt_mult": 2.40}
    ],
    "FinTech & Financial Infrastructure": [
        {"ticker": "FINPAY", "cik": "0000877212", "name": "FinPay Payments Network", "base_rev": 950.0, "ebitda_m": 0.380, "debt_mult": 3.10},
        {"ticker": "LEDGERIX", "cik": "0001383312", "name": "Ledgerix Wealth Tech Systems", "base_rev": 380.0, "ebitda_m": 0.315, "debt_mult": 2.20},
        {"ticker": "CREDITLENS", "cik": "0001054290", "name": "CreditLens Risk Analytics", "base_rev": 420.0, "ebitda_m": 0.340, "debt_mult": 2.50},
        {"ticker": "CLEARSETTLE", "cik": "0001141391", "name": "ClearSettle Clearinghouse Inc", "base_rev": 610.0, "ebitda_m": 0.410, "debt_mult": 1.90},
        {"ticker": "INSURASOFT", "cik": "0001544405", "name": "InsuraSoft Policy Cloud", "base_rev": 260.0, "ebitda_m": 0.275, "debt_mult": 2.40},
        {"ticker": "QUANTMARKET", "cik": "0001424407", "name": "QuantMarket Securities Feed", "base_rev": 340.0, "ebitda_m": 0.360, "debt_mult": 2.05}
    ],
    "CleanTech & Energy Transition": [
        {"ticker": "SOLARIS", "cik": "0001463101", "name": "Solaris Photovoltaic Systems", "base_rev": 650.0, "ebitda_m": 0.220, "debt_mult": 2.95},
        {"ticker": "VOLTSTORAGE", "cik": "0001744408", "name": "VoltStorage Grid Energy", "base_rev": 380.0, "ebitda_m": 0.185, "debt_mult": 3.60},
        {"ticker": "AEROPOWER", "cik": "0001114402", "name": "AeroPower Wind Generation", "base_rev": 520.0, "ebitda_m": 0.240, "debt_mult": 3.40},
        {"ticker": "CLEANHYDRO", "cik": "0001814403", "name": "CleanHydro Electrolyzer Corp", "base_rev": 190.0, "ebitda_m": 0.150, "debt_mult": 3.90},
        {"ticker": "ECOGRID", "cik": "0001614404", "name": "EcoGrid Smart Metering Inc", "base_rev": 290.0, "ebitda_m": 0.210, "debt_mult": 2.75},
        {"ticker": "BIOFUELX", "cik": "0001314405", "name": "BioFuelX Renewable Diesel", "base_rev": 440.0, "ebitda_m": 0.195, "debt_mult": 3.30}
    ]
}

def generate_40_companies_dataset():
    filings_dict = {}
    csv_rows = []
    
    total_companies = 0
    for sector, companies in SECTOR_COMPANIES.items():
        for comp in companies:
            total_companies += 1
            ticker = comp["ticker"]
            name = comp["name"]
            cik = comp["cik"]
            base_rev = comp["base_rev"]
            ebitda_m = comp["ebitda_m"]
            debt_mult = comp["debt_mult"]
            
            # Generate 3 historical fiscal years: 2021, 2022, 2023
            periods = []
            for yr_idx, yr in enumerate([2021, 2022, 2023]):
                rev_scale = 1.0 - (0.16 - (yr_idx * 0.08))
                rev = round(base_rev * rev_scale, 1)
                gp = round(rev * 0.70, 1)
                da = round(rev * 0.035, 1)
                margin = ebitda_m - (0.015 - (yr_idx * 0.007))
                norm_ebitda = round(rev * margin, 1)
                qoe = round(norm_ebitda * 0.045, 1)
                rep_ebitda = round(norm_ebitda - qoe, 1)
                op_inc = round(rep_ebitda - da, 1)
                
                curr_assets = round(rev * 0.42, 1)
                curr_liab = round(rev * 0.24, 1)
                wc = round(curr_assets - curr_liab, 1)
                
                debt = round(norm_ebitda * debt_mult, 1)
                interest = round(debt * 0.065, 1)
                debt_to_ebitda = round(debt / norm_ebitda, 2)
                interest_cov = round(norm_ebitda / interest, 2) if interest > 0 else 99.0
                
                period_data = {
                    "fiscal_year": yr,
                    "revenue": rev,
                    "gross_profit": gp,
                    "operating_income": op_inc,
                    "depreciation_amortization": da,
                    "reported_ebitda": rep_ebitda,
                    "normalized_ebitda": norm_ebitda,
                    "total_qoe_addbacks": qoe,
                    "adjustments_breakdown": {
                        "stock_based_compensation": round(qoe * 0.7, 1),
                        "restructuring_and_migration": round(qoe * 0.3, 1)
                    },
                    "current_assets": curr_assets,
                    "current_liabilities": curr_liab,
                    "working_capital": wc,
                    "working_capital_pct_revenue": round(wc / rev * 100.0, 2),
                    "total_debt": debt,
                    "interest_expense": interest,
                    "debt_to_ebitda": debt_to_ebitda,
                    "interest_coverage": interest_cov,
                    "covenant_compliance": {
                        "leverage_under_4_5x": bool(debt_to_ebitda <= 4.5),
                        "interest_coverage_over_3_0x": bool(interest_cov >= 3.0)
                    }
                }
                periods.append(period_data)
                
                # CSV row
                csv_rows.append({
                    "ticker": ticker,
                    "name": name,
                    "sector": sector,
                    "fiscal_year": yr,
                    "revenue": rev,
                    "operating_income": op_inc,
                    "depreciation_amortization": da,
                    "reported_ebitda": rep_ebitda,
                    "normalized_ebitda": norm_ebitda,
                    "total_qoe_addbacks": qoe,
                    "current_assets": curr_assets,
                    "current_liabilities": curr_liab,
                    "working_capital": wc,
                    "total_debt": debt,
                    "interest_expense": interest,
                    "debt_to_ebitda": debt_to_ebitda,
                    "interest_coverage": interest_cov
                })
                
            filings_dict[ticker] = {
                "cik": cik,
                "ticker": ticker,
                "name": name,
                "sector": sector,
                "historical_periods": periods
            }
            
    # Write JSON
    os.makedirs("backend/data/sec_edgar", exist_ok=True)
    with open("backend/data/sec_edgar/filings.json", "w") as f:
        json.dump(filings_dict, f, indent=2)
        
    # Write CSV
    csv_fields = [
        "ticker", "name", "sector", "fiscal_year", "revenue", "operating_income",
        "depreciation_amortization", "reported_ebitda", "normalized_ebitda",
        "total_qoe_addbacks", "current_assets", "current_liabilities",
        "working_capital", "total_debt", "interest_expense", "debt_to_ebitda",
        "interest_coverage"
    ]
    with open("backend/data/sec_edgar/normalized_financials.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=csv_fields)
        writer.writeheader()
        writer.writerows(csv_rows)
        
    print(f"Dataset generated: {total_companies} companies across 6 sectors ({len(csv_rows)} statement rows)")

if __name__ == "__main__":
    generate_40_companies_dataset()

