-- ============================================================================
-- InsightX: 02_data_quality_checks.sql
-- ============================================================================
-- Purpose:
-- Validates relational table integrity, verifies null constraints, audits
-- cancellations, and checks reconciliation between fact and dimension tables.
-- ============================================================================

-- Query 1: Total records count across core tables
-- Purpose: Quick sanity check on volume loaded
SELECT 
    'fact_sales' AS table_name, COUNT(*) AS record_count FROM fact_sales
UNION ALL
SELECT 
    'dim_customer' AS table_name, COUNT(*) AS record_count FROM dim_customer
UNION ALL
SELECT 
    'dim_product' AS table_name, COUNT(*) AS record_count FROM dim_product
UNION ALL
SELECT 
    'dim_country' AS table_name, COUNT(*) AS record_count FROM dim_country
UNION ALL
SELECT 
    'dim_date' AS table_name, COUNT(*) AS record_count FROM dim_date;

-- Query 2: Check for orphan transactions without a matching date dimension
-- Business Purpose: Enforce referential integrity for temporal analytics
SELECT 
    f.date_key,
    COUNT(*) AS orphan_count
FROM fact_sales f
LEFT JOIN dim_date d ON f.date_key = d.date_key
WHERE d.date_key IS NULL
GROUP BY f.date_key;

-- Query 3: Audit missing customer identifiers in fact table
-- Business Purpose: Measure proportion of anonymous/guest guest transactions
SELECT 
    CASE 
        WHEN customer_id IS NULL OR customer_id = 'GUEST' THEN 'Guest Checkout'
        ELSE 'Registered Customer'
    END AS customer_type,
    COUNT(*) AS line_items_count,
    ROUND(SUM(CASE WHEN status = 'COMPLETED' THEN line_total ELSE 0 END), 2) AS gross_revenue,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM fact_sales), 2) AS line_item_share_pct
FROM fact_sales
GROUP BY 1;

-- Query 4: Cancellation and Return volume check
-- Business Purpose: Inspect proportion of cancellation invoices (starting with 'C')
SELECT 
    status,
    COUNT(DISTINCT invoice_no) AS distinct_invoices,
    COUNT(*) AS total_line_items,
    ROUND(SUM(line_total), 2) AS total_amount
FROM fact_sales
GROUP BY status;

-- Query 5: Detect potential negative prices or zero quantities in completed sales
-- Business Purpose: Verify that cleaning rules strictly purged invalid anomalies
SELECT 
    invoice_no,
    stock_code,
    quantity,
    unit_price,
    status
FROM fact_sales
WHERE status = 'COMPLETED' 
  AND (quantity <= 0 OR unit_price <= 0);
