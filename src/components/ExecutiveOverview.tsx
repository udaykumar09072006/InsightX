import React from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Calendar
} from 'lucide-react';
import { ANALYTICS_DATA } from '../data/analyticsData';

interface ExecutiveOverviewProps {
  selectedCountry: string;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({ selectedCountry }) => {
  const { kpi, countries, products } = ANALYTICS_DATA;

  // Filter country data if selected
  const activeCountryData = selectedCountry === 'ALL' 
    ? null 
    : countries.find(c => c.country.toLowerCase() === selectedCountry.toLowerCase());

  const displayRevenue = activeCountryData ? activeCountryData.revenue : kpi.total_gross_revenue;
  const displayOrders = activeCountryData ? activeCountryData.orders : kpi.total_orders;
  const displayUnits = activeCountryData ? activeCountryData.units_sold : kpi.total_units_sold;
  const displayAov = activeCountryData ? activeCountryData.aov : kpi.average_order_value;
  const displayCustomers = activeCountryData ? activeCountryData.unique_customers : kpi.unique_identified_customers;

  const maxMonthRev = Math.max(...kpi.monthly_trends.map(m => m.gross_revenue));

  return (
    <div className="space-y-6">
      {/* Top Banner Context */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Analysis Timeline: 2010-12-01 to 2011-12-09 (12 Months Trading)</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Performance & Revenue Overview</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real transactional analytics synthesized from 536,641 audited line items. All revenue is recognized strictly on fulfilled completed orders.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 rounded-lg px-4 py-2 text-xs">
          <div>
            <div className="text-slate-400">Net Financial Revenue</div>
            <div className="text-base font-bold text-emerald-400 font-mono">
              {selectedCountry === 'ALL' ? `£${kpi.net_revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : `£${displayRevenue.toLocaleString('en-GB')}`}
            </div>
          </div>
          <div className="h-7 w-[1px] bg-slate-800"></div>
          <div>
            <div className="text-slate-400">Refunds / Cancellations</div>
            <div className="text-base font-bold text-rose-400 font-mono">
              {selectedCountry === 'ALL' ? `£${kpi.total_cancellation_value.toLocaleString('en-GB')}` : 'Included'}
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Gross Sales Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">
              £{displayRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span className="text-emerald-400 flex items-center mr-1.5 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> +32.1%
            </span>
            <span>Peak Month: Nov 2011 (£1.51M)</span>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed Orders</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">
              {displayOrders.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">invoices</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span className="text-slate-300 font-mono mr-1">65.4</span>
            <span>avg orders per day across 305 trading days</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Average Order Value (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-cyan-300">
              £{displayAov.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">per order</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span className="text-cyan-400 font-medium mr-1.5">Intl: £894</span>
            <span>vs UK: £492 (Wholesale bulk effect)</span>
          </div>
        </div>

        {/* Identified Customers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Identified Customers</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">
              {displayCustomers.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-medium">65.6% Repeat Rate</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span>2,867 customers placed 2+ qualifying orders</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row: Monthly Trend & Country Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Gross Revenue Progression</h3>
              <p className="text-xs text-slate-400">Full 12-month trajectory showing Q4 seasonal peak in November 2011</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-slate-400">
                <span className="w-3 h-3 rounded bg-indigo-500 mr-1.5 inline-block"></span> Gross Sales
              </span>
              <span className="flex items-center text-slate-400">
                <span className="w-3 h-3 rounded bg-rose-500/50 mr-1.5 inline-block"></span> Cancellations
              </span>
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="h-64 flex items-end gap-2 pt-6 pb-2 border-b border-slate-800">
            {kpi.monthly_trends.map((m, idx) => {
              const heightPct = Math.round((m.gross_revenue / maxMonthRev) * 100);
              const isPeak = m.gross_revenue === maxMonthRev;
              const isCensored = m.month === '2011-12';

              return (
                <div key={m.month} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 shadow-xl z-20 whitespace-nowrap">
                    <div className="font-semibold text-white">{m.month} {isCensored ? '(Partial: 9 Days)' : ''}</div>
                    <div>Gross: £{m.gross_revenue.toLocaleString('en-GB')}</div>
                    <div>Orders: {m.orders.toLocaleString()} | AOV: £{m.average_order_value}</div>
                    {m.mom_growth_pct !== null && (
                      <div className={m.mom_growth_pct >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                        MoM: {m.mom_growth_pct >= 0 ? '+' : ''}{m.mom_growth_pct}%
                      </div>
                    )}
                  </div>

                  {/* MoM Badge */}
                  {m.mom_growth_pct !== null && (
                    <span className={`text-[9px] font-mono mb-1 hidden sm:block ${
                      m.mom_growth_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {m.mom_growth_pct >= 0 ? '+' : ''}{Math.round(m.mom_growth_pct)}%
                    </span>
                  )}

                  {/* Bar */}
                  <div 
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[32px] rounded-t transition-all group-hover:brightness-125 ${
                      isPeak 
                        ? 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-cyan-400 ring-1 ring-cyan-400/40' 
                        : isCensored 
                          ? 'bg-slate-700/80 border border-dashed border-slate-500' 
                          : 'bg-indigo-600/80 hover:bg-indigo-500'
                    }`}
                  ></div>

                  {/* Month Label */}
                  <span className="text-[10px] font-mono text-slate-400 mt-2 truncate w-full text-center">
                    {m.month.slice(5)}/{m.month.slice(2, 4)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center text-slate-500">
              <Info className="w-3.5 h-3.5 mr-1 text-slate-400" />
              *2011-12 captures Dec 1 to Dec 9 only (dataset cut-off date).
            </span>
            <span className="font-mono text-slate-300">
              Peak Month: <strong className="text-cyan-400">2011-11 (£1,509,496.33)</strong>
            </span>
          </div>
        </div>

        {/* Geographic Concentration (1 col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Geographic Revenue Share</h3>
            <p className="text-xs text-slate-400">Top 5 markets represent 91.5% of gross revenue</p>

            <div className="mt-4 space-y-3">
              {kpi.top_countries.slice(0, 5).map((c) => (
                <div key={c.country}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-200">{c.country}</span>
                    <span className="font-mono text-slate-300">
                      £{c.revenue.toLocaleString('en-GB')} ({c.revenue_share_pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        c.country === 'United Kingdom' 
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' 
                          : 'bg-indigo-500/70'
                      }`}
                      style={{ width: `${Math.min(c.revenue_share_pct, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Domestic (United Kingdom):</span>
              <strong className="text-white font-mono">82.1%</strong>
            </div>
            <div className="flex justify-between">
              <span>International Wholesale (37 Mkts):</span>
              <strong className="text-cyan-400 font-mono">17.9%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Products & Operational Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Hero Products (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Catalog Hero Products (Top Revenue Drivers)</h3>
              <p className="text-xs text-slate-400">Highest grossing giftware items across all trading quarters</p>
            </div>
            <span className="text-xs text-cyan-400 font-mono">Pareto Top 20% = 81.2% Sales</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 font-medium">Rank & SKU</th>
                  <th className="py-2.5 font-medium">Description</th>
                  <th className="py-2.5 font-medium text-right">Units Sold</th>
                  <th className="py-2.5 font-medium text-right">Orders</th>
                  <th className="py-2.5 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {products.slice(0, 5).map((p) => (
                  <tr key={p.stock_code} className="hover:bg-slate-800/40">
                    <td className="py-2.5">
                      <span className="font-semibold text-slate-300">#{p.rank}</span>
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">{p.stock_code}</span>
                    </td>
                    <td className="py-2.5 font-sans font-medium text-slate-200 max-w-[240px] truncate">
                      {p.description}
                    </td>
                    <td className="py-2.5 text-right text-slate-300">
                      {p.quantity.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-slate-400">
                      {p.orders_count.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">
                      £{p.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Evidence-Based Strategic Pillars (1 col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Empirical Findings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">Audited from real transaction distributions</p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="font-bold text-cyan-300">Champions Drive 63.3% Revenue:</span>
                <p className="text-slate-300 mt-0.5">
                  977 VIP customers account for £5.65M in sales with an average of 8.9 orders and 15.6 days recency.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="font-bold text-amber-300">At-Risk Accounts (£742K):</span>
                <p className="text-slate-300 mt-0.5">
                  621 high-spending accounts have not ordered in &gt; 180 days. Win-back campaign is high ROI.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="font-bold text-indigo-300">International Order Premium:</span>
                <p className="text-slate-300 mt-0.5">
                  Welch's t-test proves international orders average £894 vs UK £492 ($p &lt; 0.0001$).
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            Zero synthetic data • All computations run on raw UCI transactions
          </div>
        </div>
      </div>
    </div>
  );
};
