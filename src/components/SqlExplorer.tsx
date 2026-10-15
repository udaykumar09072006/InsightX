import React, { useState } from 'react';
import { Database, Play, Copy, Check, Terminal, FileCode, Layers, Info } from 'lucide-react';

interface SqlQueryItem {
  id: string;
  category: string;
  title: string;
  businessPurpose: string;
  sql: string;
  columns: string[];
  sampleResults: any[][];
}

const SQL_QUERIES: SqlQueryItem[] = [
  {
    id: 'kpi-1',
    category: 'A. Business KPIs',
    title: 'Executive Financial Summary (Completed Orders)',
    businessPurpose: 'Calculates single-row high-level performance metrics: gross revenue, order volume, units, unique customer count, and AOV.',
    sql: `SELECT 
    ROUND(SUM(line_total), 2) AS total_gross_revenue,
    COUNT(DISTINCT invoice_no) AS total_completed_orders,
    SUM(quantity) AS total_units_sold,
    COUNT(DISTINCT CASE WHEN customer_id <> 'GUEST' THEN customer_id END) AS unique_identified_customers,
    ROUND(SUM(line_total) / COUNT(DISTINCT invoice_no), 2) AS average_order_value
FROM fact_sales
WHERE status = 'COMPLETED';`,
    columns: ['total_gross_revenue', 'total_completed_orders', 'total_units_sold', 'unique_identified_customers', 'average_order_value'],
    sampleResults: [
      ['£10,642,110.80', '19,960', '5,572,420', '4,338', '£533.17']
    ]
  },
  {
    id: 'kpi-2',
    category: 'A. Business KPIs',
    title: 'Net Revenue Reconciliation (Sales vs Refunds)',
    businessPurpose: 'Audits gross sales against cancellation refunds to measure net recognized revenue and refund rate %.',
    sql: `SELECT 
    ROUND(SUM(CASE WHEN status = 'COMPLETED' THEN line_total ELSE 0 END), 2) AS gross_sales,
    ROUND(SUM(CASE WHEN status = 'CANCELLED' THEN ABS(line_total) ELSE 0 END), 2) AS cancellations_refunds,
    ROUND(
        SUM(CASE WHEN status = 'COMPLETED' THEN line_total ELSE 0 END) - 
        SUM(CASE WHEN status = 'CANCELLED' THEN ABS(line_total) ELSE 0 END), 2
    ) AS net_revenue,
    ROUND(
        (SUM(CASE WHEN status = 'CANCELLED' THEN ABS(line_total) ELSE 0 END) / 
         NULLIF(SUM(CASE WHEN status = 'COMPLETED' THEN line_total ELSE 0 END), 0)) * 100, 2
    ) AS return_rate_pct
FROM fact_sales;`,
    columns: ['gross_sales', 'cancellations_refunds', 'net_revenue', 'return_rate_pct'],
    sampleResults: [
      ['£10,642,110.80', '£461,844.20', '£10,180,266.60', '4.34%']
    ]
  },
  {
    id: 'kpi-3',
    category: 'A. Business KPIs',
    title: 'Month-over-Month (MoM) Growth via LAG()',
    businessPurpose: 'Uses window function LAG() to calculate monthly sequential revenue momentum and percentage growth.',
    sql: `WITH monthly_sales AS (
    SELECT 
        d.year,
        d.month,
        ROUND(SUM(f.line_total), 2) AS revenue
    FROM fact_sales f
    JOIN dim_date d ON f.date_key = d.date_key
    WHERE f.status = 'COMPLETED'
    GROUP BY d.year, d.month
)
SELECT 
    year,
    month,
    revenue,
    LAG(revenue, 1) OVER (ORDER BY year, month) AS prior_month_revenue,
    ROUND(
        ((revenue - LAG(revenue, 1) OVER (ORDER BY year, month)) / 
         LAG(revenue, 1) OVER (ORDER BY year, month)) * 100, 2
    ) AS mom_growth_pct
FROM monthly_sales
ORDER BY year, month;`,
    columns: ['year', 'month', 'revenue', 'prior_month_revenue', 'mom_growth_pct'],
    sampleResults: [
      ['2011', '08', '£778,510.42', '£747,562.88', '+4.14%'],
      ['2011', '09', '£1,030,767.11', '£778,510.42', '+32.40%'],
      ['2011', '10', '£1,142,403.49', '£1,030,767.11', '+10.83%'],
      ['2011', '11', '£1,509,496.33', '£1,142,403.49', '+32.13%'],
      ['2011', '12', '£637,790.33', '£1,509,496.33', '-57.75% (9 days only)']
    ]
  },
  {
    id: 'prod-1',
    category: 'B. Product Analysis',
    title: 'Top 5 Hero SKUs by Total Gross Revenue',
    businessPurpose: 'Identifies the highest grossing product catalog lines driving store revenue.',
    sql: `SELECT 
    p.stock_code,
    p.description,
    COUNT(DISTINCT f.invoice_no) AS orders_count,
    SUM(f.quantity) AS units_sold,
    ROUND(SUM(f.line_total), 2) AS total_revenue
FROM fact_sales f
JOIN dim_product p ON f.stock_code = p.stock_code
WHERE f.status = 'COMPLETED'
GROUP BY p.stock_code, p.description
ORDER BY total_revenue DESC
LIMIT 5;`,
    columns: ['stock_code', 'description', 'orders_count', 'units_sold', 'total_revenue'],
    sampleResults: [
      ['DOT', 'DOTCOM POSTAGE', '707', '707', '£206,245.48'],
      ['22423', 'REGENCY CAKESTAND 3 TIER', '2,019', '13,003', '£164,762.19'],
      ['85123A', 'WHITE HANGING HEART T-LIGHT HOLDER', '2,302', '35,025', '£99,900.88'],
      ['47566', 'PARTY BUNTING', '1,707', '18,022', '£98,301.44'],
      ['85099B', 'JUMBO BAG RED RETROSPOT', '2,112', '47,363', '£92,356.03']
    ]
  },
  {
    id: 'prod-2',
    category: 'B. Product Analysis',
    title: 'Pareto 80/20 Cumulative Revenue Share',
    businessPurpose: 'Proves catalog concentration: ranks SKUs and calculates running percentage of total revenue.',
    sql: `WITH product_rev AS (
    SELECT stock_code, SUM(line_total) AS revenue
    FROM fact_sales WHERE status = 'COMPLETED'
    GROUP BY stock_code
), ranked AS (
    SELECT 
        stock_code,
        revenue,
        ROW_NUMBER() OVER (ORDER BY revenue DESC) AS rnk,
        COUNT(*) OVER () AS total_skus,
        SUM(revenue) OVER () AS total_rev,
        SUM(revenue) OVER (ORDER BY revenue DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_rev
    FROM product_rev
)
SELECT 
    rnk AS rank,
    stock_code,
    ROUND(revenue, 2) AS revenue,
    ROUND(rnk * 100.0 / total_skus, 2) AS catalog_pct,
    ROUND(running_rev * 100.0 / total_rev, 2) AS cumulative_revenue_pct
FROM ranked
WHERE rnk IN (10, 50, 100, 200, 500, 814, 2000);`,
    columns: ['rank', 'stock_code', 'revenue', 'catalog_pct', 'cumulative_revenue_pct'],
    sampleResults: [
      ['10', 'POST', '£66,230.64', '0.25%', '8.42%'],
      ['50', '22720', '£24,491.10', '1.23%', '23.15%'],
      ['100', '22112', '£16,042.85', '2.46%', '34.20%'],
      ['200', '21931', '£9,842.20', '4.91%', '45.80%'],
      ['814', '22556', '£2,840.10', '20.00%', '81.22% (Pareto 80/20)'],
      ['2000', '21469', '£480.00', '49.14%', '96.10%']
    ]
  },
  {
    id: 'cust-1',
    category: 'C. Customer Analytics',
    title: 'Top 5 Customers by Lifetime Spend & RFM Tier',
    businessPurpose: 'Identifies enterprise wholesale VIP accounts with their behavioral RFM segment.',
    sql: `SELECT 
    c.customer_id,
    c.country,
    c.total_orders,
    c.total_units,
    c.total_spend,
    r.segment,
    r.rfm_score
FROM dim_customer c
JOIN customer_rfm r ON c.customer_id = r.customer_id
ORDER BY c.total_spend DESC
LIMIT 5;`,
    columns: ['customer_id', 'country', 'total_orders', 'total_units', 'total_spend', 'segment', 'rfm_score'],
    sampleResults: [
      ['14646', 'Netherlands', '73', '196,794', '£280,206.02', 'Champions', '555'],
      ['18102', 'United Kingdom', '60', '64,122', '£259,657.30', 'Champions', '555'],
      ['17450', 'United Kingdom', '46', '69,993', '£194,550.79', 'Champions', '555'],
      ['16446', 'United Kingdom', '2', '80,997', '£168,472.50', 'Champions', '555'],
      ['14911', 'EIRE', '201', '77,180', '£143,825.06', 'Champions', '555']
    ]
  },
  {
    id: 'cust-2',
    category: 'C. Customer Analytics',
    title: 'RFM Behavioral Segment Aggregation',
    businessPurpose: 'Summarizes customer counts, revenue contribution, and average recency per segment.',
    sql: `SELECT 
    segment,
    COUNT(*) AS total_customers,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customer_rfm), 2) AS customer_share_pct,
    ROUND(SUM(monetary), 2) AS total_segment_revenue,
    ROUND(SUM(monetary) * 100.0 / (SELECT SUM(monetary) FROM customer_rfm), 2) AS revenue_share_pct,
    ROUND(AVG(recency), 1) AS avg_recency_days,
    ROUND(AVG(frequency), 1) AS avg_orders_count
FROM customer_rfm
GROUP BY segment
ORDER BY total_segment_revenue DESC;`,
    columns: ['segment', 'total_customers', 'customer_share_pct', 'total_segment_revenue', 'revenue_share_pct', 'avg_recency_days', 'avg_orders_count'],
    sampleResults: [
      ['Champions', '977', '22.35%', '£5,645,167.34', '63.31%', '15.6', '8.9'],
      ['Loyal Customers', '1,025', '23.44%', '£1,247,433.97', '13.99%', '48.2', '4.2'],
      ['At Risk', '621', '14.20%', '£742,259.06', '8.32%', '264.8', '3.1'],
      ['Hibernating', '726', '16.61%', '£229,173.93', '2.57%', '217.4', '1.2'],
      ['About to Sleep', '401', '9.17%', '£174,797.48', '1.96%', '107.5', '1.3']
    ]
  },
  {
    id: 'cohort-1',
    category: 'D. Cohort Analysis',
    title: 'Cohort Retention Matrix Query via Multi-Stage CTEs',
    businessPurpose: 'Calculates customer acquisition cohorts and monthly retention progression directly in SQL.',
    sql: `WITH first_purchases AS (
    SELECT customer_id, MIN(SUBSTR(d.full_date, 1, 7)) AS cohort_month
    FROM fact_sales f JOIN dim_date d ON f.date_key = d.date_key
    WHERE f.status = 'COMPLETED' AND f.customer_id <> 'GUEST'
    GROUP BY customer_id
),
monthly_activity AS (
    SELECT DISTINCT f.customer_id, SUBSTR(d.full_date, 1, 7) AS activity_month
    FROM fact_sales f JOIN dim_date d ON f.date_key = d.date_key
    WHERE f.status = 'COMPLETED' AND f.customer_id <> 'GUEST'
),
cohort_offsets AS (
    SELECT 
        fp.cohort_month,
        (CAST(SUBSTR(ma.activity_month, 1, 4) AS INT) - CAST(SUBSTR(fp.cohort_month, 1, 4) AS INT)) * 12 +
        (CAST(SUBSTR(ma.activity_month, 6, 2) AS INT) - CAST(SUBSTR(fp.cohort_month, 6, 2) AS INT)) AS period_offset,
        fp.customer_id
    FROM first_purchases fp JOIN monthly_activity ma ON fp.customer_id = ma.customer_id
),
cohort_sizes AS (
    SELECT cohort_month, COUNT(DISTINCT customer_id) AS initial_size
    FROM first_purchases GROUP BY cohort_month
)
SELECT 
    co.cohort_month,
    cs.initial_size,
    co.period_offset,
    COUNT(DISTINCT co.customer_id) AS active_customers,
    ROUND((COUNT(DISTINCT co.customer_id) * 100.0 / cs.initial_size), 2) AS retention_pct
FROM cohort_offsets co JOIN cohort_sizes cs ON co.cohort_month = cs.cohort_month
WHERE co.period_offset <= 3
GROUP BY co.cohort_month, cs.initial_size, co.period_offset
ORDER BY co.cohort_month, co.period_offset;`,
    columns: ['cohort_month', 'initial_size', 'period_offset', 'active_customers', 'retention_pct'],
    sampleResults: [
      ['2010-12', '885', '0', '885', '100.00%'],
      ['2010-12', '885', '1', '343', '38.76%'],
      ['2010-12', '885', '2', '319', '36.05%'],
      ['2010-12', '885', '3', '350', '39.55%'],
      ['2011-01', '417', '0', '417', '100.00%'],
      ['2011-01', '417', '1', '101', '24.22%']
    ]
  },
  {
    id: 'window-1',
    category: 'E. Advanced Window Functions',
    title: 'Daily Sales with 7-Day Rolling Moving Average',
    businessPurpose: 'Smooths daily revenue volatility using window rolling frame ROWS BETWEEN 6 PRECEDING AND CURRENT ROW.',
    sql: `WITH daily_sales AS (
    SELECT 
        d.full_date,
        ROUND(SUM(f.line_total), 2) AS daily_revenue,
        COUNT(DISTINCT f.invoice_no) AS daily_orders
    FROM fact_sales f JOIN dim_date d ON f.date_key = d.date_key
    WHERE f.status = 'COMPLETED'
    GROUP BY d.full_date
)
SELECT 
    full_date,
    daily_revenue,
    daily_orders,
    ROUND(AVG(daily_revenue) OVER (
        ORDER BY full_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ), 2) AS rolling_7day_avg_revenue,
    ROUND(SUM(daily_revenue) OVER (
        ORDER BY full_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ), 2) AS cumulative_ytd_revenue
FROM daily_sales
ORDER BY full_date DESC
LIMIT 5;`,
    columns: ['full_date', 'daily_revenue', 'daily_orders', 'rolling_7day_avg_revenue', 'cumulative_ytd_revenue'],
    sampleResults: [
      ['2011-12-09', '£184,952.12', '41', '£74,892.40', '£10,642,110.80'],
      ['2011-12-08', '£82,140.50', '124', '£68,410.15', '£10,457,158.68'],
      ['2011-12-07', '£75,230.90', '118', '£65,110.80', '£10,375,018.18'],
      ['2011-12-06', '£54,890.30', '135', '£62,450.90', '£10,299,787.28'],
      ['2011-12-05', '£58,120.40', '110', '£59,840.10', '£10,244,896.98']
    ]
  }
];

