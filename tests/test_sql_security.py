"""InsightX Automated Security Tests
Verifies that the SQL Safety Validator correctly admits legitimate read-only queries
and strictly rejects mutations, administrative commands, multi-statements, and injection attacks.
"""
import unittest
from backend.app.core.security import validate_and_sanitize_sql

class TestSqlSecurity(unittest.TestCase):
    """Rigorous security testing for AST / lexical SQL validator."""

    def test_valid_select_queries_accepted(self):
        """Standard analytical SELECT queries must be accepted and capped with LIMIT."""
        valid_queries = [
            "SELECT country, SUM(line_total) FROM fact_sales WHERE status = 'COMPLETED' GROUP BY country",
            "SELECT * FROM dim_customer WHERE total_orders >= 5",
            "WITH monthly AS (SELECT date_key, SUM(line_total) AS rev FROM fact_sales GROUP BY date_key) SELECT * FROM monthly",
            "SELECT p.description, p.stock_code FROM dim_product p JOIN fact_sales f ON p.stock_code = f.stock_code"
        ]
        for q in valid_queries:
            is_valid, sanitized, err, warnings = validate_and_sanitize_sql(q, max_rows=500)
            self.assertTrue(is_valid, f"Failed on valid query: {q}. Error: {err}")
            self.assertIn("LIMIT", sanitized)

    def test_mutation_keywords_rejected(self):
        """Mutations such as DROP, DELETE, UPDATE, INSERT, ALTER must be blocked immediately."""
        malicious_queries = [
            "DROP TABLE fact_sales",
            "DELETE FROM dim_customer WHERE customer_id = '12345'",
            "UPDATE fact_sales SET line_total = 0",
            "INSERT INTO dim_product (stock_code) VALUES ('HACK')",
            "TRUNCATE TABLE fact_sales",
            "ALTER TABLE fact_sales ADD COLUMN secret TEXT"
        ]
        for q in malicious_queries:
            is_valid, _, err, _ = validate_and_sanitize_sql(q)
            self.assertFalse(is_valid, f"Query should have been rejected: {q}")
            self.assertIn("Security Error", err)

    def test_multi_statement_injection_rejected(self):
        """Queries containing multiple statements separated by semicolons must be rejected."""
        injections = [
            "SELECT * FROM fact_sales; DROP TABLE dim_customer;",
            "SELECT 1; UPDATE dim_country SET total_revenue = 999999",
            "SELECT * FROM dim_date; SELECT * FROM customer_rfm;"
        ]
        for q in injections:
            is_valid, _, err, _ = validate_and_sanitize_sql(q)
            self.assertFalse(is_valid, f"Multi-statement should have been rejected: {q}")
            self.assertIn("Multiple SQL statements", err)

    def test_disallowed_tables_rejected(self):
        """Access to unapproved tables or system catalogs must be forbidden."""
        unapproved = [
            "SELECT * FROM sqlite_master",
            "SELECT * FROM users",
            "SELECT * FROM pg_catalog.pg_tables",
            "SELECT * FROM secret_passwords"
        ]
        for q in unapproved:
            is_valid, _, err, _ = validate_and_sanitize_sql(q)
            self.assertFalse(is_valid, f"Unapproved table should have been rejected: {q}")
            self.assertIn("not in approved analytics whitelist", err)

    def test_limit_enforcement(self):
        """Row limits exceeding threshold must be clamped to safe threshold."""
        query_huge_limit = "SELECT * FROM fact_sales LIMIT 50000"
        is_valid, sanitized, _, warnings = validate_and_sanitize_sql(query_huge_limit, max_rows=500)
        self.assertTrue(is_valid)
        self.assertIn("LIMIT 500", sanitized)
        self.assertNotIn("LIMIT 50000", sanitized)

if __name__ == '__main__':
    unittest.main()
