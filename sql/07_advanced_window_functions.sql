-- ============================================================================
-- InsightX: 07_advanced_window_functions.sql
-- ============================================================================
-- Business Context:
-- Advanced analytical SQL demonstrations employing Common Table Expressions (CTEs),
-- window functions (ROW_NUMBER, DENSE_RANK, NTILE, LAG, LEAD), cumulative running
-- totals, and rolling moving averages for executive time-series reporting.
-- ============================================================================

-- Query 1: Daily Revenue with 7-Day Moving Average and Cumulative Running Total
-- Business Purpose: Smooths daily sales fluctuations to reveal underlying trajectory
WITH daily_sales AS (
    SELECT 
        d.full_date,
        ROUND(SUM(f.line_total), 2) AS daily_revenue,
        COUNT(DISTINCT f.invoice_no) AS daily_orders
    FROM fact_sales f
    JOIN dim_date d ON f.date_key = d.date_key
    WHERE f.status = 'COMPLETED'
    GROUP BY d.full_date
)
SELECT 
    full_date,
    daily_revenue,
    daily_orders,
    -- 7-Day Rolling Moving Average
    ROUND(AVG(daily_revenue) OVER (
        ORDER BY full_date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ), 2) AS rolling_7day_avg_revenue,
    -- Cumulative Year-to-Date Running Total
    ROUND(SUM(daily_revenue) OVER (
        ORDER BY full_date 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ), 2) AS cumulative_ytd_revenue
FROM daily_sales
ORDER BY full_date;

-- Query 2: Product Performance Within Country Tiers (DENSE_RANK Partitioning)
-- Business Purpose: Finds top 3 selling products inside each major geographic market
WITH country_product_sales AS (
    SELECT 
        f.country,
        f.stock_code,
        p.description,
        ROUND(SUM(f.line_total), 2) AS revenue,
        DENSE_RANK() OVER (
            PARTITION BY f.country 
            ORDER BY SUM(f.line_total) DESC
        ) AS rank_in_country
    FROM fact_sales f
    JOIN dim_product p ON f.stock_code = p.stock_code
    WHERE f.status = 'COMPLETED' 
      AND f.country IN ('United Kingdom', 'Germany', 'France', 'EIRE', 'Netherlands')
    GROUP BY f.country, f.stock_code, p.description
)
SELECT 
    country,
    rank_in_country,
    stock_code,
    description,
    revenue
FROM country_product_sales
WHERE rank_in_country <= 3
ORDER BY country, rank_in_country;

-- Query 3: Customer Purchase Gap Analysis (LAG on Order Timestamps)
-- Business Purpose: Measures days between successive purchases for repeat customers
WITH customer_orders AS (
    SELECT DISTINCT
        f.customer_id,
        f.invoice_no,
        d.full_date,
        LAG(d.full_date, 1) OVER (
            PARTITION BY f.customer_id 
            ORDER BY d.full_date, f.invoice_no
        ) AS previous_order_date
    FROM fact_sales f
    JOIN dim_date d ON f.date_key = d.date_key
    WHERE f.status = 'COMPLETED' AND f.customer_id <> 'GUEST'
)
SELECT 
    customer_id,
    invoice_no,
    full_date AS current_order_date,
    previous_order_date,
    -- Calculate days elapsed between orders
    ROUND(JULIANDAY(full_date) - JULIANDAY(previous_order_date)) AS days_since_last_order
FROM customer_orders
WHERE previous_order_date IS NOT NULL
ORDER BY days_since_last_order ASC
LIMIT 20;

-- Query 4: Revenue Contribution and Share-of-Total by Country
-- Business Purpose: Computes exact percentage share of total revenue per country
WITH country_totals AS (
    SELECT 
        country,
        ROUND(SUM(line_total), 2) AS country_revenue,
        COUNT(DISTINCT invoice_no) AS country_orders
    FROM fact_sales
    WHERE status = 'COMPLETED'
    GROUP BY country
)
SELECT 
    country,
    country_revenue,
    country_orders,
    ROUND(country_revenue * 100.0 / SUM(country_revenue) OVER (), 2) AS pct_of_global_revenue,
    ROUND(country_orders * 100.0 / SUM(country_orders) OVER (), 2) AS pct_of_global_orders
FROM country_totals
ORDER BY country_revenue DESC
LIMIT 10;
