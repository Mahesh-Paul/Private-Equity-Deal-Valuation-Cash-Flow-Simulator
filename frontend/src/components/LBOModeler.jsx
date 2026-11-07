import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Save, RefreshCw } from 'lucide-react';
import DebtWaterfallChart from './DebtWaterfallChart';

export default function LBOModeler({ lboData, lboParams, setLboParams, onRecalculate, onSaveDeal, isRecalculating }) {
  const [activeSubTab, setActiveSubTab] = useState('projections');

  const handleParamChange = (field, value) => {
    setLboParams((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleTrancheChange = (index, field, value) => {
    setLboParams((prev) => {
      const updatedTranches = [...prev.debt_tranches];
      updatedTranches[index] = {
        ...updatedTranches[index],
        [field]: parseFloat(value) || 0
      };
      return {
        ...prev,
        debt_tranches: updatedTranches
      };
    });
  };

  if (!lboData) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner / Target info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{lboParams.target_name}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              LBO Structuring
            </span>
            {lboData.covenants_breached ? (
              <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Covenant Breached</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Covenants Compliant</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Leveraged Buyout cash flow model with multi-tranche debt schedule & covenant monitoring
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin text-blue-600' : ''}`} />
            <span>Recalculate Model</span>
          </button>
          <button
            onClick={onSaveDeal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to Portfolio DB</span>
          </button>
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Entry Enterprise Val</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">${lboData.entry_ev}M</div>
          <span className="text-[10px] text-slate-500">at {lboParams.entry_multiple}x EBITDA</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sponsor Equity In</span>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">${lboData.sponsor_equity_entry}M</div>
          <span className="text-[10px] text-slate-500">{((lboData.sponsor_equity_entry / lboData.entry_ev) * 100).toFixed(1)}% of EV</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Exit Enterprise Val</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">${lboData.exit_ev}M</div>
          <span className="text-[10px] text-slate-500">at {lboParams.exit_multiple}x Y5 EBITDA</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sponsor Equity Out</span>
          <div className="text-xl font-bold text-indigo-600 mt-1 font-mono">${lboData.sponsor_equity_exit}M</div>
          <span className="text-[10px] text-slate-500">Net of ${lboData.total_debt_exit}M debt</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross MoIC</span>
          <div className={`text-2xl font-black mt-1 font-mono ${lboData.moic >= 2.0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {lboData.moic}x
          </div>
          <span className="text-[10px] text-slate-500">Multiple on Invested Capital</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sponsor IRR</span>
          <div className={`text-2xl font-black mt-1 font-mono ${lboData.irr >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {lboData.irr}%
          </div>
          <span className="text-[10px] text-slate-500">Hurdle benchmark: 20.0%</span>
        </div>
      </div>

      {/* Main Grid: Inputs (Left) & Output Schedules (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deal Parameters Panel */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Deal Assumptions & Inputs</h3>
            <span className="text-[10px] font-mono text-slate-500">Institutional PE Standard</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Valuation & Size */}
            <div className="space-y-3">
              <span className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">1. Valuation & Size</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Entry EBITDA ($M)</label>
                  <input
                    type="number"
                    value={lboParams.entry_ebitda}
                    onChange={(e) => handleParamChange('entry_ebitda', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Entry Revenue ($M)</label>
                  <input
                    type="number"
                    value={lboParams.entry_revenue}
                    onChange={(e) => handleParamChange('entry_revenue', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Entry Multiple (x)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={lboParams.entry_multiple}
                    onChange={(e) => handleParamChange('entry_multiple', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Exit Multiple (x)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={lboParams.exit_multiple}
                    onChange={(e) => handleParamChange('exit_multiple', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Operating Projections */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <span className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">2. Operating Projections</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Rev Growth Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lboParams.revenue_growth_rate}
                    onChange={(e) => handleParamChange('revenue_growth_rate', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Holding Period (Yrs)</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={lboParams.holding_period}
                    onChange={(e) => handleParamChange('holding_period', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Margin Expansion (%/yr)</label>
                  <input
                    type="number"
                    step="0.002"
                    value={lboParams.ebitda_margin_expansion}
                    onChange={(e) => handleParamChange('ebitda_margin_expansion', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lboParams.tax_rate}
                    onChange={(e) => handleParamChange('tax_rate', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Debt Structure */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <span className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">3. Debt Structure & Covenants</span>
              {lboParams.debt_tranches.map((tranche, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold text-blue-700">
                    <span>{tranche.name}</span>
                    <span className="font-mono">{tranche.leverage_multiple}x EBITDA</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block">Lev Multiple</label>
                      <input
                        type="number"
                        step="0.25"
                        value={tranche.leverage_multiple}
                        onChange={(e) => handleTrancheChange(idx, 'leverage_multiple', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block">Interest Rate</label>
                      <input
                        type="number"
                        step="0.005"
                        value={tranche.interest_rate}
                        onChange={(e) => handleTrancheChange(idx, 'interest_rate', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block">Amortization</label>
                      <input
                        type="number"
                        step="0.01"
                        value={tranche.amortization_rate}
                        onChange={(e) => handleTrancheChange(idx, 'amortization_rate', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedules & Waterfall (Right) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveSubTab('projections')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'projections' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                P&L Projections ($M)
              </button>
              <button
                onClick={() => setActiveSubTab('debt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'debt' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Debt Schedule & Covenants
              </button>
              <button
                onClick={() => setActiveSubTab('waterfall')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'waterfall' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Debt Paydown Waterfall
              </button>
            </div>
            <span className="text-[11px] text-slate-500 font-mono font-medium">Currency: USD ($M)</span>
          </div>

          {/* Sub-tab 1: P&L Table */}
          {activeSubTab === 'projections' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3">Line Item</th>
                    {lboData.annual_projections.map((p) => (
                      <th key={p.year} className="py-2.5 px-3 text-right">Year {p.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">Revenue</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right">${p.revenue}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 bg-blue-50/60 font-bold text-blue-800">
                    <td className="py-2 px-3">EBITDA</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right">${p.ebitda}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 text-slate-500">
                    <td className="py-2 px-3">(-) Interest Expense</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right text-rose-600 font-medium">(${p.interest_expense})</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 text-slate-500">
                    <td className="py-2 px-3">(-) Taxes Paid</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right text-rose-600 font-medium">(${p.taxes})</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 font-bold text-slate-900">
                    <td className="py-2 px-3">Net Income</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right">${p.net_income}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 bg-emerald-50/80 font-bold text-emerald-800">
                    <td className="py-2.5 px-3">CFADS (Cash for Debt Service)</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2.5 px-3 text-right">${p.cfads}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-tab 2: Debt Schedule */}
          {activeSubTab === 'debt' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2.5 px-3">Debt Element</th>
                      {lboData.debt_schedule.map((d) => (
                        <th key={d.year} className="py-2.5 px-3 text-right">Year {d.year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900">Beginning Debt Balance</td>
                      {lboData.debt_schedule.map((d) => (
                        <td key={d.year} className="py-2 px-3 text-right">${d.beginning_debt}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50 text-emerald-700 font-semibold">
                      <td className="py-2 px-3">(-) Mandatory Amortization</td>
                      {lboData.debt_schedule.map((d) => (
                        <td key={d.year} className="py-2 px-3 text-right">(${d.mandatory_amortization || d.amortization || 0})</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50 text-emerald-700 font-semibold">
                      <td className="py-2 px-3">(-) Cash Sweep Repayment</td>
                      {lboData.debt_schedule.map((d) => (
                        <td key={d.year} className="py-2 px-3 text-right">(${d.cash_sweep_prepayment || d.cash_sweep || 0})</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-slate-50 font-bold text-slate-900 bg-slate-100/80">
                      <td className="py-2 px-3">Ending Total Debt</td>
                      {lboData.debt_schedule.map((d) => (
                        <td key={d.year} className="py-2 px-3 text-right">${d.ending_debt}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Covenant Table */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-slate-800 font-bold text-xs mb-2 block">Covenant Stress-Testing Check</span>
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 px-3">Covenant Metric</th>
                      {lboData.covenant_analysis.map((c) => (
                        <th key={c.year} className="py-2 px-3 text-right">Year {c.year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 text-slate-700">Leverage Ratio (Debt/EBITDA)</td>
                      {lboData.covenant_analysis.map((c) => (
                        <td key={c.year} className={`py-2 px-3 text-right ${c.leverage_ratio > c.max_leverage_threshold ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                          {c.leverage_ratio}x
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-700">Interest Coverage (EBITDA/Int)</td>
                      {lboData.covenant_analysis.map((c) => (
                        <td key={c.year} className={`py-2 px-3 text-right ${c.interest_coverage < c.min_interest_threshold ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                          {c.interest_coverage}x
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Waterfall */}
          {activeSubTab === 'waterfall' && (
            <DebtWaterfallChart debtSchedule={lboData.debt_schedule} />
          )}
        </div>
      </div>
    </div>
  );
}
