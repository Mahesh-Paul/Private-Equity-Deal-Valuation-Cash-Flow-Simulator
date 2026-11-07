import React from 'react';
import { TrendingUp, Activity, Database, Bookmark, FileText } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSavedDeals, savedCount = 0 }) {
  const tabs = [
    { id: 'lbo', label: 'LBO Modeler', icon: TrendingUp },
    { id: 'monte-carlo', label: '10k Risk Simulator', icon: Activity },
    { id: 'sec-edgar', label: 'SEC Filings', icon: Database },
    { id: 'dcf', label: 'DCF Valuation', icon: FileText },
  ];

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
                  CAPITALMETRICS
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded leading-none">
                  Simple PE
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium mt-1 leading-none">
                Private Equity Valuation & Returns
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Badges */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenSavedDeals}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 transition-all"
            >
              <Bookmark className="w-3.5 h-3.5 text-blue-600" />
              <span>Saved Deals</span>
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                  {savedCount}
                </span>
              )}
            </button>
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>FastAPI Live</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
