import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function SecEdgarPipeline({ onSelectTarget }) {
  const [targets, setTargets] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState('APOLLO');
  const [selectedCompanyData, setSelectedCompanyData] = useState(null);
  const [activeSector, setActiveSector] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sectors = [
    'ALL',
    'Enterprise Software & Cloud SaaS',
    'Healthcare & Medical Devices',
    'Industrial Automation & Aerospace',
    'Consumer & E-Commerce Retail',
    'FinTech & Financial Infrastructure',
    'CleanTech & Energy Transition'
  ];

  const fetchTargets = async () => {
    try {
      const res = await axios.get('/api/sec/targets');
      setTargets(res.data);
    } catch (err) {
      console.error('Failed to load SEC targets:', err);
    }
  };

  const fetchCompanyDetails = async (ticker) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/sec/company/${ticker}`);
      setSelectedCompanyData(res.data);
      setSelectedTicker(ticker);
    } catch (err) {
      console.error('Failed to load company details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
    fetchCompanyDetails('APOLLO');
  }, []);

  const filteredTargets = targets.filter((t) => {
    const matchesSector = activeSector === 'ALL' || t.sector === activeSector;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.ticker.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const handleApplyToModel = () => {
    if (!selectedCompanyData || !selectedCompanyData.historical_periods.length) return;
    const latest = selectedCompanyData.historical_periods[selectedCompanyData.historical_periods.length - 1];
    onSelectTarget({
      target_name: selectedCompanyData.name,
      entry_ebitda: latest.normalized_ebitda,
      entry_revenue: latest.revenue,
      entry_multiple: 11.0,
      holding_period: 5,
      exit_multiple: 12.0,
      revenue_growth_rate: 0.08
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">SEC EDGAR Ingestion & QoE Pipeline</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              40 Targets Across 6 PE Sectors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated normalization of Form 10-K filings: Quality of Earnings add-backs, working capital, and covenants
          </p>
        </div>

        <button
          onClick={handleApplyToModel}
          disabled={!selectedCompanyData}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
        >
          <span>Load into Valuation Models</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sector Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1 text-xs">
        {sectors.map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveSector(sec)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-semibold ${
              activeSector === sec
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {sec === 'ALL' ? 'All Sectors (40)' : sec}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Targets List (Left 5 Cols) */}
        <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[580px]">
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company or ticker (e.g. APOLLO, NOVABIO, VELOCE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {filteredTargets.map((t) => {
              const isSelected = selectedTicker === t.ticker;
              return (
                <div
                  key={t.ticker}
                  onClick={() => fetchCompanyDetails(t.ticker)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-xs text-slate-900 tracking-wide">{t.ticker}</span>
                      <p className="text-[11px] text-slate-700 font-medium line-clamp-1">{t.name}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      CIK {t.cik}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>EBITDA: <strong className="text-emerald-700 font-bold">${t.latest_ebitda}M</strong></span>
                    <span>Leverage: <strong className="text-blue-700 font-bold">{t.leverage_ratio}x</strong></span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{t.sector.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Target Deep-Dive (Right 7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          {isLoading ? (
            <div className="h-[520px] flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : selectedCompanyData ? (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedCompanyData.name}</h3>
                    <p className="text-xs text-blue-700 font-medium">{selectedCompanyData.sector} | Ticker: {selectedCompanyData.ticker}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedCompanyData.data_source}
                  </span>
                </div>
              </div>

              {/* 3-Year Audited Schedule */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">
                  3-Year Normalized Quality of Earnings (QoE) Schedule
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2 px-2">Metric ($M)</th>
                        {selectedCompanyData.historical_periods.map((p) => (
                          <th key={p.fiscal_year} className="py-2 px-2 text-right">FY {p.fiscal_year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-1.5 px-2 font-medium text-slate-900">Revenue</td>
                        {selectedCompanyData.historical_periods.map((p) => (
                          <td key={p.fiscal_year} className="py-1.5 px-2 text-right">${p.revenue}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 text-slate-500">Reported EBITDA</td>
                        {selectedCompanyData.historical_periods.map((p) => (
                          <td key={p.fiscal_year} className="py-1.5 px-2 text-right text-slate-500">${p.reported_ebitda}</td>
                        ))}
                      </tr>
                      <tr className="text-amber-700 font-medium">
                        <td className="py-1.5 px-2">(+) QoE Add-Backs</td>
                        {selectedCompanyData.historical_periods.map((p) => (
                          <td key={p.fiscal_year} className="py-1.5 px-2 text-right">+${p.total_qoe_addbacks}</td>
                        ))}
                      </tr>
                      <tr className="bg-emerald-50/80 font-bold text-emerald-800">
                        <td className="py-2 px-2">Normalized EBITDA</td>
                        {selectedCompanyData.historical_periods.map((p) => (
                          <td key={p.fiscal_year} className="py-2 px-2 text-right">${p.normalized_ebitda}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2">Net Working Capital</td>
                        {selectedCompanyData.historical_periods.map((p) => (
                          <td key={p.fiscal_year} className="py-1.5 px-2 text-right">${p.working_capital}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2">Total Debt Outstanding</td>
                        {selectedCompanyData.historical_periods.map((p) => (
                          <td key={p.fiscal_year} className="py-1.5 px-2 text-right">${p.total_debt}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2">Leverage Ratio (Debt/EBITDA)</td>
                        {selectedCompanyData.historical_periods.map((p) => (
                          <td key={p.fiscal_year} className="py-1.5 px-2 text-right text-blue-700 font-bold">{p.debt_to_ebitda}x</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2">Interest Coverage</td>
                        {selectedCompanyData.historical_periods.map((p) => (
                          <td key={p.fiscal_year} className="py-1.5 px-2 text-right text-indigo-700 font-bold">{p.interest_coverage}x</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
