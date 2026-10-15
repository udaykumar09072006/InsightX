"""InsightX Customer Segmentation Module (RFM Analysis)
Calculates Recency, Frequency, and Monetary metrics for identified customers,
assigns quantile scores, segments into strategic behavioral cohorts, and
computes segment value distributions.
"""
import csv
import json
import datetime
from pathlib import Path
from collections import defaultdict

from src.config import CLEAN_CSV_PATH, RFM_CSV_PATH, RFM_REFERENCE_DATE, PROCESSED_DATA_DIR


def calculate_quantiles(values: list[float], num_bins=5, reverse=False) -> list[int]:
    """Assigns 1..num_bins quantile score based on ranking."""
    n = len(values)
    if n == 0:
        return []
    # Rank with index
    sorted_pairs = sorted(enumerate(values), key=lambda x: x[1])
    scores = [0] * n
    for rank, (orig_idx, _) in enumerate(sorted_pairs):
        bin_idx = int(rank / n * num_bins) + 1
        bin_idx = min(bin_idx, num_bins)
        if reverse:
            scores[orig_idx] = num_bins - bin_idx + 1
        else:
            scores[orig_idx] = bin_idx
    return scores


def assign_rfm_segment(r: int, f: int, m: int) -> str:
    """Assigns standard marketing segment based on RFM score tuple."""
    rf_score = (r + f) / 2.0
    if r >= 4 and f >= 4 and m >= 4:
        return "Champions"
    elif r >= 3 and f >= 3:
        return "Loyal Customers"
    elif r >= 4 and f <= 2:
        return "Potential Loyalists"
    elif r >= 3 and f <= 2 and m <= 2:
        return "Promising"
    elif r == 3 and f == 3:
        return "Need Attention"
    elif r == 2 and f <= 2:
        return "About to Sleep"
    elif r <= 2 and f >= 3:
        return "At Risk"
    elif r == 1 and f >= 4:
        return "Cannot Lose Them"
    elif r <= 2 and f <= 2:
        return "Hibernating"
    else:
        return "Customers Needing Attention"


