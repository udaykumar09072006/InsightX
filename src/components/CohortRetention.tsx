import React, { useState } from 'react';
import { Calendar, Users, RefreshCw, Info, AlertTriangle, Layers } from 'lucide-react';
import { ANALYTICS_DATA } from '../data/analyticsData';

export const CohortRetention: React.FC = () => {
  const { cohorts } = ANALYTICS_DATA;
  const [viewMode, setViewMode] = useState<'percent' | 'count'>('percent');

  // Heatmap background color logic based on percentage
  const getCellColor = (pct: number | null, isCensored: boolean, period: number) => {
    if (isCensored || pct === null) {
      return 'bg-slate-950/40 text-slate-700';
    }
    if (period === 0) {
      return 'bg-indigo-600/30 text-indigo-300 font-bold';
    }
    if (pct >= 40) return 'bg-cyan-500/40 text-cyan-200 font-bold';
    if (pct >= 30) return 'bg-cyan-500/25 text-cyan-300';
    if (pct >= 20) return 'bg-cyan-500/15 text-cyan-400';
    if (pct >= 10) return 'bg-slate-800 text-slate-300';
    return 'bg-slate-850 text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Customer Lifecycle & Retention Dynamics</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Monthly Acquisition Cohort Retention Matrix</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Tracks 13 monthly customer cohorts across a 12-month longitudinal lifecycle window to measure ongoing retention decay.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs">
            <div>
              <div className="text-slate-400">Total Repeat Purchase Rate</div>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {cohorts.repeat_purchase_rate_pct}%
              </div>
            </div>
            <div className="h-7 w-[1px] bg-slate-800"></div>
            <div>
              <div className="text-slate-400">Repeat Customers</div>
              <div className="text-base font-bold text-white font-mono">
                {cohorts.repeat_customers.toLocaleString()} Accounts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Heatmap Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Cohort Retention Heatmap (%)</h3>
            <p className="text-xs text-slate-400">
              Denominator ($M_0$): Initial cohort size = 100%. Darker cyan indicates higher monthly retention.
            </p>
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('percent')}
              className={`px-3 py-1.5 rounded font-medium transition ${
                viewMode === 'percent' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Retention %
            </button>
            <button
              onClick={() => setViewMode('count')}
              className={`px-3 py-1.5 rounded font-medium transition ${
                viewMode === 'count' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Customer Count
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3 text-left font-medium sticky left-0 bg-slate-900 z-10">Cohort</th>
                <th className="py-2.5 px-3 font-medium">Initial Size</th>
                {Array.from({ length: 13 }, (_, i) => (
                  <th key={i} className="py-2.5 px-2 font-medium">
                    M+{i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {cohorts.cohorts.map((c) => (
                <tr key={c.cohort} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-left font-semibold text-slate-200 sticky left-0 bg-slate-900 z-10 whitespace-nowrap">
                    {c.cohort}
                  </td>
                  <td className="py-2 px-3 font-bold text-indigo-300">
                    {c.initial_size}
                  </td>
                  {c.periods.map((p) => {
                    const cellVal = viewMode === 'percent' 
                      ? (p.retention_pct !== null ? `${p.retention_pct}%` : '—')
                      : (p.retained_count !== null ? p.retained_count : '—');
                    
                    return (
                      <td 
                        key={p.period}
                        className={`py-2 px-2 transition ${getCellColor(p.retention_pct, p.censored, p.period)}`}
                        title={p.censored ? 'Right-censored (outside dataset time window)' : `Cohort ${c.cohort} Month ${p.period}: ${p.retained_count} customers (${p.retention_pct}%)`}
                      >
                        {cellVal}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-cyan-500/40 inline-block"></span>
            <span>&ge; 40% Retention</span>
            <span className="w-3 h-3 rounded bg-cyan-500/20 inline-block ml-2"></span>
            <span>20% - 39%</span>
            <span className="w-3 h-3 rounded bg-slate-800 inline-block ml-2"></span>
            <span>&lt; 20%</span>
            <span className="w-3 h-3 rounded bg-slate-950 inline-block ml-2"></span>
            <span>Right-Censored (—)</span>
          </div>

          <div className="text-slate-500">
            *Right-censored cells represent periods occurring after December 9, 2011.
          </div>
        </div>
      </div>

      {/* Retention Decay Curve & Methodology Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention Decay Curve */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <h3 className="text-base font-bold text-white mb-1">Average Retention Decay by Period</h3>
          <p className="text-xs text-slate-400 mb-4">Cross-cohort average retention rate as months elapse from first purchase</p>

          <div className="h-44 flex items-end gap-2 pt-4 pb-2 border-b border-slate-800">
            {cohorts.period_averages.map((pa) => (
              <div key={pa.period} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                <div className="text-[10px] font-mono text-cyan-300 mb-1">
                  {Math.round(pa.avg_retention_pct)}%
                </div>
                <div 
                  style={{ height: `${Math.round(pa.avg_retention_pct)}%` }}
                  className="w-full max-w-[28px] bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t transition-all group-hover:brightness-125"
                ></div>
                <span className="text-[10px] font-mono text-slate-400 mt-2">
                  M+{pa.period}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 text-xs text-slate-400">
            Retention stabilizes in the <strong className="text-white">25% to 35%</strong> band after the initial Month 1 drop-off, demonstrating solid wholesale reorder behavior.
          </div>
        </div>

        {/* Methodology Notes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5 mb-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Cohort Analysis Definitions & Integrity
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-white block">Cohort Assignment:</span>
                Customers are assigned to a cohort based on the month of their <em>first completed transaction</em>.
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-white block">Repeat Purchase Rate vs Retention:</span>
                The <strong>Repeat Purchase Rate (65.58%)</strong> measures the proportion of customers with $\ge 2$ lifetime orders across the entire dataset. 
                In contrast, <strong>Cohort Retention</strong> measures monthly active participation over time.
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="font-bold text-white block">Exclusion of Guest Checkouts:</span>
                Only identified registered accounts (4,372 customers) can be tracked longitudinally; guest transactions are strictly segregated to avoid false churn signals.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
