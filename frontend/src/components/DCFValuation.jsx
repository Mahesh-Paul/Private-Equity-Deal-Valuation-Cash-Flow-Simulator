import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function DCFValuation({ targetData }) {
  const [dcfParams, setDcfParams] = useState({
    target_name: targetData?.target_name || 'Apollo Enterprise Cloud Systems',
    current_revenue: targetData?.entry_revenue || 250.0,
    growth_rates: [0.09, 0.08, 0.07, 0.06, 0.05],
    ebitda_margin: 0.239,
    tax_rate: 0.25,
    depreciation_pct_rev: 0.035,
    capex_pct_rev: 0.04,
    nwc_pct_rev: 0.02,
    wacc: 0.095,
    terminal_growth_rate: 0.025,
    terminal_exit_multiple: 11.0,
    net_debt: 130.0,
    shares_outstanding: 20.0
  });

  const [dcfResult, setDcfResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDCF = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post('/api/valuation/dcf', dcfParams);
      setDcfResult(res.data);
    } catch (err) {
      console.error('Failed to compute DCF:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (targetData) {
      setDcfParams((prev) => ({
        ...prev,
        target_name: targetData.target_name,
        current_revenue: targetData.entry_revenue || prev.current_revenue
      }));
    }
  }, [targetData]);

  useEffect(() => {
    fetchDCF();
  }, [dcfParams.wacc, dcfParams.terminal_growth_rate, dcfParams.terminal_exit_multiple, dcfParams.current_revenue]);

  const handleParamChange = (field, val) => {
    setDcfParams((prev) => ({
      ...prev,
      [field]: parseFloat(val) || 0
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Discounted Cash Flow (DCF) Engine</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Dual Terminal Valuation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unlevered Free Cash Flow (FCFF) discounted at WACC with Perpetual Growth and Exit Multiple cross-checks
          </p>
        </div>

        <button
          onClick={fetchDCF}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Recalculate DCF</span>
        </button>
      </div>

      {dcfResult && (
        <>
          {/* Dual Valuation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Method A: Gordon Perpetual Growth</span>
                  <div className="text-3xl font-black text-slate-900 mt-1 font-mono">${dcfResult.implied_share_price_gordon}</div>
                  <span className="text-xs text-slate-500">Implied Fair Share Price</span>
                </div>
                <div className="text-right font-mono text-xs text-slate-600 space-y-0.5">
                  <div>Enterprise Val: <strong className="text-slate-900">${dcfResult.enterprise_value_gordon}M</strong></div>
                  <div>Equity Value: <strong className="text-slate-900">${dcfResult.equity_value_gordon}M</strong></div>
                  <div>PV of TV: <strong className="text-blue-700">${dcfResult.pv_terminal_value_gordon}M</strong></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Method B: Exit Multiple Benchmark</span>
                  <div className="text-3xl font-black text-slate-900 mt-1 font-mono">${dcfResult.implied_share_price_multiple}</div>
                  <span className="text-xs text-slate-500">Implied Fair Share Price</span>
                </div>
                <div className="text-right font-mono text-xs text-slate-600 space-y-0.5">
                  <div>Enterprise Val: <strong className="text-slate-900">${dcfResult.enterprise_value_multiple}M</strong></div>
                  <div>Equity Value: <strong className="text-slate-900">${dcfResult.equity_value_multiple}M</strong></div>
                  <div>PV of TV: <strong className="text-indigo-700">${dcfResult.pv_terminal_value_multiple}M</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Parameters & FCFF Schedule Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">DCF Drivers & WACC</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Discount Rate (WACC %)</label>
                  <input
                    type="number"
                    step="0.005"
                    value={dcfParams.wacc}
                    onChange={(e) => handleParamChange('wacc', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Perpetual Growth Rate (g %)</label>
                  <input
                    type="number"
                    step="0.002"
                    value={dcfParams.terminal_growth_rate}
                    onChange={(e) => handleParamChange('terminal_growth_rate', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Terminal Exit Multiple (x)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={dcfParams.terminal_exit_multiple}
                    onChange={(e) => handleParamChange('terminal_exit_multiple', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Net Debt ($M)</label>
                  <input
                    type="number"
                    value={dcfParams.net_debt}
                    onChange={(e) => handleParamChange('net_debt', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Shares Outstanding (M)</label>
                  <input
                    type="number"
                    value={dcfParams.shares_outstanding}
                    onChange={(e) => handleParamChange('shares_outstanding', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2 mb-3">
                Unlevered Free Cash Flow Projections ($M)
              </h3>
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 px-3">Line Item</th>
                    {dcfResult.projections.map((p) => (
                      <th key={p.year} className="py-2 px-3 text-right">Year {p.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-900">Revenue</td>
                    {dcfResult.projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right">${p.revenue}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-blue-700">EBITDA</td>
                    {dcfResult.projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right font-semibold text-blue-700">${p.ebitda}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-slate-800">EBIT</td>
                    {dcfResult.projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right">${p.ebit}</td>
                    ))}
                  </tr>
                  <tr className="bg-emerald-50/80 font-bold text-emerald-800">
                    <td className="py-2 px-3">Unlevered FCFF</td>
                    {dcfResult.projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right">${p.fcff}</td>
                    ))}
                  </tr>
                  <tr className="font-bold text-slate-900 bg-slate-50">
                    <td className="py-2 px-3">Present Value (PV) of FCFF</td>
                    {dcfResult.projections.map((p) => (
                      <td key={p.year} className="py-2 px-3 text-right">${p.pv_fcff}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
