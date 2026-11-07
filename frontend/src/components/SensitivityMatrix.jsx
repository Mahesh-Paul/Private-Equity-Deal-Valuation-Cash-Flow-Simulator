import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function SensitivityMatrix({ lboParams }) {
  const [metric, setMetric] = useState('irr');
  const [xAxis, setXAxis] = useState('exit_multiple');
  const [yAxis, setYAxis] = useState('revenue_growth_rate');
  const [matrixData, setMatrixData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMatrix = async () => {
    setIsLoading(true);
    try {
      const xRange = xAxis === 'exit_multiple' 
        ? [9.0, 10.0, 11.0, 12.0, 13.0, 14.0]
        : [0.04, 0.06, 0.08, 0.10, 0.12];
        
      const yRange = yAxis === 'revenue_growth_rate'
        ? [0.04, 0.06, 0.08, 0.10, 0.12]
        : [9.0, 10.0, 11.0, 12.0, 13.0, 14.0];

      const res = await axios.post('/api/valuation/sensitivity', {
        lbo_base: lboParams,
        x_param: xAxis,
        x_range: xRange,
        y_param: yAxis,
        y_range: yRange,
        metric: metric
      });
      setMatrixData(res.data);
    } catch (err) {
      console.error("Failed to generate sensitivity matrix:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [metric, xAxis, yAxis, lboParams]);

  const getCellColor = (val) => {
    if (metric === 'irr') {
      if (val >= 25.0) return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      if (val >= 20.0) return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
      if (val >= 15.0) return 'bg-amber-50 text-amber-800 border-amber-200';
      return 'bg-rose-50 text-rose-800 border-rose-200';
    } else {
      if (val >= 2.5) return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      if (val >= 2.0) return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
      if (val >= 1.5) return 'bg-amber-50 text-amber-800 border-amber-200';
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
  };

  const formatParamLabel = (param, val) => {
    if (param === 'revenue_growth_rate' || param === 'interest_rate') {
      return `${(val * 100).toFixed(1)}%`;
    }
    return `${val.toFixed(1)}x`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Investment Sensitivity Heatmap</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              2D Scenario Stress-Testing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time returns matrix evaluating valuation multiples against top-line growth assumptions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMetric('irr')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                metric === 'irr' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              IRR (%)
            </button>
            <button
              onClick={() => setMetric('moic')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                metric === 'moic' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MoIC (x)
            </button>
          </div>

          <button
            onClick={fetchMatrix}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-4 flex justify-between items-center text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900">X-Axis:</span>
            <span className="text-blue-700 font-mono font-medium">Exit Multiple (EV / EBITDA)</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-bold text-slate-900">Y-Axis:</span>
            <span className="text-indigo-700 font-mono font-medium">Annual Revenue Growth CAGR</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
              <span className="text-slate-700">&gt;= 20% Hurdle</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>
              <span className="text-slate-700">15% - 20%</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300"></span>
              <span className="text-slate-700">&lt; 15% Sub-par</span>
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-xs text-slate-500 font-mono">Computing sensitivity grid...</span>
          </div>
        ) : matrixData ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-3 bg-slate-50 text-left text-slate-700 border border-slate-200 font-bold">
                    Rev Growth \ Exit Mult
                  </th>
                  {matrixData.x_values.map((x, i) => (
                    <th key={i} className="p-3 bg-slate-50 text-blue-800 font-bold border border-slate-200">
                      {formatParamLabel(matrixData.x_param, x)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.y_values.map((y, yIdx) => (
                  <tr key={yIdx}>
                    <td className="p-3 bg-slate-50 text-slate-900 font-bold text-left border border-slate-200">
                      {formatParamLabel(matrixData.y_param, y)}
                    </td>
                    {matrixData.matrix[yIdx].map((val, xIdx) => (
                      <td
                        key={xIdx}
                        className={`p-3.5 border border-slate-200 font-mono transition-all hover:scale-105 cursor-default ${getCellColor(
                          val
                        )}`}
                      >
                        <div className="text-sm font-bold">
                          {val}
                          {metric === 'irr' ? '%' : 'x'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
