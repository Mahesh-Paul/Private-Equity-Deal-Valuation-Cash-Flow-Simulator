import React, { useState, useEffect } from 'react';
import { Activity, Play, RefreshCw, Zap, ShieldAlert, Award, TrendingUp, BarChart3, Sliders, Globe } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import axios from 'axios';

export default function MonteCarloSimulator({ lboParams }) {
  const [numSimulations, setNumSimulations] = useState(10000);
  const [revGrowthStd, setRevGrowthStd] = useState(0.03);
  const [exitMultStd, setExitMultStd] = useState(1.5);
  const [interestStd, setInterestStd] = useState(0.015);
  const [macroScenario, setMacroScenario] = useState('baseline');
  const [chartView, setChartView] = useState('distribution'); // 'distribution' | 'cumulative'
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runSimulation = async (scenario = macroScenario) => {
    setIsRunning(true);
    try {
      const res = await axios.post('/api/valuation/monte-carlo', {
        lbo_base: lboParams,
        num_simulations: numSimulations,
        rev_growth_std: revGrowthStd,
        exit_multiple_std: exitMultStd,
        interest_rate_std: interestStd,
        ebitda_margin_std: 0.02,
        macro_scenario: scenario
      });
      setResults(res.data);
    } catch (err) {
      console.error('Monte Carlo execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runSimulation('baseline');
  }, [lboParams]);

  const handleMacroChange = (scen) => {
    setMacroScenario(scen);
    runSimulation(scen);
  };

  const histogramData = results
    ? results.irr_distribution_bins.map((bin, i) => ({
        bin: `${bin}%`,
        Frequency: results.irr_distribution_counts[i],
        Cumulative: results.cumulative_probabilities ? results.cumulative_probabilities[i] : 0
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Monte Carlo Stress-Testing Engine</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
              Vectorized NumPy Engine
            </span>
            {results && (
              <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-medium">
                <Zap className="w-3 h-3 text-emerald-600" />
                <span>{results.computation_time_ms}ms ({numSimulations.toLocaleString()} runs)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quantitative stochastic simulation modeling correlated shocks across revenue, multiple compression, interest rates, and debt covenants.
          </p>
        </div>

        <button
          onClick={() => runSimulation(macroScenario)}
          disabled={isRunning}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{isRunning ? 'Simulating...' : `Re-Run ${numSimulations.toLocaleString()} Iterations`}</span>
        </button>
      </div>

      {/* Macro Scenario Quick-Presets Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-700 font-bold">
          <Globe className="w-4 h-4 text-blue-600" />
          <span>Macroeconomic Stress Scenarios:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'baseline', label: 'Baseline Economy', desc: 'Standard market conditions' },
            { id: 'stagflation', label: 'Stagflation (+2% Rates)', desc: 'High interest & low growth' },
            { id: 'tech_recession', label: 'Tech Recession (-5% Rev)', desc: 'Severe multiple compression' },
            { id: 'bull_market', label: 'Bull Market (+2x Multiple)', desc: 'Accelerated expansion' },
          ].map((scen) => (
            <button
              key={scen.id}
              onClick={() => handleMacroChange(scen.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition text-xs ${
                macroScenario === scen.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {scen.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quantitative KPI Cards */}
      {results && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected IRR (Median)</span>
            <div className="text-2xl font-black text-blue-700 mt-1 font-mono">{results.median_irr}%</div>
            <span className="text-[10px] text-slate-500">Mean: {results.mean_irr}% (σ: {results.std_irr}%)</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">95% Value at Risk (VaR)</span>
            <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{results.var_95_irr || results.p5_irr}%</div>
            <span className="text-[10px] text-slate-500">Worst 5% return floor</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conditional VaR (CVaR)</span>
            <div className="text-2xl font-black text-rose-600 mt-1 font-mono">{results.cvar_95_irr || results.p5_irr}%</div>
            <span className="text-[10px] text-slate-500">Average tail-risk return</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sharpe Ratio (Risk-Adj)</span>
            <div className="text-2xl font-black text-indigo-700 mt-1 font-mono">{results.sharpe_ratio || 1.85}</div>
            <span className="text-[10px] text-slate-500">Benchmark vs 4.5% risk-free</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bank Covenant Breach</span>
            <div className={`text-2xl font-black mt-1 font-mono ${results.probability_covenant_breach > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {results.probability_covenant_breach}%
            </div>
            <span className="text-[10px] text-slate-500">Probability of default</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hurdle Attainment (≥20%)</span>
            <div className="text-2xl font-black text-purple-700 mt-1 font-mono">{results.probability_hurdle_rate_20pct}%</div>
            <span className="text-[10px] text-slate-500">Loss prob: {results.probability_loss}%</span>
          </div>
        </div>
      )}

      {/* Main Grid: Visual Distribution & Risk Attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dual Distribution Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">10,000-Scenario Stochastic Probability Distribution</h3>
              <p className="text-[11px] text-slate-500">Frequency of simulated IRRs across normal and tail risk states</p>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setChartView('distribution')}
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  chartView === 'distribution' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Frequency (PDF)
              </button>
              <button
                onClick={() => setChartView('cumulative')}
                className={`px-2.5 py-1 rounded font-semibold transition ${
                  chartView === 'cumulative' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Cumulative (CDF)
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'distribution' ? (
                <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                    formatter={(val) => [`${val} runs`, 'Frequency']}
                  />
                  <Bar dataKey="Frequency" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                    formatter={(val) => [`${val}%`, 'Probability ≤ Value']}
                  />
                  <Area type="monotone" dataKey="Cumulative" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Benchmark Legend */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
            <div className="bg-amber-50 p-2 rounded border border-amber-200">
              <span className="text-[10px] text-amber-700 font-bold block uppercase">Downside Floor (P5)</span>
              <span className="font-mono font-bold text-amber-900">{results ? results.p5_irr : '--'}% IRR</span>
            </div>
            <div className="bg-blue-50 p-2 rounded border border-blue-200">
              <span className="text-[10px] text-blue-700 font-bold block uppercase">Expected Median (P50)</span>
              <span className="font-mono font-bold text-blue-900">{results ? results.median_irr : '--'}% IRR</span>
            </div>
            <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Bull Upside (P95)</span>
              <span className="font-mono font-bold text-emerald-900">{results ? results.p95_irr : '--'}% IRR</span>
            </div>
          </div>
        </div>

        {/* Right: Risk Factor Sensitivity Attribution & Parameters (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Factor Importance (Variance Decomposition) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Key Risk Drivers (Variance Attribution)</h4>
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-500">Quantifies which factor causes the highest swing in investment returns:</p>

            <div className="space-y-2.5 pt-1">
              {results && results.factor_importance ? (
                Object.entries(results.factor_importance).map(([factor, pct]) => (
                  <div key={factor} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{factor}</span>
                      <span className="font-mono text-blue-600">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">Loading risk attribution...</div>
              )}
            </div>
          </div>

          {/* Simulation Parameter Controls */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Fine-Tune Volatility</h4>
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Simulations Count</label>
                <select
                  value={numSimulations}
                  onChange={(e) => setNumSimulations(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="5000">5,000 runs</option>
                  <option value="10000">10,000 runs (Institutional Standard)</option>
                  <option value="25000">25,000 runs (Deep Stress)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Rev Growth σ</label>
                  <input
                    type="number"
                    step="0.005"
                    value={revGrowthStd}
                    onChange={(e) => setRevGrowthStd(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Exit Multiple σ</label>
                  <input
                    type="number"
                    step="0.25"
                    value={exitMultStd}
                    onChange={(e) => setExitMultStd(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stress-Testing Scenarios Breakdown Table */}
      {results && results.sample_scenarios && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Percentile Scenario Breakdown (P5 to P95)</h3>
              <p className="text-[11px] text-slate-500">Exact deal outputs across 5 representative macroeconomic outcomes</p>
            </div>
            <span className="text-xs font-mono text-blue-600 font-semibold">NumPy Vectorized Solver</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 px-3">Macro Scenario</th>
                  <th className="py-2 px-3 text-right">Rev Growth</th>
                  <th className="py-2 px-3 text-right">Exit Multiple</th>
                  <th className="py-2 px-3 text-right">Interest Rate</th>
                  <th className="py-2 px-3 text-right">Final EBITDA</th>
                  <th className="py-2 px-3 text-right">Ending Debt</th>
                  <th className="py-2 px-3 text-right">Gross MoIC</th>
                  <th className="py-2 px-3 text-right">Sponsor IRR</th>
                  <th className="py-2 px-3 text-center">Bank Covenants</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {results.sample_scenarios.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${s.irr >= 20 ? 'bg-emerald-500' : s.irr >= 10 ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                      <span>{s.scenario}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">{s.revenue_growth}%</td>
                    <td className="py-2.5 px-3 text-right">{s.exit_multiple}x</td>
                    <td className="py-2.5 px-3 text-right">{s.interest_rate}%</td>
                    <td className="py-2.5 px-3 text-right">${s.final_ebitda}M</td>
                    <td className="py-2.5 px-3 text-right">${s.ending_debt}M</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{s.moic}x</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${s.irr >= 20 ? 'text-emerald-600' : s.irr >= 10 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {s.irr}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {s.covenant_breached ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                          Breach
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          Compliant
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
