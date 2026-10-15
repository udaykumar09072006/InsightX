"""InsightX Cohort & Retention Analysis Module
Computes monthly acquisition cohorts, tracks longitudinal retention rates,
and outputs cohort retention matrices and retention decay rates.
"""
import csv
import json
import datetime
from pathlib import Path
from collections import defaultdict

from src.config import CLEAN_CSV_PATH, COHORT_CSV_PATH, PROCESSED_DATA_DIR


def month_diff(d1_str: str, d2_str: str) -> int:
    """Calculates number of calendar months between two 'YYYY-MM' strings."""
    y1, m1 = map(int, d1_str.split('-'))
    y2, m2 = map(int, d2_str.split('-'))
    return (y2 - y1) * 12 + (m2 - m1)


def run_cohort_analysis() -> dict:
    """Builds monthly acquisition cohort retention matrix."""
    print("Running Cohort Retention Analysis...")

    # Step 1: Find first purchase month for each identified customer
    customer_first_month = {}
    customer_months_active = defaultdict(set)
    customer_order_counts = defaultdict(set)

    with open(CLEAN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['is_guest'] == '1' or not row['customer_id']:
                continue
            if row['status'] != 'COMPLETED':
                continue

            cid = row['customer_id']
            date_str = row['invoice_date'][:7]  # YYYY-MM
            inv_no = row['invoice_no']

            customer_order_counts[cid].add(inv_no)
            customer_months_active[cid].add(date_str)

            if cid not in customer_first_month or date_str < customer_first_month[cid]:
                customer_first_month[cid] = date_str

    # Overall Repeat Purchase Rate
    total_identified_customers = len(customer_order_counts)
    repeat_customers = sum(1 for c, orders in customer_order_counts.items() if len(orders) >= 2)
    single_purchase_customers = total_identified_customers - repeat_customers
    repeat_purchase_rate = round((repeat_customers / total_identified_customers) * 100, 2) if total_identified_customers else 0

    # Step 2: Assign cohorts and count activity by period offset
    cohort_sizes = defaultdict(int)
    # cohort -> period_offset (0..12) -> set of customer IDs
    cohort_retention_sets = defaultdict(lambda: defaultdict(set))

    for cid, first_m in customer_first_month.items():
        cohort_sizes[first_m] += 1
        for active_m in customer_months_active[cid]:
            offset = month_diff(first_m, active_m)
            if offset >= 0:
                cohort_retention_sets[first_m][offset].add(cid)

    sorted_cohorts = sorted(cohort_sizes.keys())
    max_periods = 13  # 0 to 12

    matrix_rows = []
    matrix_json = []

    for cohort in sorted_cohorts:
        initial_size = cohort_sizes[cohort]
        row_dict = {
            "cohort": cohort,
            "cohort_size": initial_size
        }
        json_row = {
            "cohort": cohort,
            "initial_size": initial_size,
            "periods": []
        }

        for period in range(max_periods):
            retained_count = len(cohort_retention_sets[cohort][period])
            pct = round((retained_count / initial_size) * 100, 2) if initial_size else 0.0

            # Right-censored check: if period exceeds available historical months
            cohort_y, cohort_m = map(int, cohort.split('-'))
            end_y, end_m = 2011, 12
            max_possible_offset = (end_y - cohort_y) * 12 + (end_m - cohort_m)

            if period > max_possible_offset:
                row_dict[f"period_{period}_count"] = ""
                row_dict[f"period_{period}_pct"] = ""
                json_row["periods"].append({"period": period, "retained_count": None, "retention_pct": None, "censored": True})
            else:
                row_dict[f"period_{period}_count"] = retained_count
                row_dict[f"period_{period}_pct"] = pct
                json_row["periods"].append({"period": period, "retained_count": retained_count, "retention_pct": pct, "censored": False})

        matrix_rows.append(row_dict)
        matrix_json.append(json_row)

    # Write cohort_retention.csv
    fieldnames = ["cohort", "cohort_size"]
    for p in range(max_periods):
        fieldnames.extend([f"period_{p}_count", f"period_{p}_pct"])

    with open(COHORT_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(matrix_rows)

    # Average retention decay across all cohorts
    period_averages = []
    for p in range(max_periods):
        valid_pcts = [r["periods"][p]["retention_pct"] for r in matrix_json if r["periods"][p]["retention_pct"] is not None]
        avg_pct = round(sum(valid_pcts) / len(valid_pcts), 2) if valid_pcts else 0.0
        period_averages.append({"period": p, "avg_retention_pct": avg_pct, "cohort_count": len(valid_pcts)})

    result_summary = {
        "total_identified_customers": total_identified_customers,
        "repeat_customers": repeat_customers,
        "single_purchase_customers": single_purchase_customers,
        "repeat_purchase_rate_pct": repeat_purchase_rate,
        "cohorts": matrix_json,
        "period_averages": period_averages
    }

    with open(PROCESSED_DATA_DIR / "cohort_retention.json", 'w', encoding='utf-8') as f:
        json.dump(result_summary, f, indent=2)

    print(f"Cohort Analysis complete. Repeat purchase rate: {repeat_purchase_rate}%.")
    return result_summary


if __name__ == '__main__':
    run_cohort_analysis()
