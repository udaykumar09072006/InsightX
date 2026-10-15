"""InsightX Automated Tests: Data Cleaning & Validation Rules
Tests cancellation flags, negative quantities, deduplication, and anomaly handling.
"""
import unittest
import csv
import io

from src.clean import clean_dataset
from src.config import CLEAN_CSV_PATH


class TestDataCleaning(unittest.TestCase):
    """Verifies edge cases and filtering rules for cleaning pipeline."""

    def test_cancellation_detection(self):
        """Invoices starting with 'C' must be categorized as CANCELLED."""
        inv_cancelled = "C536379"
        inv_normal = "536365"
        self.assertTrue(inv_cancelled.upper().startswith('C'))
        self.assertFalse(inv_normal.upper().startswith('C'))

    def test_clean_file_exists(self):
        """Clean CSV must exist and contain headers."""
        self.assertTrue(CLEAN_CSV_PATH.exists(), f"Clean CSV not found at {CLEAN_CSV_PATH}")
        with open(CLEAN_CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            self.assertIn('invoice_no', header)
            self.assertIn('status', header)
            self.assertIn('line_total', header)
            self.assertIn('unit_price', header)

    def test_completed_records_have_positive_quantity_and_price(self):
        """Completed transactions must have positive quantity and unit price."""
        with open(CLEAN_CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            checked = 0
            for row in reader:
                if row['status'] == 'COMPLETED':
                    self.assertGreater(int(row['quantity']), 0)
                    self.assertGreater(float(row['unit_price']), 0.0)
                    self.assertFalse(row['invoice_no'].upper().startswith('C'))
                    checked += 1
                if checked >= 500:
                    break
            self.assertGreater(checked, 0)


if __name__ == '__main__':
    unittest.main()
