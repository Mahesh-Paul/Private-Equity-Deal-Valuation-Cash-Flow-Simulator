import React, { useState } from 'react';
import { RefreshCw, Save, TrendingUp, DollarSign, ArrowRight, CheckCircle, Sliders } from 'lucide-react';
import DebtWaterfallChart from './DebtWaterfallChart';

export default function LBOModeler({ lboData, lboParams, setLboParams, onRecalculate, onSaveDeal, isRecalculating }) {
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table'

  const handleParamChange = (field, value) => {
    setLboParams((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  if (!lboData) return null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{lboParams.target_name}</h2>
            <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Financially Healthy</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            5-Year Cash Flow & Investment Return Simulator
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin text-blue-600' : ''}`} />
            <span>Recalculate</span>
          </button>
          <button
            onClick={onSaveDeal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Model</span>
          </button>
        </div>
      </div>

      {/* The 3 Core Steps (Replaces confusing clutter with a clear story) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 1: The Buy</span>
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">1</span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 block">Your Cash Down Payment</span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">${lboData.sponsor_equity_entry}M</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Company bought for <strong>${lboData.entry_ev}M</strong> (borrowing remaining ${(lboData.entry_ev - lboData.sponsor_equity_entry).toFixed(1)}M).
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 2: 5-Year Debt Payoff</span>
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">2</span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 block">Loan Balance Drops To</span>
            <div className="text-2xl font-black text-indigo-700 font-mono mt-0.5">${lboData.total_debt_exit}M</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Company profits rapidly crush the bank debt year-over-year.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-sm text-white relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">Step 3: The Profit</span>
            <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center">3</span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-emerald-100 block">Your Cash Payout</span>
            <div className="text-3xl font-black font-mono mt-0.5">${lboData.sponsor_equity_exit}M</div>
            <div className="flex items-center space-x-3 mt-1.5 text-xs font-bold text-white">
              <span className="bg-white/20 px-2 py-0.5 rounded-md font-mono">{lboData.moic}x Money</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-md font-mono">{lboData.irr}% Annual Return</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Working Area: Inputs on Left, Visuals on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (Clean & Non-Intimidating) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Key Deal Levers</h3>
            <p className="text-xs text-slate-500 mt-0.5">Adjust these 4 inputs to model any scenario</p>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Input 1 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">1. Yearly Profit (EBITDA $M)</label>
                <span className="font-mono font-bold text-blue-600">${lboParams.entry_ebitda}M</span>
              </div>
              <input
                type="number"
                value={lboParams.entry_ebitda}
                onChange={(e) => handleParamChange('entry_ebitda', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-semibold focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Current operating earnings</span>
            </div>

            {/* Input 2 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">2. Buying Price Multiple</label>
                <span className="font-mono font-bold text-blue-600">{lboParams.entry_multiple}x</span>
              </div>
              <input
                type="number"
                step="0.5"
                value={lboParams.entry_multiple}
                onChange={(e) => handleParamChange('entry_multiple', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-semibold focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Price paid today per dollar of profit</span>
            </div>

            {/* Input 3 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">3. Annual Growth Rate (%)</label>
                <span className="font-mono font-bold text-blue-600">{(lboParams.revenue_growth_rate * 100).toFixed(0)}%</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={lboParams.revenue_growth_rate}
                onChange={(e) => handleParamChange('revenue_growth_rate', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-semibold focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Expected business sales growth per year</span>
            </div>

            {/* Input 4 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">4. Selling Price Multiple</label>
                <span className="font-mono font-bold text-blue-600">{lboParams.exit_multiple}x</span>
              </div>
              <input
                type="number"
                step="0.5"
                value={lboParams.exit_multiple}
                onChange={(e) => handleParamChange('exit_multiple', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-semibold focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Expected valuation multiple in 5 years</span>
            </div>
          </div>
        </div>

        {/* Right Output Area (Visual & Intuitive) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cash Flow & Loan Reduction</h3>
              <p className="text-xs text-slate-500">Track how company cash flow pays off the debt</p>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  viewMode === 'chart' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                📊 Chart View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                📋 Table View
              </button>
            </div>
          </div>

          {viewMode === 'chart' ? (
            <div className="space-y-3">
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900">
                <strong>How You Profit:</strong> The blue bar (bank loan) shrinks each year as company cash flow pays it off. By Year 5, you own almost the whole business debt-free!
              </div>
              <DebtWaterfallChart debtSchedule={lboData.debt_schedule} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3">Metric</th>
                    {lboData.annual_projections.map((p) => (
                      <th key={p.year} className="py-2.5 px-3 text-right">Year {p.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">Company Sales</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right">${p.revenue}M</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 bg-blue-50/40">
                    <td className="py-2 px-3 font-bold text-blue-900">Operating Profit (EBITDA)</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right font-bold text-blue-900">${p.ebitda}M</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">(-) Taxes & Interest</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right text-rose-600">
                        (${((p.taxes || 0) + (p.interest_expense || 0)).toFixed(1)}M)
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 bg-emerald-50/40 font-bold">
                    <td className="py-2.5 px-3 text-emerald-900">Cash Flow to Pay Loan</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2.5 px-3 text-right text-emerald-700">${p.cfads}M</td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>Remaining Debt: <strong className="text-slate-900">${lboData.total_debt_exit}M</strong></span>
                <span>Final Cash Returned: <strong className="text-emerald-700 font-bold">${lboData.sponsor_equity_exit}M</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
