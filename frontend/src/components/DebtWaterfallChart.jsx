import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function DebtWaterfallChart({ debtSchedule }) {
  if (!debtSchedule || debtSchedule.length === 0) return null;

  const chartData = debtSchedule.map((d) => ({
    name: `Year ${d.year}`,
    'Ending Debt': d.ending_debt,
    'Amortization Paid': d.mandatory_amortization || d.amortization || 0,
    'Cash Sweep Paid': d.cash_sweep_prepayment || d.cash_sweep || 0,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900">Deleveraging & Debt Paydown Velocity</h4>
        <p className="text-xs text-slate-500">Cumulative senior debt principal reduction through operational cash flow sweep</p>
      </div>

      <div className="h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="M" />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px', color: '#0f172a' }}
              formatter={(value) => [`$${value}M`, '']}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar dataKey="Ending Debt" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Amortization Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cash Sweep Paid" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
