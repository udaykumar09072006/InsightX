-- ============================================================================
-- InsightX: 06_cohort_analysis.sql
-- ============================================================================
-- Business Context:
-- Computes customer acquisition cohorts based on initial transaction month and
-- measures longitudinal retention activity across subsequent 12 months.
-- ============================================================================

-- Query 1: Cohort Identification & Monthly Retention Matrix
-- Business Purpose: Evaluates long-term product-market fit and customer retention decay
WITH customer_first_purchase AS (
    -- Step 1: Determine the acquisition cohort (first completed order month)
    SELECT 
        customer_id,
        MIN(SUBSTR(d.full_date, 1, 7)) AS cohort_month
    FROM fact_sales f
    JOIN dim_date d ON f.date_key = d.date_key
    WHERE f.status = 'COMPLETED' AND f.customer_id <> 'GUEST'
    GROUP BY customer_id
),
customer_monthly_activity AS (
    -- Step 2: Extract distinct active months for each customer
    SELECT DISTINCT
        f.customer_id,
        SUBSTR(d.full_date, 1, 7) AS activity_month
    FROM fact_sales f
    JOIN dim_date d ON f.date_key = d.date_key
    WHERE f.status = 'COMPLETED' AND f.customer_id <> 'GUEST'
),
cohort_periods AS (
    -- Step 3: Compute month offset between acquisition month and active month
    -- Formula: (year2 - year1) * 12 + (month2 - month1)
    SELECT 
        c.cohort_month,
        a.activity_month,
        c.customer_id,
        (CAST(SUBSTR(a.activity_month, 1, 4) AS INT) - CAST(SUBSTR(c.cohort_month, 1, 4) AS INT)) * 12 +
        (CAST(SUBSTR(a.activity_month, 6, 2) AS INT) - CAST(SUBSTR(c.cohort_month, 6, 2) AS INT)) AS period_offset
    FROM customer_first_purchase c
    JOIN customer_monthly_activity a ON c.customer_id = a.customer_id
),
cohort_sizes AS (
    -- Step 4: Denominator (initial cohort size at Period 0)
    SELECT 
        cohort_month,
        COUNT(DISTINCT customer_id) AS initial_cohort_size
    FROM customer_first_purchase
    GROUP BY cohort_month
)
SELECT 
    cp.cohort_month,
    cs.initial_cohort_size,
    cp.period_offset,
    COUNT(DISTINCT cp.customer_id) AS active_customers,
    ROUND((COUNT(DISTINCT cp.customer_id) * 100.0 / cs.initial_cohort_size), 2) AS retention_rate_pct
FROM cohort_periods cp
JOIN cohort_sizes cs ON cp.cohort_month = cs.cohort_month
GROUP BY cp.cohort_month, cs.initial_cohort_size, cp.period_offset
ORDER BY cp.cohort_month, cp.period_offset;