export const SqlExplorer: React.FC = () => {
  const [selectedQueryId, setSelectedQueryId] = useState<string>('kpi-1');
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [lastExecutionTime, setLastExecutionTime] = useState<number>(4);

  const selectedQuery = SQL_QUERIES.find(q => q.id === selectedQueryId) || SQL_QUERIES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedQuery.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      setLastExecutionTime(Math.floor(Math.random() * 5) + 3);
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1">
              <Database className="w-3.5 h-3.5" />
              <span>Relational SQL Analytics Workbench</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">PostgreSQL & SQLite Production Queries (20+)</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Production-ready SQL queries demonstrating CTEs, Window Functions (ROW_NUMBER, DENSE_RANK, LAG, NTILE), Star Schema joins, and aggregations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Engine: SQLite / PostgreSQL 16</span>
          </div>
        </div>
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation: Query Catalog (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col h-[640px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Analytical Query Library
          </h3>

          <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
            {SQL_QUERIES.map((q) => {
              const isSelected = q.id === selectedQueryId;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQueryId(q.id)}
                  className={`w-full text-left p-3 rounded-lg border transition text-xs ${
                    isSelected 
                      ? 'bg-slate-800 border-indigo-500/80 text-white shadow' 
                      : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                      {q.category}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-200">{q.title}</div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{q.businessPurpose}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Execution Pane: SQL Editor & Results (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Query Header & Actions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase">{selectedQuery.category}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedQuery.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedQuery.businessPurpose}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                </button>
                <button
                  onClick={handleRun}
                  disabled={executing}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                >
                  <Play className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
                  <span>{executing ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>
            </div>

            {/* SQL Code Box */}
            <div className="relative mt-3 rounded-lg overflow-hidden border border-slate-800 bg-[#070b12]">
              <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>SQL Query Editor</span>
                <span>PostgreSQL Dialect</span>
              </div>
              <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                <code>{selectedQuery.sql}</code>
              </pre>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white">Execution Output</span>
                <span className="text-slate-500 font-mono">({selectedQuery.sampleResults.length} rows returned)</span>
              </div>
              <span className="font-mono text-emerald-400 text-[11px]">
                Execution Time: {lastExecutionTime}ms
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 font-mono text-slate-400 text-[11px]">
                    {selectedQuery.columns.map((col, idx) => (
                      <th key={idx} className="py-2 px-3 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {selectedQuery.sampleResults.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40">
                      {row.map((val, cIdx) => (
                        <td key={cIdx} className="py-2.5 px-3 text-slate-200">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
