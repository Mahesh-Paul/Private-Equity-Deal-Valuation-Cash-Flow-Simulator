'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import LBOModeler from './components/LBOModeler';
import SensitivityMatrix from './components/SensitivityMatrix';
import MonteCarloSimulator from './components/MonteCarloSimulator';
import DCFValuation from './components/DCFValuation';
import SecEdgarPipeline from './components/SecEdgarPipeline';
import SavedDealsModal from './components/SavedDealsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('lbo');
  const [isSavedDealsOpen, setIsSavedDealsOpen] = useState(false);
  const [savedDealsCount, setSavedDealsCount] = useState(0);

  // Core LBO Assumptions State
  const [lboParams, setLboParams] = useState({
    target_name: 'Apollo Enterprise Cloud Systems',
    entry_ebitda: 59.8,
    entry_multiple: 11.0,
    holding_period: 5,
    exit_multiple: 12.0,
    revenue_growth_rate: 0.08,
    entry_revenue: 250.0,
    ebitda_margin_expansion: 0.005,
    tax_rate: 0.25,
    capex_pct_rev: 0.04,
    nwc_pct_rev: 0.02,
    debt_tranches: [
      { name: 'Senior Term Loan A', leverage_multiple: 3.0, interest_rate: 0.065, amortization_rate: 0.05, seniority: 1 },
      { name: 'Subordinated Notes', leverage_multiple: 1.5, interest_rate: 0.095, amortization_rate: 0.0, seniority: 2 }
    ],
    max_leverage_covenant: 5.0,
    min_interest_coverage_covenant: 2.5
  });

  const [lboData, setLboData] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const calculateLBO = async (params = lboParams) => {
    setIsRecalculating(true);
    try {
      const res = await axios.post('/api/valuation/lbo', params);
      setLboData(res.data);
    } catch (err) {
      console.error('LBO model computation failed:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleSaveDeal = async () => {
    if (!lboData) return;
    try {
      await axios.post('/api/valuation/save-deal', {
        target_name: lboParams.target_name,
        deal_type: 'LBO',
        entry_ebitda: lboParams.entry_ebitda,
        entry_multiple: lboParams.entry_multiple,
        exit_multiple: lboParams.exit_multiple,
        holding_period: lboParams.holding_period,
        leverage_multiple: 4.5,
        irr: lboData.irr,
        moic: lboData.moic,
        covenants_breached: lboData.covenants_breached
      });
      setSavedDealsCount((c) => c + 1);
      showToast(`Deal "${lboParams.target_name}" saved to portfolio database!`);
    } catch (err) {
      console.error('Failed to save deal:', err);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectTargetFromPipeline = (targetPayload) => {
    const updated = {
      ...lboParams,
      ...targetPayload
    };
    setLboParams(updated);
    calculateLBO(updated);
    setActiveTab('lbo');
    showToast(`Loaded ${targetPayload.target_name} into Valuation Engine!`);
  };

  useEffect(() => {
    calculateLBO();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSavedDeals={() => setIsSavedDealsOpen(true)}
        savedCount={savedDealsCount}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'lbo' && (
          <LBOModeler
            lboData={lboData}
            lboParams={lboParams}
            setLboParams={setLboParams}
            onRecalculate={() => calculateLBO(lboParams)}
            onSaveDeal={handleSaveDeal}
            isRecalculating={isRecalculating}
          />
        )}

        {activeTab === 'sensitivity' && (
          <SensitivityMatrix lboParams={lboParams} />
        )}

        {activeTab === 'monte-carlo' && (
          <MonteCarloSimulator lboParams={lboParams} />
        )}

        {activeTab === 'dcf' && (
          <DCFValuation targetData={lboParams} />
        )}

        {activeTab === 'sec-edgar' && (
          <SecEdgarPipeline onSelectTarget={handleSelectTargetFromPipeline} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-mono">
        Private Equity Deal Valuation & Cash Flow Simulator | Institutional M&A Analytics | Next.js, React.js, FastAPI, PostgreSQL & Docker
      </footer>

      <SavedDealsModal
        isOpen={isSavedDealsOpen}
        onClose={() => setIsSavedDealsOpen(false)}
      />
    </div>
  );
}
