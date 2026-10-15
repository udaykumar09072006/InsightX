import React from 'react';
import { ChartSpecification } from '../../types/copilot';

interface AnalyticsChartProps {
  chart: ChartSpecification;
  columns: string[];
  rows: any[];
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ chart, columns, rows }) => {
  if (!rows || rows.length === 0) return null;

  const { type, x = columns[0], y = columns[1], series, title } = chart;

  // 1. KPI Card View
  if (type === 'kpi') {
    const firstRow = rows[0] || {};
    const primaryKey = y || columns[0];
    const secondaryKey = columns[1];
    return (
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 my-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">{title || 'Key Performance Indicator'}</div>
          <div className="text-3xl font-extrabold font-mono text-white mt-1">
            {typeof firstRow[primaryKey] === 'number' 
              ? firstRow[primaryKey].toLocaleString('en-GB') 
              : firstRow[primaryKey]}
          </div>
          {secondaryKey && (
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Benchmark Total: {typeof firstRow[secondaryKey] === 'number' ? `£${firstRow[secondaryKey].toLocaleString('en-GB')}` : firstRow[secondaryKey]}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Line Chart (e.g. Monthly Trends, AOV Over Time)
  if (type === 'line') {
    const xKey = x || columns[0];
    const yKey = y || columns[1];

    const yValues = rows.map(r => Number(r[yKey]) || 0);
    const maxY = Math.max(...yValues, 1);
    const minY = Math.min(...yValues, 0);
    const rangeY = maxY - minY || 1;

    const width = 600;
    const height = 180;
    const padding = 35;

    const points = rows.map((r, i) => {
      const cx = padding + (i / Math.max(rows.length - 1, 1)) * (width - 2 * padding);
      const val = Number(r[yKey]) || 0;
      const cy = height - padding - ((val - minY) / rangeY) * (height - 2 * padding);
      return { x: cx, y: cy, label: r[xKey], value: val };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 my-3">
        <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
          <span>{title || `${yKey} across ${xKey}`}</span>
          <span className="text-[11px] font-mono text-cyan-400">Peak: £{maxY.toLocaleString('en-GB')}</span>
        </div>
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 min-w-[480px]">
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
            
            {/* Area & Line */}
            {areaD && <path d={areaD} fill="url(#lineGrad)" />}
            {pathD && <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />}
            
            {/* Data Points */}
            {points.map((p, i) => (
              <g key={i} className="group">
                <circle cx={p.x} cy={p.y} r="3.5" fill="#0891b2" stroke="#e0f2fe" strokeWidth="1.5" className="transition group-hover:r-5 cursor-pointer" />
                <text x={p.x} y={height - 12} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                  {p.label && p.label.length > 5 ? p.label.slice(5) : p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  }

  // 3. Horizontal Bar Chart (e.g. Top Countries, Top Products)
  if (type === 'horizontal_bar') {
    const labelKey = x || columns[0];
    const valueKey = y || columns[1];
    const displayRows = rows.slice(0, 8);
    const maxVal = Math.max(...displayRows.map(r => Number(r[valueKey]) || 0), 1);

    return (
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 my-3">
        <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
          <span>{title || `Rankings by ${valueKey}`}</span>
          <span className="text-[11px] font-mono text-slate-500">Top {displayRows.length} Items</span>
        </div>
        <div className="space-y-2.5">
          {displayRows.map((r, i) => {
            const val = Number(r[valueKey]) || 0;
            const pct = Math.round((val / maxVal) * 100);
            return (
              <div key={i} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium truncate max-w-[280px]">
                    <strong className="text-slate-500 mr-1.5 font-mono">#{i + 1}</strong>
                    {r[labelKey]}
                  </span>
                  <span className="font-mono text-cyan-300 font-semibold shrink-0 ml-2">
                    {val >= 1000 ? `£${val.toLocaleString('en-GB')}` : val.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Vertical Bar Chart (e.g. Month over Month, Cohort repeat rate)
  const xKey = x || columns[0];
  const yKey = y || columns[1];
  const displayRows = rows.slice(0, 12);
  const maxVal = Math.max(...displayRows.map(r => Math.abs(Number(r[yKey]) || 0)), 1);

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 my-3">
      <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
        <span>{title || `${yKey} by ${xKey}`}</span>
      </div>
      <div className="h-40 flex items-end gap-2 pt-4 pb-2 border-b border-slate-800">
        {displayRows.map((r, i) => {
          const val = Number(r[yKey]) || 0;
          const heightPct = Math.round((Math.abs(val) / maxVal) * 100);
          const isNegative = val < 0;

          return (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              <div 
                style={{ height: `${Math.max(heightPct, 6)}%` }}
                className={`w-full max-w-[32px] rounded-t transition-all group-hover:brightness-125 ${
                  isNegative ? 'bg-rose-500/80' : 'bg-gradient-to-t from-indigo-600 to-cyan-400'
                }`}
              ></div>
              <span className="text-[10px] font-mono text-slate-400 mt-2 truncate w-full text-center">
                {String(r[xKey]).length > 7 ? String(r[xKey]).slice(2) : String(r[xKey])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
