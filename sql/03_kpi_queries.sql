-- ============================================================================
-- InsightX: 03_kpi_queries.sql
-- ============================================================================
-- Business Context:
-- Computes executive business KPIs including gross and net sales, orders, units,
-- average order value (AOV), and longitudinal monthly revenue progression.
-- ============================================================================

-- Query 1: Executive KPI Overview (Completed Orders)
-- Business Purpose: Single-row executive summary of revenue, volume, and customer base
SELECT 
    ROUND(SUM(line_total), 2) AS total_gross_revenue,
    COUNT(DISTINCT invoice_no) AS total_completed_orders,
    SUM(quantity) AS total_units_sold,
    COUNT(DISTINCT CASE WHEN customer_id <> 'GUEST' THEN customer_id END) AS unique_identified_customers,
    ROUND(SUM(line_total) / COUNT(DISTINCT invoice_no), 2) AS average_order_value,
    ROUND(SUM(quantity) * 1.0 / COUNT(DISTINCT invoice_no), 2) AS average_units_per_order
FROM fact_sales
WHERE status = 'COMPLETED';

-- Query 2: Net Revenue Reconciliation (Gross Sales vs Cancellation Refunds)
-- Business Purpose: Accurately reports financial net sales by netting out returns
SELECT 
    ROUND(SUM(CASE WHEN status = 'COMPLETED' THEN line_total ELSE 0 END), 2) AS gross_sales,
    ROUND(SUM(CASE WHEN status = 'CANCELLED' THEN ABS(line_total) ELSE 0 END), 2) AS refunds_cancellations,
    ROUND(
        SUM(CASE WHEN status = 'COMPLETED' THEN line_total ELSE 0 END) - 
        SUM(CASE WHEN status = 'CANCELLED' THEN ABS(line_total) ELSE 0 END), 2
    ) AS net_revenue,
    ROUND(
        (SUM(CASE WHEN status = 'CANCELLED' THEN ABS(line_total) ELSE 0 END) / 
         NULLIF(SUM(CASE WHEN status = 'COMPLETED' THEN line_total ELSE 0 END), 0)) * 100, 2
    ) AS return_rate_pct
FROM fact_sales;

-- Query 3: Monthly Revenue, Order Volume, and Active Customer Progression
-- Business Purpose: Tracks monthly business expansion across the 12-month timeline
SELECT 
    d.year,
    d.month,
    d.month_name,
    COUNT(DISTINCT f.invoice_no) AS monthly_orders,
    SUM(f.quantity) AS units_sold,
    COUNT(DISTINCT CASE WHEN f.customer_id <> 'GUEST' THEN f.customer_id END) AS active_customers,
    ROUND(SUM(f.line_total), 2) AS gross_revenue,
    ROUND(SUM(f.line_total) / COUNT(DISTINCT f.invoice_no), 2) AS monthly_aov
FROM fact_sales f
JOIN dim_date d ON f.date_key = d.date_key
WHERE f.status = 'COMPLETED'
GROUP BY d.year, d.month, d.month_name
ORDER BY d.year, d.month;

-- Query 4: Month-over-Month (MoM) Revenue Growth Rate using LAG()
-- Business Purpose: Measures momentum and seasonal spikes (e.g. Q4 holiday rush)
WITH monthly_sales AS (
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
    ) AS mom_revenue_growth_pct
FROM monthly_sales
ORDER BY year, month;
