import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Save, RefreshCw, ChevronDown, ChevronUp, ArrowRight, DollarSign, TrendingUp } from 'lucide-react';
import DebtWaterfallChart from './DebtWaterfallChart';

export default function LBOModeler({ lboData, lboParams, setLboParams, onRecalculate, onSaveDeal, isRecalculating }) {
  const [activeSubTab, setActiveSubTab] = useState('summary');
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    <div className="space-y-5">
      {/* Top Banner / Company info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{lboParams.target_name}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              LBO Deal Modeler
            </span>
            {lboData.covenants_breached ? (
              <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Bank Limit Exceeded</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bank Compliant</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate company purchase, 5-year debt paydown with company profits, and exit investment return.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin text-blue-600' : ''}`} />
            <span>Recalculate</span>
          </button>
          <button
            onClick={onSaveDeal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Deal</span>
          </button>
        </div>
      </div>

      {/* 3-Step Simple Storyline Callout */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200/80 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">1</span>
            <div>
              <span className="font-bold text-slate-900 block">Buy Company</span>
              <span className="text-slate-600 font-mono">${lboData.entry_ev}M (${lboData.sponsor_equity_entry}M down)</span>
            </div>
          </div>
          <ArrowRight className="hidden sm:block w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">2</span>
            <div>
              <span className="font-bold text-slate-900 block">Pay Down Debt (Y1–Y5)</span>
              <span className="text-slate-600 font-mono">Debt drops to ${lboData.total_debt_exit}M</span>
            </div>
          </div>
          <ArrowRight className="hidden sm:block w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">3</span>
            <div>
              <span className="font-bold text-slate-900 block">Sell & Pocket Cash</span>
              <span className="text-emerald-700 font-bold font-mono">${lboData.sponsor_equity_exit}M ({lboData.moic}x Money)</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Purchase Price</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">${lboData.entry_ev}M</div>
          <span className="text-[10px] text-slate-500">at {lboParams.entry_multiple}x EBITDA</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Down Payment</span>
          <div className="text-xl font-bold text-blue-600 mt-1 font-mono">${lboData.sponsor_equity_entry}M</div>
          <span className="text-[10px] text-slate-500">{((lboData.sponsor_equity_entry / lboData.entry_ev) * 100).toFixed(1)}% cash down</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Selling Price</span>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">${lboData.exit_ev}M</div>
          <span className="text-[10px] text-slate-500">at {lboParams.exit_multiple}x Y5 EBITDA</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Cash Payout</span>
          <div className="text-xl font-bold text-indigo-600 mt-1 font-mono">${lboData.sponsor_equity_exit}M</div>
          <span className="text-[10px] text-slate-500">Net of ${lboData.total_debt_exit}M loan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Money Multiplier</span>
          <div className={`text-2xl font-black mt-1 font-mono ${lboData.moic >= 2.0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {lboData.moic}x
          </div>
          <span className="text-[10px] text-slate-500">Total cash returned</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Yearly Profit Rate</span>
          <div className={`text-2xl font-black mt-1 font-mono ${lboData.irr >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {lboData.irr}%
          </div>
          <span className="text-[10px] text-slate-500">Annual Return (IRR)</span>
        </div>
      </div>

      {/* Main Grid: Inputs (Left) & Output Schedules (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simplified Deal Parameters Panel (Left) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">4 Core Deal Inputs</h3>
              <p className="text-[11px] text-slate-500">Change these numbers to test your deal</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Input 1: Starting Profit */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="text-slate-800 font-bold block mb-1">1. Company Current Profit (EBITDA $M)</label>
              <input
                type="number"
                value={lboParams.entry_ebitda}
                onChange={(e) => handleParamChange('entry_ebitda', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-semibold focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block mt-1">Starting yearly operating profit</span>
            </div>

            {/* Input 2: Purchase Multiple */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="text-slate-800 font-bold block mb-1">2. Buy Price Multiple (x EBITDA)</label>
              <input
                type="number"
                step="0.5"
                value={lboParams.entry_multiple}
                onChange={(e) => handleParamChange('entry_multiple', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-semibold focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block mt-1">Total price = ${lboParams.entry_ebitda}M × {lboParams.entry_multiple}x = ${(lboParams.entry_ebitda * lboParams.entry_multiple).toFixed(1)}M</span>
            </div>

            {/* Input 3: Growth Rate */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="text-slate-800 font-bold block mb-1">3. Expected Yearly Growth (%)</label>
              <input
                type="number"
                step="0.01"
                value={lboParams.revenue_growth_rate}
                onChange={(e) => handleParamChange('revenue_growth_rate', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-semibold focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block mt-1">0.08 = 8% business growth per year</span>
            </div>

            {/* Input 4: Exit Multiple */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="text-slate-800 font-bold block mb-1">4. Future Selling Multiple (x EBITDA)</label>
              <input
                type="number"
                step="0.5"
                value={lboParams.exit_multiple}
                onChange={(e) => handleParamChange('exit_multiple', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-semibold focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block mt-1">Expected selling multiple at Year 5</span>
            </div>

            {/* Expandable Advanced Settings (Tucked away so it stays simple) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
              >
                <span>⚙️ Advanced Settings (Debt, Taxes, Covenants)</span>
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAdvanced && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-600 font-medium block">Revenue ($M)</label>
                      <input
                        type="number"
                        value={lboParams.entry_revenue}
                        onChange={(e) => handleParamChange('entry_revenue', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-medium block">Hold Period (Yrs)</label>
                      <input
                        type="number"
                        value={lboParams.holding_period}
                        onChange={(e) => handleParamChange('holding_period', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-medium block">Tax Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lboParams.tax_rate}
                        onChange={(e) => handleParamChange('tax_rate', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-medium block">Margin Expansion</label>
                      <input
                        type="number"
                        step="0.002"
                        value={lboParams.ebitda_margin_expansion}
                        onChange={(e) => handleParamChange('ebitda_margin_expansion', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Debt Tranches */}
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Bank Loans</span>
                    {lboParams.debt_tranches.map((tranche, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-[10px] flex justify-between items-center">
                        <span className="font-semibold text-slate-800">{tranche.name}</span>
                        <span className="font-mono text-blue-600">{tranche.leverage_multiple}x EBITDA ({tranche.interest_rate * 100}% int)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output View (Right) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveSubTab('summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'summary' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                📊 Debt Paydown Chart
              </button>
              <button
                onClick={() => setActiveSubTab('projections')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'projections' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                📋 5-Year Financial Table
              </button>
            </div>
            <span className="text-[11px] text-slate-500 font-mono font-medium">USD in Millions ($M)</span>
          </div>

          {/* Sub-tab 1: Visual Debt Paydown Chart */}
          {activeSubTab === 'summary' && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 text-xs text-slate-700">
                <span className="font-bold text-blue-900">How You Make Money: </span>
                Every year, the blue bar (loan balance) drops as operating profit pays it down. When you sell in Year 5, you pocket the remaining value.
              </div>
              <DebtWaterfallChart debtSchedule={lboData.debt_schedule} />
            </div>
          )}

          {/* Sub-tab 2: Simple 5-Year Financial Table */}
          {activeSubTab === 'projections' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3">Financial Metric</th>
                    {lboData.annual_projections.map((p) => (
                      <th key={p.year} className="py-2.5 px-3 text-right">Year {p.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">Revenue (Sales)</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right">${p.revenue}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 bg-blue-50/40">
                    <td className="py-2 px-3 font-semibold text-blue-900">Operating Profit (EBITDA)</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right font-bold text-blue-900">${p.ebitda}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">(-) Interest Expense</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right text-rose-600">(${p.interest_expense})</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">(-) Taxes Paid</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right text-rose-600">(${p.taxes})</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">Net Profit (After Tax)</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right font-semibold">${p.net_income}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 bg-emerald-50/40 font-bold">
                    <td className="py-2.5 px-3 text-emerald-900">Cash Flow to Pay Debt (CFADS)</td>
                    {lboData.annual_projections.map((p) => (
                      <td key={p.year} className="py-2.5 px-3 text-right text-emerald-700">${p.cfads}</td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* Simple Bottom Summary */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
                <span>Ending Remaining Debt in Year 5: <strong className="text-slate-900">${lboData.total_debt_exit}M</strong></span>
                <span>Final Cash Pocketed: <strong className="text-emerald-700">${lboData.sponsor_equity_exit}M</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}