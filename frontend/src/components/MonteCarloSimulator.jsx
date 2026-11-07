import React, { useState } from 'react';
import { Activity, Play, RefreshCw, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import axios from 'axios';

export default function MonteCarloSimulator({ lboParams }) {
  const [numSimulations, setNumSimulations] = useState(10000);
  const [revGrowthStd, setRevGrowthStd] = useState(0.03);
  const [exitMultStd, setExitMultStd] = useState(1.5);
  const [interestStd, setInterestStd] = useState(0.015);
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runSimulation = async () => {
    setIsRunning(true);
    try {
      const res = await axios.post('/api/valuation/monte-carlo', {
        lbo_base: lboParams,
        num_simulations: numSimulations,
        rev_growth_std: revGrowthStd,
        exit_multiple_std: exitMultStd,
        interest_rate_std: interestStd,
        ebitda_margin_std: 0.02
      });
      setResults(res.data);
    } catch (err) {
      console.error('Monte Carlo execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const chartData = results
    ? results.irr_distribution_bins.map((bin, i) => ({
        bin: `${bin}%`,
        Frequency: results.irr_distribution_counts[i]
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">10,000+ Monte Carlo Stress-Testing Engine</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
              Vectorized NumPy Engine
            </span>
            {results && (
              <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-medium">
                <Zap className="w-3 h-3 text-emerald-600" />
                <span>{results.computation_time_ms}ms</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulates {numSimulations.toLocaleString()} stochastic buyout scenarios across volatile debt markets and growth shocks
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={isRunning}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{isRunning ? 'Running Simulations...' : `Run ${numSimulations.toLocaleString()} Simulations`}</span>
        </button>
      </div>

      {/* Parameter Controls Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <label className="text-slate-600 font-medium block mb-1">Iterations Count</label>
          <select
            value={numSimulations}
            onChange={(e) => setNumSimulations(parseInt(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
          >
            <option value="5000">5,000 runs</option>
            <option value="10000">10,000 runs (Institutional)</option>
            <option value="25000">25,000 runs (Deep Stress)</option>
          </select>
        </div>
        <div>
          <label className="text-slate-600 font-medium block mb-1">Rev Growth Volatility (Std Dev)</label>
          <input
            type="number"
            step="0.005"
            value={revGrowthStd}
            onChange={(e) => setRevGrowthStd(parseFloat(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
          />
        </div>
        <div>
          <label className="text-slate-600 font-medium block mb-1">Exit Multiple Volatility (Std Dev)</label>
          <input
            type="number"
            step="0.25"
            value={exitMultStd}
            onChange={(e) => setExitMultStd(parseFloat(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
          />
        </div>
        <div>
          <label className="text-slate-600 font-medium block mb-1">Interest Rate Shock (Std Dev)</label>
          <input
            type="number"
            step="0.005"
            value={interestStd}
            onChange={(e) => setInterestStd(parseFloat(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {results ? (
        <>
          {/* Statistical KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Median IRR (P50)</span>
              <div className="text-2xl font-black text-blue-700 mt-1 font-mono">{results.median_irr}%</div>
              <span className="text-[10px] text-slate-500">Mean: {results.mean_irr}%</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Downside VaR (P5)</span>
              <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{results.p5_irr}%</div>
              <span className="text-[10px] text-slate-500">95% confidence floor</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bull Case (P95)</span>
              <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{results.p95_irr}%</div>
              <span className="text-[10px] text-slate-500">Top 5% upside</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Median MoIC</span>
              <div className="text-2xl font-black text-indigo-700 mt-1 font-mono">{results.median_moic}x</div>
              <span className="text-[10px] text-slate-500">P5: {results.p5_moic}x | P95: {results.p95_moic}x</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Default Risk (Covenants)</span>
              <div className={`text-2xl font-black mt-1 font-mono ${results.probability_covenant_breach > 15 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {results.probability_covenant_breach}%
              </div>
              <span className="text-[10px] text-slate-500">Covenant breach probability</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hurdle Attainment</span>
              <div className="text-2xl font-black text-purple-700 mt-1 font-mono">{results.probability_hurdle_rate_20pct}%</div>
              <span className="text-[10px] text-slate-500">Odds of &gt;= 20% IRR</span>
            </div>
          </div>

          {/* Return Distribution Histogram Chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Empirical Return Distribution (IRR %)</h3>
            <p className="text-xs text-slate-500 mb-4">Monte Carlo simulation frequency curve across {numSimulations.toLocaleString()} vectorized iterations</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                    formatter={(val) => [`${val} iterations`, 'Frequency']}
                  />
                  <Bar dataKey="Frequency" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scenario Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Representative Scenario Pathways</h3>
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 px-3">Scenario</th>
                  <th className="py-2 px-3 text-right">Rev Growth</th>
                  <th className="py-2 px-3 text-right">Exit Multiple</th>
                  <th className="py-2 px-3 text-right">Interest Rate</th>
                  <th className="py-2 px-3 text-right">Ending Debt</th>
                  <th className="py-2 px-3 text-right">MoIC</th>
                  <th className="py-2 px-3 text-right">IRR (%)</th>
                  <th className="py-2 px-3 text-right">Covenant Breach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {results.sample_scenarios.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900">{s.scenario}</td>
                    <td className="py-2 px-3 text-right">{s.revenue_growth}%</td>
                    <td className="py-2 px-3 text-right">{s.exit_multiple}x</td>
                    <td className="py-2 px-3 text-right">{s.interest_rate}%</td>
                    <td className="py-2 px-3 text-right">${s.ending_debt}M</td>
                    <td className="py-2 px-3 text-right font-bold text-blue-700">{s.moic}x</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600">{s.irr}%</td>
                    <td className={`py-2 px-3 text-right font-bold ${s.covenant_breached ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {s.covenant_breached ? 'BREACHED' : 'PASS'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center">
          <Activity className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Run Vectorized Monte Carlo Stress-Test</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
            Click the button above to simulate 10,000+ stochastic buyout permutations and visualize empirical IRR distributions.
          </p>
          <button
            onClick={runSimulation}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
          >
            Execute 10,000 Runs Now
          </button>
        </div>
      )}
    </div>
  );
}
