-- ============================================================================
-- InsightX: Relational Star Schema DDL (PostgreSQL & Relational SQL standard)
-- ============================================================================
-- Business Context:
-- Models transactional e-commerce data from UCI Online Retail dataset.
-- Designed as a Star Schema optimized for high-performance OLAP analytics,
-- Power BI DirectQuery/Import, and business reporting.
-- ============================================================================

DROP TABLE IF EXISTS fact_sales CASCADE;
DROP TABLE IF EXISTS customer_rfm CASCADE;
DROP TABLE IF EXISTS dim_product CASCADE;
DROP TABLE IF EXISTS dim_customer CASCADE;
DROP TABLE IF EXISTS dim_country CASCADE;
DROP TABLE IF EXISTS dim_date CASCADE;

-- 1. Date Dimension Table
CREATE TABLE dim_date (
    date_key VARCHAR(8) PRIMARY KEY,      -- Format YYYYMMDD
    full_date DATE NOT NULL,
    year INT NOT NULL,
    quarter INT NOT NULL,
    month INT NOT NULL,
    month_name VARCHAR(15) NOT NULL,
    day INT NOT NULL,
    day_of_week INT NOT NULL,
    day_name VARCHAR(15) NOT NULL,
    is_weekend SMALLINT NOT NULL
);

-- 2. Country Dimension Table
CREATE TABLE dim_country (
    country VARCHAR(100) PRIMARY KEY,
    total_orders INT NOT NULL DEFAULT 0,
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    unique_customers INT NOT NULL DEFAULT 0,
    total_units INT NOT NULL DEFAULT 0
);

-- 3. Product Dimension Table
CREATE TABLE dim_product (
    stock_code VARCHAR(30) PRIMARY KEY,
    description TEXT,
    first_sold_date DATE,
    last_sold_date DATE,
    avg_unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_units_sold INT NOT NULL DEFAULT 0,
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0.00
);

-- 4. Customer Dimension Table
-- Note: Captures registered/identified customers. Unregistered checkout is modeled as 'GUEST'.
CREATE TABLE dim_customer (
    customer_id VARCHAR(30) PRIMARY KEY,
    country VARCHAR(100) REFERENCES dim_country(country),
    first_order_date DATE,
    last_order_date DATE,
    total_orders INT NOT NULL DEFAULT 0,
    cancelled_orders INT NOT NULL DEFAULT 0,
    total_spend NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_units INT NOT NULL DEFAULT 0
);

-- 5. Fact Sales Table (Grain: Individual Transaction Line Item)
-- Surrogate key 'transaction_id' is generated to uniquely identify lines since source
-- data has no composite primary key guaranteeing uniqueness.
CREATE TABLE fact_sales (
    transaction_id BIGINT PRIMARY KEY,
    invoice_no VARCHAR(30) NOT NULL,
    stock_code VARCHAR(30) NOT NULL,
    customer_id VARCHAR(30),
    date_key VARCHAR(8) NOT NULL,
    country VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(10, 4) NOT NULL,
    line_total NUMERIC(14, 4) NOT NULL,
    status VARCHAR(20) NOT NULL,            -- 'COMPLETED', 'CANCELLED', 'ADJUSTMENT'
    is_cancellation SMALLINT NOT NULL DEFAULT 0
);

-- 6. RFM Segmentation Snapshot Table
CREATE TABLE customer_rfm (
    customer_id VARCHAR(30) PRIMARY KEY,
    country VARCHAR(100),
    last_order_date DATE NOT NULL,
    recency INT NOT NULL,                   -- Days since reference date (2011-12-10)
    frequency INT NOT NULL,                 -- Distinct completed orders count
    monetary NUMERIC(14, 2) NOT NULL,       -- Total qualifying net spend
    r_score INT NOT NULL,                   -- 1 to 5 (5 is most recent)
    f_score INT NOT NULL,                   -- 1 to 5 (5 is most frequent)
    m_score INT NOT NULL,                   -- 1 to 5 (5 is highest spend)
    rfm_score VARCHAR(3) NOT NULL,          -- Concatenation e.g. '555'
    segment VARCHAR(50) NOT NULL            -- Behavioral segment name
);

-- Performance Indexes for OLAP Aggregations
CREATE INDEX idx_fact_sales_invoice ON fact_sales(invoice_no);
CREATE INDEX idx_fact_sales_customer ON fact_sales(customer_id);
CREATE INDEX idx_fact_sales_stock ON fact_sales(stock_code);
CREATE INDEX idx_fact_sales_date ON fact_sales(date_key);
CREATE INDEX idx_fact_sales_status ON fact_sales(status);
CREATE INDEX idx_customer_rfm_segment ON customer_rfm(segment);
