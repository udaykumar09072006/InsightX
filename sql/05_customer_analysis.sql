-- ============================================================================
-- InsightX: 05_customer_analysis.sql
-- ============================================================================
-- Business Context:
-- Customer-centric queries evaluating customer lifetime value, order frequency,
-- repeat purchasing rates, and RFM behavioral segments.
-- ============================================================================

-- Query 1: Top 10 Customers by Revenue (Completed Orders)
-- Business Purpose: Key account management and VIP customer identification
SELECT 
    c.customer_id,
    c.country,
    c.total_orders,
    c.total_units,
    c.total_spend,
    ROUND(c.total_spend / NULLIF(c.total_orders, 0), 2) AS customer_aov,
    r.segment,
    r.rfm_score
FROM dim_customer c
LEFT JOIN customer_rfm r ON c.customer_id = r.customer_id
ORDER BY c.total_spend DESC
LIMIT 10;

-- Query 2: Single-Purchase vs Repeat-Purchase Customer Ratio
-- Business Purpose: Benchmarks customer retention vs churn at first order
WITH customer_order_tally AS (
    SELECT 
        customer_id,
        COUNT(DISTINCT invoice_no) AS order_count
    FROM fact_sales
    WHERE status = 'COMPLETED' AND customer_id <> 'GUEST'
    GROUP BY customer_id
)
SELECT 
    CASE 
        WHEN order_count = 1 THEN '1. One-Time Buyer'
        WHEN order_count BETWEEN 2 AND 4 THEN '2. Repeat Buyer (2-4 orders)'
        WHEN order_count BETWEEN 5 AND 9 THEN '3. Frequent Buyer (5-9 orders)'
        ELSE '4. Power Buyer (10+ orders)'
    END AS customer_tier,
    COUNT(*) AS customer_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customer_order_tally), 2) AS pct_of_customers
FROM customer_order_tally
GROUP BY 1
ORDER BY 1;

-- Query 3: RFM Behavioral Segment Distribution and Financial Value
-- Business Purpose: Direct marketing segmentation for lifecycle campaigns
SELECT 
    segment,
    COUNT(*) AS total_customers,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customer_rfm), 2) AS customer_share_pct,
    ROUND(SUM(monetary), 2) AS total_segment_revenue,
    ROUND(SUM(monetary) * 100.0 / (SELECT SUM(monetary) FROM customer_rfm), 2) AS revenue_share_pct,
    ROUND(AVG(recency), 1) AS avg_recency_days,
    ROUND(AVG(frequency), 1) AS avg_orders_count,
    ROUND(AVG(monetary), 2) AS avg_customer_spend
FROM customer_rfm
GROUP BY segment
ORDER BY total_segment_revenue DESC;

-- Query 4: Customer Revenue Pareto Concentration (Top Decile Contribution)
-- Business Purpose: Quantify customer portfolio concentration risk
WITH ranked_cust AS (
    SELECT 
        customer_id,
        monetary,
        NTILE(10) OVER (ORDER BY monetary DESC) AS decile
    FROM customer_rfm
)
SELECT 
    decile,
    COUNT(*) AS customer_count,
    ROUND(SUM(monetary), 2) AS decile_revenue,
    ROUND(SUM(monetary) * 100.0 / (SELECT SUM(monetary) FROM customer_rfm), 2) AS pct_of_total_revenue
FROM ranked_cust
GROUP BY decile
ORDER BY decile ASC;
