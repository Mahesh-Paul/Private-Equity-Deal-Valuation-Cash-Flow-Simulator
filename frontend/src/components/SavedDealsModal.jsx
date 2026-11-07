import React, { useEffect, useState } from 'react';
import { X, Bookmark, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

export default function SavedDealsModal({ isOpen, onClose }) {
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDeals = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/valuation/deals');
      setDeals(res.data);
    } catch (err) {
      console.error('Failed to load portfolio deals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDeals();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Portfolio Saved Deals & LBO Case Studies</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-[450px] overflow-y-auto space-y-2">
          {deals.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No saved deals found in database. Execute an LBO model and click "Save to Portfolio DB".
            </div>
          ) : (
            deals.map((d) => (
              <div key={d.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{d.target_name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-mono font-medium">
                      {d.deal_type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-700">{d.irr}% IRR</div>
                    <div className="text-[10px] font-mono text-slate-500">{d.moic}x MoIC</div>
                  </div>
                  {d.covenants_breached ? (
                    <span className="p-1 rounded bg-rose-100 text-rose-700">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1 rounded bg-emerald-100 text-emerald-700">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
