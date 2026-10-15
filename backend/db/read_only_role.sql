-- ============================================================================
-- InsightX: Dedicated Read-Only Role for PostgreSQL
-- ============================================================================
-- Secures database access by granting read-only SELECT permissions strictly
-- on approved analytics tables, while revoking mutation and schema alteration rights.
-- ============================================================================

-- 1. Create read-only role if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'insightx_readonly') THEN
      CREATE ROLE insightx_readonly WITH LOGIN PASSWORD 'insightx_readonly_secure_password';
   END IF;
END
$do$;

-- 2. Revoke default public permissions
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM insightx_readonly;

-- 3. Grant schema usage only
GRANT USAGE ON SCHEMA public TO insightx_readonly;

-- 4. Grant SELECT exclusively on approved tables
GRANT SELECT ON TABLE fact_sales TO insightx_readonly;
GRANT SELECT ON TABLE dim_date TO insightx_readonly;
GRANT SELECT ON TABLE dim_customer TO insightx_readonly;
GRANT SELECT ON TABLE dim_product TO insightx_readonly;
GRANT SELECT ON TABLE dim_country TO insightx_readonly;
GRANT SELECT ON TABLE customer_rfm TO insightx_readonly;

-- 5. Enforce statement timeouts (max 10 seconds per query)
ALTER ROLE insightx_readonly SET statement_timeout = '10000';