def run_rfm_analysis() -> dict:
    """Executes full RFM computation from cleaned dataset."""
    print(f"Running RFM analysis using reference date {RFM_REFERENCE_DATE}...")

    # Aggregations per customer
    cust_data = {}

    with open(CLEAN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['is_guest'] == '1' or not row['customer_id']:
                continue  # Unregistered customers cannot be assigned customer-level RFM history

            cid = row['customer_id']
            if cid not in cust_data:
                cust_data[cid] = {
                    "country": row['country'],
                    "latest_date": datetime.date(2000, 1, 1),
                    "completed_orders": set(),
                    "gross_revenue": 0.0,
                    "return_value": 0.0,
                    "total_items": 0
                }

            entry = cust_data[cid]
            d_str = row['invoice_date'][:10]
            if d_str:
                try:
                    dt = datetime.datetime.strptime(d_str, '%Y-%m-%d').date()
                    if dt > entry["latest_date"]:
                        entry["latest_date"] = dt
                except ValueError:
                    pass

            status = row['status']
            line_total = float(row['line_total'])
            qty = int(row['quantity'])

            if status == 'COMPLETED':
                entry["completed_orders"].add(row['invoice_no'])
                entry["gross_revenue"] += line_total
                entry["total_items"] += qty
            elif status == 'CANCELLED':
                entry["return_value"] += abs(line_total)

    # Calculate Recency, Frequency, Monetary (Net Spend)
    customer_list = []
    for cid, d in cust_data.items():
        recency = (RFM_REFERENCE_DATE - d["latest_date"]).days if d["latest_date"].year > 2000 else 999
        frequency = len(d["completed_orders"])
        monetary = round(d["gross_revenue"] - d["return_value"], 2)

        # Ensure non-negative monetary for standard customer scoring
        monetary_score_val = max(monetary, 0.0)

        customer_list.append({
            "customer_id": cid,
            "country": d["country"],
            "last_order_date": d["latest_date"].strftime('%Y-%m-%d'),
            "recency_days": recency,
            "frequency_orders": frequency,
            "monetary_spend": monetary,
            "monetary_score_val": monetary_score_val,
            "gross_revenue": round(d["gross_revenue"], 2),
            "return_value": round(d["return_value"], 2),
            "total_items": d["total_items"]
        })

    # Calculate quantile scores (1..5)
    # Recency: lower is better (reverse=True)
    r_vals = [c["recency_days"] for c in customer_list]
    f_vals = [c["frequency_orders"] for c in customer_list]
    m_vals = [c["monetary_score_val"] for c in customer_list]

    r_scores = calculate_quantiles(r_vals, num_bins=5, reverse=True)
    f_scores = calculate_quantiles(f_vals, num_bins=5, reverse=False)
    m_scores = calculate_quantiles(m_vals, num_bins=5, reverse=False)

    segments_agg = defaultdict(lambda: {
        "customer_count": 0,
        "total_revenue": 0.0,
        "total_recency": 0,
        "total_frequency": 0,
        "total_items": 0
    })

    total_revenue_all = sum(c["monetary_spend"] for c in customer_list)
    total_customers_all = len(customer_list)

    final_rfm_records = []
    for i, c in enumerate(customer_list):
        r_s = r_scores[i]
        f_s = f_scores[i]
        m_s = m_scores[i]
        rfm_score = f"{r_s}{f_s}{m_s}"
        segment = assign_rfm_segment(r_s, f_s, m_s)

        record = {
            "customer_id": c["customer_id"],
            "country": c["country"],
            "last_order_date": c["last_order_date"],
            "recency": c["recency_days"],
            "frequency": c["frequency_orders"],
            "monetary": c["monetary_spend"],
            "r_score": r_s,
            "f_score": f_s,
            "m_score": m_s,
            "rfm_score": rfm_score,
            "segment": segment
        }
        final_rfm_records.append(record)

        s_entry = segments_agg[segment]
        s_entry["customer_count"] += 1
        s_entry["total_revenue"] += c["monetary_spend"]
        s_entry["total_recency"] += c["recency_days"]
        s_entry["total_frequency"] += c["frequency_orders"]
        s_entry["total_items"] += c["total_items"]

    # Write customer_rfm.csv
    print(f"Writing {len(final_rfm_records)} customer RFM rows to {RFM_CSV_PATH}...")
    with open(RFM_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "customer_id", "country", "last_order_date", "recency",
            "frequency", "monetary", "r_score", "f_score", "m_score",
            "rfm_score", "segment"
        ])
        writer.writeheader()
        writer.writerows(final_rfm_records)

    # Build segment summary report
    segment_report = []
    for seg, data in sorted(segments_agg.items(), key=lambda x: x[1]["total_revenue"], reverse=True):
        count = data["customer_count"]
        rev = round(data["total_revenue"], 2)
        avg_r = round(data["total_recency"] / count, 1) if count else 0
        avg_f = round(data["total_frequency"] / count, 1) if count else 0
        avg_m = round(rev / count, 2) if count else 0
        cust_pct = round((count / total_customers_all) * 100, 2) if total_customers_all else 0
        rev_pct = round((rev / total_revenue_all) * 100, 2) if total_revenue_all else 0

        segment_report.append({
            "segment": seg,
            "customer_count": count,
            "customer_pct": cust_pct,
            "total_revenue": rev,
            "revenue_pct": rev_pct,
            "avg_recency_days": avg_r,
            "avg_frequency_orders": avg_f,
            "avg_monetary_spend": avg_m
        })

    summary_file = PROCESSED_DATA_DIR / "rfm_segments_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump({
            "reference_date": str(RFM_REFERENCE_DATE),
            "total_customers": total_customers_all,
            "total_revenue": round(total_revenue_all, 2),
            "segments": segment_report
        }, f, indent=2)

    print("RFM Analysis completed successfully.")
    return segment_report


if __name__ == '__main__':
    run_rfm_analysis()
