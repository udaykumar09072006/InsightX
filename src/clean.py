"""InsightX Data Cleaning & Quality Audit Module
Applies auditable filtering rules, flags anomalies, handles cancellations,
resolves customer identifiers, and produces clean analytical datasets.
"""
import csv
import json
import datetime
from pathlib import Path
from collections import defaultdict

from src.config import RAW_CSV_PATH, CLEAN_CSV_PATH, PROCESSED_DATA_DIR, REPORTS_DIR


def clean_dataset() -> dict:
    """Reads raw CSV, applies systematic data quality rules, and writes clean CSV."""
    if not RAW_CSV_PATH.exists():
        raise FileNotFoundError(f"Raw CSV not found at {RAW_CSV_PATH}. Run src.ingest first.")

    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    audit = {
        "total_raw_rows": 0,
        "exact_duplicates_removed": 0,
        "cancellations_count": 0,
        "negative_quantity_non_cancellations": 0,
        "zero_or_negative_unit_price": 0,
        "missing_customer_id": 0,
        "missing_description": 0,
        "valid_completed_transactions": 0,
        "total_gross_revenue": 0.0,
        "total_cancellation_value": 0.0,
        "net_revenue": 0.0,
        "start_date": None,
        "end_date": None,
        "countries_count": 0,
        "unique_products_count": 0,
        "unique_customers_count": 0,
        "unique_invoices_count": 0,
    }

    seen_rows = set()
    cleaned_rows = []
    countries = set()
    products = set()
    customers = set()
    invoices = set()

    print("Reading and auditing raw CSV...")
    with open(RAW_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            audit["total_raw_rows"] += 1
            inv_no = (row.get('InvoiceNo') or '').strip()
            stock_code = (row.get('StockCode') or '').strip()
            desc = (row.get('Description') or '').strip()
            qty_str = (row.get('Quantity') or '').strip()
            date_str = (row.get('InvoiceDate') or '').strip()
            price_str = (row.get('UnitPrice') or '').strip()
            cust_id = (row.get('CustomerID') or '').strip()
            country = (row.get('Country') or '').strip()

            # Exact duplicate check
            row_tuple = (inv_no, stock_code, desc, qty_str, date_str, price_str, cust_id, country)
            if row_tuple in seen_rows:
                audit["exact_duplicates_removed"] += 1
                continue
            seen_rows.add(row_tuple)

            # Parse numeric values
            try:
                qty = int(float(qty_str)) if qty_str else 0
            except ValueError:
                qty = 0

            try:
                price = float(price_str) if price_str else 0.0
            except ValueError:
                price = 0.0

            # Classification flags
            is_cancellation = inv_no.upper().startswith('C')
            if is_cancellation:
                audit["cancellations_count"] += 1

            if qty < 0 and not is_cancellation:
                audit["negative_quantity_non_cancellations"] += 1

            if price <= 0:
                audit["zero_or_negative_unit_price"] += 1

            if not cust_id:
                audit["missing_customer_id"] += 1
                effective_customer_id = "GUEST"
                is_guest = True
            else:
                effective_customer_id = cust_id
                is_guest = False
                customers.add(cust_id)

            if not desc:
                audit["missing_description"] += 1
                desc = "UNKNOWN DESCRIPTION"

            # Compute line revenue
            line_total = round(qty * price, 4)

            # Date tracking
            if date_str:
                d_part = date_str[:10]
                if audit["start_date"] is None or d_part < audit["start_date"]:
                    audit["start_date"] = d_part
                if audit["end_date"] is None or d_part > audit["end_date"]:
                    audit["end_date"] = d_part

            # Categorize transaction state
            # 'COMPLETED': valid sale (qty > 0, price > 0, not cancellation)
            # 'CANCELLED': cancellation request starting with C
            # 'ADJUSTMENT': damaged stock, manual write-offs, or price error (qty <= 0 without C, or price <= 0)
            if is_cancellation:
                trans_status = "CANCELLED"
                audit["total_cancellation_value"] += abs(line_total)
            elif qty <= 0 or price <= 0:
                trans_status = "ADJUSTMENT"
            else:
                trans_status = "COMPLETED"
                audit["valid_completed_transactions"] += 1
                audit["total_gross_revenue"] += line_total

            countries.add(country)
            products.add(stock_code)
            invoices.add(inv_no)

            cleaned_rows.append({
                "invoice_no": inv_no,
                "stock_code": stock_code,
                "description": desc,
                "quantity": qty,
                "invoice_date": date_str,
                "unit_price": price,
                "customer_id": effective_customer_id,
                "is_guest": "1" if is_guest else "0",
                "country": country,
                "line_total": line_total,
                "status": trans_status
            })

    audit["total_gross_revenue"] = round(audit["total_gross_revenue"], 2)
    audit["total_cancellation_value"] = round(audit["total_cancellation_value"], 2)
    audit["net_revenue"] = round(audit["total_gross_revenue"] - audit["total_cancellation_value"], 2)
    audit["countries_count"] = len(countries)
    audit["unique_products_count"] = len(products)
    audit["unique_customers_count"] = len(customers)
    audit["unique_invoices_count"] = len(invoices)

    print(f"Audited {audit['total_raw_rows']} raw rows.")
    print(f"Duplicates removed: {audit['exact_duplicates_removed']}")
    print(f"Valid completed rows: {audit['valid_completed_transactions']}")
    print(f"Cancellations: {audit['cancellations_count']}")
    print(f"Gross Revenue: ${audit['total_gross_revenue']:,.2f}")
    print(f"Identified Unique Customers: {audit['unique_customers_count']}")

    # Write clean CSV
    clean_fields = [
        "invoice_no", "stock_code", "description", "quantity",
        "invoice_date", "unit_price", "customer_id", "is_guest",
        "country", "line_total", "status"
    ]
    with open(CLEAN_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=clean_fields)
        writer.writeheader()
        writer.writerows(cleaned_rows)

    # Save summary JSON
    with open(PROCESSED_DATA_DIR / "data_audit_summary.json", 'w', encoding='utf-8') as f:
        json.dump(audit, f, indent=2)

    return audit


if __name__ == '__main__':
    clean_dataset()
