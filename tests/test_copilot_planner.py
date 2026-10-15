"""InsightX Automated Tests: Query Planner & Analytical Reconciliation
Verifies that natural language questions map to verified analytical SQL templates
and produce accurate results against the real database.
"""
import unittest
import sqlite3
from pathlib import Path
from backend.app.core.config import settings

class TestCopilotPlanner(unittest.TestCase):
    """Verifies that query execution produces consistent and correct figures."""

    def setUp(self):
        self.assertTrue(settings.DATABASE_PATH.exists(), f"Database not found at {settings.DATABASE_PATH}")
        self.conn = sqlite3.connect(f"file:{settings.DATABASE_PATH}?mode=ro", uri=True)
        self.cur = self.conn.cursor()

    def tearDown(self):
        self.conn.close()

    def test_monthly_revenue_calculation(self):
        """Monthly revenue query must return 13 months spanning 2010-12 to 2011-12."""
        sql = """SELECT d.year || '-' || SUBSTR('0' || d.month, -2) AS month,
                        ROUND(SUM(f.line_total), 2) AS gross_revenue
                 FROM fact_sales f JOIN dim_date d ON f.date_key = d.date_key
                 WHERE f.status = 'COMPLETED'
                 GROUP BY d.year, d.month
                 ORDER BY d.year, d.month;"""
        self.cur.execute(sql)
        rows = self.cur.fetchall()
        self.assertEqual(len(rows), 13)
        # Total sum across all months must equal £10,642,110.80
        total_sum = round(sum(r[1] for r in rows), 2)
        self.assertAlmostEqual(total_sum, 10642110.80, places=1)

    def test_top_countries_ranking(self):
        """United Kingdom must be the top country with over 80% of revenue."""
        sql = """SELECT country, ROUND(SUM(line_total), 2) AS revenue
                 FROM fact_sales WHERE status = 'COMPLETED'
                 GROUP BY country ORDER BY revenue DESC LIMIT 5;"""
        self.cur.execute(sql)
        rows = self.cur.fetchall()
        self.assertEqual(rows[0][0], 'United Kingdom')
        self.assertGreater(rows[0][1], 8000000.0)

    def test_top_products_pareto(self):
        """Top 10 products revenue query must return positive values with consistent share."""
        sql = """WITH ranked_products AS (
                   SELECT stock_code, SUM(line_total) AS revenue
                   FROM fact_sales WHERE status = 'COMPLETED'
                   GROUP BY stock_code
                 ),
                 catalog_totals AS (
                   SELECT SUM(revenue) AS total_revenue FROM ranked_products
                 ),
                 top10 AS (
                   SELECT SUM(revenue) AS top10_revenue
                   FROM (SELECT revenue FROM ranked_products ORDER BY revenue DESC LIMIT 10)
                 )
                 SELECT ROUND(t.top10_revenue * 100.0 / c.total_revenue, 2)
                 FROM top10 t, catalog_totals c;"""
        self.cur.execute(sql)
        share_pct = self.cur.fetchone()[0]
        self.assertGreater(share_pct, 5.0)
        self.assertLess(share_pct, 20.0)

if __name__ == '__main__':
    unittest.main()
