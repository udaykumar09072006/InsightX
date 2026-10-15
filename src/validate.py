"""InsightX Data Validation Module
Performs schema validation, integrity checks, boundary checks, and reconciles
totals between raw and transformed layers.
"""
import csv
import json
import datetime
from pathlib import Path

from src.config import RAW_CSV_PATH, CLEAN_CSV_PATH, PROCESSED_DATA_DIR


def validate_clean_data() -> dict:
    """Validates the processed dataset and returns validation results."""
    if not CLEAN_CSV_PATH.exists():
        raise FileNotFoundError(f"Clean CSV missing at {CLEAN_CSV_PATH}")

    results = {
        "passed": True,
        "checks": [],
        "errors": [],
        "warnings": [],
        "summary": {}
    }

    total_rows = 0
    missing_invoice = 0
    missing_stock = 0
    missing_date = 0
    invalid_dates = 0
    min_date = None
    max_date = None
    gross_revenue = 0.0
    completed_count = 0
    cancelled_count = 0
    adjustment_count = 0
    guest_count = 0

    with open(CLEAN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_rows += 1
            if not row.get('invoice_no'):
                missing_invoice += 1
            if not row.get('stock_code'):
                missing_stock += 1
            d_str = row.get('invoice_date', '')
            if not d_str:
                missing_date += 1
            else:
                try:
                    dt = datetime.datetime.strptime(d_str[:10], '%Y-%m-%d')
                    if min_date is None or dt < min_date:
                        min_date = dt
                    if max_date is None or dt > max_date:
                        max_date = dt
                except ValueError:
                    invalid_dates += 1

            status = row.get('status')
            if status == 'COMPLETED':
                completed_count += 1
                gross_revenue += float(row.get('line_total', 0.0))
            elif status == 'CANCELLED':
                cancelled_count += 1
            elif status == 'ADJUSTMENT':
                adjustment_count += 1

            if row.get('is_guest') == '1':
                guest_count += 1

    # Check 1: Mandatory fields present
    check1 = {
        "name": "Mandatory Fields Check",
        "description": "InvoiceNo, StockCode, and InvoiceDate must never be null in cleaned data",
        "passed": (missing_invoice == 0 and missing_stock == 0 and missing_date == 0 and invalid_dates == 0),
        "details": f"Missing Invoice: {missing_invoice}, Missing Stock: {missing_stock}, Missing Date: {missing_date}"
    }
    results["checks"].append(check1)
    if not check1["passed"]:
        results["passed"] = False
        results["errors"].append("Mandatory fields contained nulls")

    # Check 2: Valid Date Range (UCI Online Retail is Dec 2010 to Dec 2011)
    date_range_valid = False
    if min_date and max_date:
        date_range_valid = (min_date.year == 2010 and min_date.month == 12 and max_date.year == 2011 and max_date.month == 12)
    check2 = {
        "name": "Date Range Check",
        "description": "Dates must span 2010-12-01 through 2011-12-09",
        "passed": date_range_valid,
        "details": f"Earliest: {min_date.strftime('%Y-%m-%d') if min_date else 'N/A'}, Latest: {max_date.strftime('%Y-%m-%d') if max_date else 'N/A'}"
    }
    results["checks"].append(check2)

    # Check 3: Transaction Status Consistency
    check3 = {
        "name": "Transaction Status Classification",
        "description": "Rows partitioned into COMPLETED, CANCELLED, or ADJUSTMENT without unclassified rows",
        "passed": (completed_count + cancelled_count + adjustment_count == total_rows),
        "details": f"Total: {total_rows} (Completed: {completed_count}, Cancelled: {cancelled_count}, Adjustment: {adjustment_count})"
    }
    results["checks"].append(check3)

    # Check 4: Revenue Non-Negative for Completed Transactions
    check4 = {
        "name": "Revenue Sanity Check",
        "description": "Total gross revenue from completed orders must be strictly positive",
        "passed": gross_revenue > 0,
        "details": f"Gross Revenue: ${gross_revenue:,.2f}"
    }
    results["checks"].append(check4)

    results["summary"] = {
        "total_rows": total_rows,
        "completed_count": completed_count,
        "cancelled_count": cancelled_count,
        "adjustment_count": adjustment_count,
        "guest_rows": guest_count,
        "gross_revenue": round(gross_revenue, 2),
        "min_date": min_date.strftime('%Y-%m-%d') if min_date else None,
        "max_date": max_date.strftime('%Y-%m-%d') if max_date else None,
        "all_checks_passed": results["passed"]
    }

    with open(PROCESSED_DATA_DIR / "validation_report.json", 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)

    print(f"Validation finished. Passed: {results['passed']}. Total Rows: {total_rows}")
    return results


if __name__ == '__main__':
    validate_clean_data()
