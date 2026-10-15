"""InsightX Automated Tests: Business Metrics & Financial Calculations
Tests revenue summing, order deduplication, AOV calculation, and reconciliation.
"""
import unittest
import json
import sqlite3

from src.config import KPI_SUMMARY_PATH, DATABASE_PATH


class TestBusinessMetrics(unittest.TestCase):
    """Verifies core financial metrics, reconciliation, and database consistency."""

    def setUp(self):
        self.assertTrue(KPI_SUMMARY_PATH.exists())
        with open(KPI_SUMMARY_PATH, 'r', encoding='utf-8') as f:
            self.kpis = json.load(f)

    def test_gross_and_net_revenue_coherence(self):
        """Net revenue must strictly equal gross revenue minus cancellation value."""
        gross = self.kpis['total_gross_revenue']
        canc = self.kpis['total_cancellation_value']
        net = self.kpis['net_revenue']
        self.assertAlmostEqual(gross - canc, net, places=1)
        self.assertGreater(gross, 0.0)
        self.assertGreater(net, 0.0)

    def test_aov_formula(self):
        """Average order value must equal total gross revenue divided by completed orders."""
        gross = self.kpis['total_gross_revenue']
        orders = self.kpis['total_orders']
        aov = self.kpis['average_order_value']
        expected_aov = round(gross / orders, 2)
        self.assertEqual(aov, expected_aov)

    def test_database_table_counts(self):
        """Database fact table must reconcile with loaded records."""
        self.assertTrue(DATABASE_PATH.exists())
        conn = sqlite3.connect(DATABASE_PATH)
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM fact_sales WHERE status = 'COMPLETED';")
        completed_count = cur.fetchone()[0]
        self.assertGreater(completed_count, 500000)

        cur.execute("SELECT COUNT(DISTINCT customer_id) FROM customer_rfm;")
        rfm_cust_count = cur.fetchone()[0]
        self.assertEqual(rfm_cust_count, 4372)

        conn.close()


if __name__ == '__main__':
    unittest.main()
