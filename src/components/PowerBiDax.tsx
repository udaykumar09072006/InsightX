import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Layers, Database, Code, BookOpen } from 'lucide-react';

interface DaxMeasureItem {
  name: string;
  category: string;
  description: string;
  dax: string;
}

const DAX_MEASURES: DaxMeasureItem[] = [
  {
    name: 'Gross Sales',
    category: 'Financial',
    description: 'Total revenue from valid completed transactions.',
    dax: `Gross Sales = 
CALCULATE(
    SUM(fact_sales[line_total]),
    fact_sales[status] = "COMPLETED"
)`
  },
  {
    name: 'Refunds & Cancellations',
    category: 'Financial',
    description: 'Total value of cancelled invoices and return credits.',
    dax: `Refunds & Cancellations = 
CALCULATE(
    ABS(SUM(fact_sales[line_total])),
    fact_sales[status] = "CANCELLED"
)`
  },
  {
    name: 'Net Revenue',
    category: 'Financial',
    description: 'Gross Sales minus Refunds and Cancellations.',
    dax: `Net Revenue = [Gross Sales] - [Refunds & Cancellations]`
  },
  {
    name: 'Total Orders',
    category: 'Volume',
    description: 'Distinct completed invoice count.',
    dax: `Total Orders = 
CALCULATE(
    DISTINCTCOUNT(fact_sales[invoice_no]),
    fact_sales[status] = "COMPLETED"
)`
  },
  {
    name: 'Average Order Value',
    category: 'KPI',
    description: 'Gross Sales divided by Total Orders.',
    dax: `Average Order Value = 
DIVIDE([Gross Sales], [Total Orders], 0)`
  },
  {
    name: 'Month-over-Month Growth %',
    category: 'Time Intelligence',
    description: 'Sequential percentage growth compared to previous calendar month.',
    dax: `MoM Sales Growth % = 
VAR PreviousMonthSales = 
    CALCULATE(
        [Gross Sales],
        PREVIOUSMONTH(dim_date[full_date])
    )
RETURN
    DIVIDE(
        [Gross Sales] - PreviousMonthSales,
        PreviousMonthSales,
        BLANK()
    )`
  },
  {
    name: 'Repeat Customer Rate %',
    category: 'Customer Intelligence',
    description: 'Percentage of identified customers with 2 or more lifetime orders.',
    dax: `Repeat Purchase Rate % = 
VAR RepeatCustCount = 
    CALCULATE(
        DISTINCTCOUNT(dim_customer[customer_id]),
        dim_customer[total_orders] >= 2
    )
VAR TotalCustCount = 
    CALCULATE(
        DISTINCTCOUNT(dim_customer[customer_id])
    )
RETURN
    DIVIDE(RepeatCustCount, TotalCustCount, 0)`
  }
];

export const PowerBiDax: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyDax = (dax: string, index: number) => {
    navigator.clipboard.writeText(dax);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 tracking-wider uppercase mb-1">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Enterprise Power BI Architecture</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Power BI Data Model & Production DAX Library</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Production Kimball star-schema relationships, cardinality guidelines, and audited DAX time intelligence formulas.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Power BI Desktop Import Ready</span>
          </div>
        </div>
      </div>

      {/* Star Schema Architecture Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-bold text-white mb-2">Relational Star Schema Model & Cardinality</h3>
        <p className="text-xs text-slate-400 mb-4">
          Clean separation between transaction line items (Fact) and master attributes (Dimensions) ensures high compression ratio in VertiPaq.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">From Table</th>
                <th className="py-2.5 px-3">From Column</th>
                <th className="py-2.5 px-3">To Table</th>
                <th className="py-2.5 px-3">To Column</th>
                <th className="py-2.5 px-3">Cardinality</th>
                <th className="py-2.5 px-3">Filter Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-semibold text-cyan-300">fact_sales</td>
                <td className="py-2.5 px-3">date_key</td>
                <td className="py-2.5 px-3 font-semibold text-indigo-300">dim_date</td>
                <td className="py-2.5 px-3">date_key</td>
                <td className="py-2.5 px-3 text-amber-300">Many to One (*:1)</td>
                <td className="py-2.5 px-3">Single (dim &rarr; fact)</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-semibold text-cyan-300">fact_sales</td>
                <td className="py-2.5 px-3">stock_code</td>
                <td className="py-2.5 px-3 font-semibold text-indigo-300">dim_product</td>
                <td className="py-2.5 px-3">stock_code</td>
                <td className="py-2.5 px-3 text-amber-300">Many to One (*:1)</td>
                <td className="py-2.5 px-3">Single (dim &rarr; fact)</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-semibold text-cyan-300">fact_sales</td>
                <td className="py-2.5 px-3">customer_id</td>
                <td className="py-2.5 px-3 font-semibold text-indigo-300">dim_customer</td>
                <td className="py-2.5 px-3">customer_id</td>
                <td className="py-2.5 px-3 text-amber-300">Many to One (*:1)</td>
                <td className="py-2.5 px-3">Single (dim &rarr; fact)</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-semibold text-cyan-300">fact_sales</td>
                <td className="py-2.5 px-3">country</td>
                <td className="py-2.5 px-3 font-semibold text-indigo-300">dim_country</td>
                <td className="py-2.5 px-3">country</td>
                <td className="py-2.5 px-3 text-amber-300">Many to One (*:1)</td>
                <td className="py-2.5 px-3">Single (dim &rarr; fact)</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-semibold text-indigo-300">dim_customer</td>
                <td className="py-2.5 px-3">customer_id</td>
                <td className="py-2.5 px-3 font-semibold text-emerald-300">customer_rfm</td>
                <td className="py-2.5 px-3">customer_id</td>
                <td className="py-2.5 px-3 text-emerald-300">One to One (1:1)</td>
                <td className="py-2.5 px-3">Both</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Production DAX Library */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-bold text-white mb-2">Production DAX Measures Library</h3>
        <p className="text-xs text-slate-400 mb-4">
          Ready-to-paste DAX formulas designed for dedicated <code className="text-cyan-300 font-mono">_Measures</code> calculation table.
        </p>

        <div className="space-y-3">
          {DAX_MEASURES.map((m, idx) => (
            <div key={m.name} className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs">{m.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300">
                      {m.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{m.description}</p>
                </div>

                <button
                  onClick={() => copyDax(m.dax, idx)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition shrink-0"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy DAX</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-2.5 rounded bg-[#070b12] text-xs font-mono text-cyan-300 overflow-x-auto border border-slate-850">
                <code>{m.dax}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
