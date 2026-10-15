"""InsightX Automated Tests: Customer Segmentation (RFM)
Tests Recency, Frequency, Monetary calculations, score ranges (1-5), and segment labels.
"""
import unittest
import csv
import json

from src.config import RFM_CSV_PATH, PROCESSED_DATA_DIR


class TestRFMAnalysis(unittest.TestCase):
    """Verifies RFM scoring integrity and segment allocations."""

    def setUp(self):
        self.assertTrue(RFM_CSV_PATH.exists(), f"RFM CSV not found at {RFM_CSV_PATH}")

    def test_score_ranges(self):
        """R, F, M scores must be integers between 1 and 5 inclusive."""
        with open(RFM_CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            checked = 0
            for row in reader:
                r = int(row['r_score'])
                f_s = int(row['f_score'])
                m = int(row['m_score'])
                self.assertIn(r, [1, 2, 3, 4, 5])
                self.assertIn(f_s, [1, 2, 3, 4, 5])
                self.assertIn(m, [1, 2, 3, 4, 5])
                self.assertGreater(int(row['recency']), 0)
                self.assertGreaterEqual(int(row['frequency']), 0)
                checked += 1
            self.assertGreater(checked, 4000)

    def test_segment_labels_valid(self):
        """Assigned segments must belong to documented segment dictionary."""
        valid_segments = {
            "Champions", "Loyal Customers", "Potential Loyalists",
            "Promising", "Need Attention", "About to Sleep",
            "At Risk", "Cannot Lose Them", "Hibernating",
            "Customers Needing Attention"
        }
        with open(RFM_CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.assertIn(row['segment'], valid_segments)


if __name__ == '__main__':
    unittest.main()
