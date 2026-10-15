import React, { useState } from 'react';
import { Database, Users, Crown, ShieldAlert, Moon, Sparkles, TrendingUp, Search, Info } from 'lucide-react';
import { ANALYTICS_DATA } from '../data/analyticsData';

export const CustomerRFM: React.FC = () => {
  const { rfm, rfm_sample } = ANALYTICS_DATA;
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');
  const [customerSearch, setCustomerSearch] = useState<string>('');

  const segments = rfm.segments;

  const filteredCustomers = rfm_sample.filter(c => {
    const matchesSeg = selectedSegment === 'ALL' || c.segment === selectedSegment;
    const matchesSearch = c.customer_id.includes(customerSearch) || c.country.toLowerCase().includes(customerSearch.toLowerCase());
    return matchesSeg && matchesSearch;
  });

  const getSegmentColor = (seg: string) => {
    switch (seg) {
      case 'Champions': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Loyal Customers': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'Potential Loyalists': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'At Risk': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'Hibernating': return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
      case 'About to Sleep': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      default: return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1">
              <Database className="w-3.5 h-3.5" />
              <span>Customer Segmentation Matrix (Quintile Scoring 1-5)</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Recency, Frequency, & Monetary (RFM) Intelligence</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Partitioning 4,372 identified customer accounts into actionable behavioral cohorts evaluated against reference date <span className="font-mono text-cyan-400">{rfm.reference_date}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs">
            <div>
              <div className="text-slate-400">Total Evaluated Base</div>
              <div className="text-base font-bold text-white font-mono">{rfm.total_customers.toLocaleString()} Accounts</div>
            </div>
            <div className="h-7 w-[1px] bg-slate-800"></div>
            <div>
              <div className="text-slate-400">Champions Revenue</div>
              <div className="text-base font-bold text-amber-400 font-mono">63.3% of Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {segments.map((s) => {
          const isSelected = selectedSegment === s.segment;
          return (
            <div 
              key={s.segment}
              onClick={() => setSelectedSegment(isSelected ? 'ALL' : s.segment)}
              className={`p-4 rounded-xl border transition cursor-pointer ${
                isSelected 
                  ? 'bg-slate-850 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg' 
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getSegmentColor(s.segment)}`}>
                  {s.segment}
                </span>
                <span className="text-xs font-mono text-slate-400">{s.customer_pct}% base</span>
              </div>

              <div className="mt-3">
                <div className="text-lg font-bold font-mono text-white">
                  £{s.total_revenue.toLocaleString('en-GB')}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  <span className="font-mono text-cyan-400 font-semibold">{s.revenue_pct}%</span> of identified spend
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[11px] text-slate-400 font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Recency</div>
                  <div className="text-slate-200">{s.avg_recency_days}d</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Freq</div>
                  <div className="text-slate-200">{s.avg_frequency_orders} ord</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Avg Spend</div>
                  <div className="text-slate-200">£{Math.round(s.avg_monetary_spend)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategic Playbooks per Segment */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-bold text-white mb-3">Actionable Lifecycle Playbooks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center space-x-1.5 font-bold text-amber-300 mb-1">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Champions & VIP Tier (977 Accounts)</span>
            </div>
            <p className="text-slate-400 mt-1">
              Produce 63.3% of revenue (£5.65M). Deploy dedicated account managers, early access to incoming gift catalogs, volume rebate agreements, and automated alert if re-order interval exceeds 3 weeks.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center space-x-1.5 font-bold text-indigo-300 mb-1">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Loyal Customers (1,025 Accounts)</span>
            </div>
            <p className="text-slate-400 mt-1">
              Produce £1.25M in revenue with frequent orders (avg 4.2 orders). Upsell complementary product bundles, introduce tiered loyalty rewards, and incentivize higher basket sizes.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center space-x-1.5 font-bold text-rose-300 mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>At Risk & Churn Mitigation (621 Accounts)</span>
            </div>
            <p className="text-slate-400 mt-1">
              Generated £742K historically but silent for an average of 264 days. High priority for proactive reactivation campaigns, catalog lookbooks, and time-limited freight subsidies.
            </p>
          </div>
        </div>
      </div>

      {/* Sample Customer Directory with Scores */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Customer Account Directory (RFM Profiles)</h3>
            <p className="text-xs text-slate-400">
              Showing scored profiles {selectedSegment !== 'ALL' ? `(Filtered by: ${selectedSegment})` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search Customer ID or Country..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition w-56"
              />
            </div>

            {selectedSegment !== 'ALL' && (
              <button
                onClick={() => setSelectedSegment('ALL')}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-medium">Customer ID</th>
                <th className="py-2.5 px-3 font-medium">Market</th>
                <th className="py-2.5 px-3 font-medium">Last Order Date</th>
                <th className="py-2.5 px-3 font-medium text-right">Recency (Days)</th>
                <th className="py-2.5 px-3 font-medium text-right">Frequency (Orders)</th>
                <th className="py-2.5 px-3 font-medium text-right">Net Spend (£)</th>
                <th className="py-2.5 px-3 font-medium text-center">R-F-M Score</th>
                <th className="py-2.5 px-3 font-medium text-right">Segment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredCustomers.slice(0, 15).map((c) => (
                <tr key={c.customer_id} className="hover:bg-slate-800/50 transition">
                  <td className="py-2.5 px-3 font-semibold text-white">
                    {c.customer_id}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">
                    {c.country}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {c.last_order_date}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {c.recency}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {c.frequency}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    £{c.monetary.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[11px]">
                      {c.rfm_score}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getSegmentColor(c.segment)}`}>
                      {c.segment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
