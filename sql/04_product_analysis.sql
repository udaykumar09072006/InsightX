-- ============================================================================
-- InsightX: 04_product_analysis.sql
-- ============================================================================
-- Business Context:
-- Deep-dive into product catalog performance, velocity, unit economics, and
-- Pareto revenue concentration to identify catalog champions and margin opportunities.
-- ============================================================================

-- Query 1: Top 15 Best-Performing Products by Revenue
-- Business Purpose: Identifies hero SKUs driving the business top-line
SELECT 
    p.stock_code,
    p.description,
    COUNT(DISTINCT f.invoice_no) AS orders_count,
    SUM(f.quantity) AS units_sold,
    ROUND(SUM(f.line_total), 2) AS total_revenue,
    ROUND(SUM(f.line_total) / NULLIF(SUM(f.quantity), 0), 2) AS realized_unit_price
FROM fact_sales f
JOIN dim_product p ON f.stock_code = p.stock_code
WHERE f.status = 'COMPLETED'
GROUP BY p.stock_code, p.description
ORDER BY total_revenue DESC
LIMIT 15;

-- Query 2: High-Volume, Low-Price SKUs (Volume Drivers vs Margin Anchors)
-- Business Purpose: Spot high-frequency items selling > 5,000 units with avg unit price < £2.00
SELECT 
    p.stock_code,
    p.description,
    SUM(f.quantity) AS total_units_sold,
    ROUND(SUM(f.line_total), 2) AS total_revenue,
    p.avg_unit_price
FROM fact_sales f
JOIN dim_product p ON f.stock_code = p.stock_code
WHERE f.status = 'COMPLETED'
GROUP BY p.stock_code, p.description, p.avg_unit_price
HAVING SUM(f.quantity) > 5000 AND p.avg_unit_price < 2.00
ORDER BY total_units_sold DESC;

-- Query 3: Pareto Analysis: Cumulative Product Revenue Concentration
-- Business Purpose: Proves 80/20 rule: what percentage of revenue is driven by what tier of SKUs
WITH product_revenue AS (
    SELECT 
        stock_code,
        ROUND(SUM(line_total), 2) AS revenue
    FROM fact_sales
    WHERE status = 'COMPLETED'
    GROUP BY stock_code
),
ranked_products AS (
    SELECT 
        stock_code,
        revenue,
        ROW_NUMBER() OVER (ORDER BY revenue DESC) AS product_rank,
        COUNT(*) OVER () AS total_products_count,
        SUM(revenue) OVER () AS total_catalog_revenue,
        SUM(revenue) OVER (ORDER BY revenue DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_revenue
    FROM product_revenue
)
SELECT 
    product_rank,
    stock_code,
    revenue,
    ROUND((product_rank * 100.0 / total_products_count), 2) AS catalog_percentile,
    ROUND((running_revenue * 100.0 / total_catalog_revenue), 2) AS cumulative_revenue_share_pct
FROM ranked_products
WHERE product_rank IN (10, 50, 100, 250, 500, 800, 1000, 2000)
ORDER BY product_rank;

-- Query 4: Products with Highest Cancellation / Return Frequency
-- Business Purpose: Highlights quality issues, defective batches, or sizing/misleading listings
SELECT 
    f.stock_code,
    p.description,
    COUNT(DISTINCT CASE WHEN f.status = 'CANCELLED' THEN f.invoice_no END) AS cancellation_orders,
    SUM(CASE WHEN f.status = 'CANCELLED' THEN ABS(f.quantity) ELSE 0 END) AS units_returned,
    ROUND(SUM(CASE WHEN f.status = 'CANCELLED' THEN ABS(f.line_total) ELSE 0 END), 2) AS refund_value
FROM fact_sales f
JOIN dim_product p ON f.stock_code = p.stock_code
GROUP BY f.stock_code, p.description
HAVING COUNT(DISTINCT CASE WHEN f.status = 'CANCELLED' THEN f.invoice_no END) > 20
ORDER BY refund_value DESC
LIMIT 10;
