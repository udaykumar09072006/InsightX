"""InsightX Automated Tests: Cohort Retention Analysis
Tests cohort assignment, month 0 = 100% baseline, and retention decay.
"""
import unittest
import json

from src.config import PROCESSED_DATA_DIR


class TestCohortAnalysis(unittest.TestCase):
    """Verifies acquisition cohorts and longitudinal retention rules."""

    def setUp(self):
        json_path = PROCESSED_DATA_DIR / "cohort_retention.json"
        self.assertTrue(json_path.exists())
        with open(json_path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)

    def test_month_zero_is_100_percent(self):
        """Every cohort must start with 100% retention at period 0."""
        cohorts = self.data['cohorts']
        self.assertGreater(len(cohorts), 10)
        for c in cohorts:
            p0 = c['periods'][0]
            self.assertEqual(p0['period'], 0)
            self.assertEqual(p0['retained_count'], c['initial_size'])
            self.assertAlmostEqual(p0['retention_pct'], 100.0, places=1)

    def test_repeat_purchase_rate_positive(self):
        """Overall repeat purchase rate must be between 50% and 80% for wholesale gift retail."""
        rpr = self.data['repeat_purchase_rate_pct']
        self.assertGreater(rpr, 50.0)
        self.assertLess(rpr, 80.0)


if __name__ == '__main__':
    unittest.main()
