import React, { useState } from 'react';
import { Layers, Search, Filter, ArrowUpDown, PieChart, TrendingUp, Info } from 'lucide-react';
import { ANALYTICS_DATA } from '../data/analyticsData';

export const ProductAnalytics: React.FC = () => {
  const { products, kpi } = ANALYTICS_DATA;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity' | 'orders'>('revenue');

  const filteredProducts = products.filter(p => 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.stock_code.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'revenue') return b.revenue - a.revenue;
    if (sortBy === 'quantity') return b.quantity - a.quantity;
    return b.orders_count - a.orders_count;
  });

  // Pareto key milestones
  const paretoMilestones = [
    { rank: 10, share: 8.42, desc: 'Top 10 Hero SKUs' },
    { rank: 50, share: 23.15, desc: 'Top 50 Core Sellers' },
    { rank: 200, share: 45.80, desc: 'Top 200 Catalog Staples' },
    { rank: 814, share: 81.22, desc: 'Top 20% SKUs (80/20 Cut-off)' },
    { rank: 2000, share: 96.10, desc: 'Top 50% SKUs' },
    { rank: 4070, share: 100.0, desc: 'Full Catalog (Long Tail)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Pareto Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Catalog Velocity & Unit Economics</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Sales & Product Performance Analytics</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Analyzing 4,070 unique stock keeping units (SKUs) sold across 5.57M physical units.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs">
            <div>
              <div className="text-slate-400">Catalog Size</div>
              <div className="text-base font-bold text-white font-mono">{kpi.total_products.toLocaleString()} SKUs</div>
            </div>
            <div className="h-7 w-[1px] bg-slate-800"></div>
            <div>
              <div className="text-slate-400">Pareto Concentration</div>
              <div className="text-base font-bold text-cyan-400 font-mono">81.22% in Top 20%</div>
            </div>
            <div className="h-7 w-[1px] bg-slate-800"></div>
            <div>
              <div className="text-slate-400">Total Units Sold</div>
              <div className="text-base font-bold text-emerald-400 font-mono">{kpi.total_units_sold.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pareto 80/20 Visual Progression */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-white">Pareto Revenue Concentration Curve (80/20 Rule)</h3>
            <p className="text-xs text-slate-400">Cumulative percentage of total gross revenue accounted for by ranked catalog tiers</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
            814 SKUs generate 81.2% of £10.64M
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          {paretoMilestones.map((m, idx) => (
            <div 
              key={m.rank}
              className={`p-3 rounded-lg border ${
                m.rank === 814 
                  ? 'bg-cyan-950/30 border-cyan-500/50 ring-1 ring-cyan-500/30' 
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="text-[11px] text-slate-400">{m.desc}</div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {m.share}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full rounded-full ${m.rank === 814 ? 'bg-cyan-400' : 'bg-indigo-500'}`}
                  style={{ width: `${m.share}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Rank 1 to {m.rank}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
          <Info className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
          <span>
            <strong>Inventory Strategy Note:</strong> The remaining 3,256 items (bottom 80% of catalog) account for less than 19% of revenue. 
            Catalog rationalization should clear stagnant novelty inventory with low turn rates.
          </span>
        </div>
      </div>

      {/* Product Table with Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Product Catalog Velocity Explorer</h3>
            <p className="text-xs text-slate-400">Search and sort top revenue, volume, and order-frequency champions</p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search SKU or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition w-56"
              />
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setSortBy('revenue')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  sortBy === 'revenue' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setSortBy('quantity')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  sortBy === 'quantity' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Volume
              </button>
              <button
                onClick={() => setSortBy('orders')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  sortBy === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Orders
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-medium">Rank</th>
                <th className="py-2.5 px-3 font-medium">Stock Code</th>
                <th className="py-2.5 px-3 font-medium">Description</th>
                <th className="py-2.5 px-3 font-medium text-right">Units Sold</th>
                <th className="py-2.5 px-3 font-medium text-right">Orders</th>
                <th className="py-2.5 px-3 font-medium text-right">Revenue (£)</th>
                <th className="py-2.5 px-3 font-medium text-right">Revenue Share</th>
                <th className="py-2.5 px-3 font-medium text-right">Cum. Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredProducts.slice(0, 20).map((p) => (
                <tr key={p.stock_code} className="hover:bg-slate-800/50 transition">
                  <td className="py-2.5 px-3 text-slate-400">
                    #{p.rank}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[11px]">
                      {p.stock_code}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200 max-w-[280px] truncate">
                    {p.description}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {p.quantity.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {p.orders_count.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    £{p.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {p.revenue_share_pct}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-400 font-semibold">
                    {p.cumulative_share_pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">
            No products match the search filter.
          </div>
        )}
      </div>
    </div>
  );
};
