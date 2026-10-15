"""InsightX Data Transformation Module
Builds dimensional star schema tables (fact_sales, dim_product, dim_customer,
dim_date, dim_country) from the cleaned transaction data.
"""
import csv
import datetime
from pathlib import Path
from collections import defaultdict

from src.config import (
    CLEAN_CSV_PATH, FACT_SALES_PATH, DIM_CUSTOMER_PATH,
    DIM_PRODUCT_PATH, DIM_DATE_PATH, DIM_COUNTRY_PATH, PROCESSED_DATA_DIR
)


def build_star_schema():
    """Generates normalized star-schema dimensions and fact table."""
    print("Building Star Schema dimensional model...")

    products = {}
    customers = {}
    countries = {}
    dates = {}

    fact_records = []
    trans_id = 0

    with open(CLEAN_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            trans_id += 1
            inv_no = row['invoice_no']
            stock_code = row['stock_code']
            desc = row['description']
            qty = int(row['quantity'])
            date_str = row['invoice_date']
            price = float(row['unit_price'])
            cust_id = row['customer_id']
            country = row['country']
            line_total = float(row['line_total'])
            status = row['status']
            is_guest = row['is_guest'] == '1'
            is_cancellation = 1 if status == 'CANCELLED' else 0

            # Date key
            d_key = date_str[:10].replace('-', '') if date_str else '99991231'
            if d_key not in dates and date_str:
                try:
                    dt = datetime.datetime.strptime(date_str[:10], '%Y-%m-%d')
                    dates[d_key] = {
                        "date_key": d_key,
                        "full_date": date_str[:10],
                        "year": dt.year,
                        "quarter": (dt.month - 1) // 3 + 1,
                        "month": dt.month,
                        "month_name": dt.strftime('%B'),
                        "day": dt.day,
                        "day_of_week": dt.weekday() + 1,
                        "day_name": dt.strftime('%A'),
                        "is_weekend": 1 if dt.weekday() >= 5 else 0
                    }
                except ValueError:
                    pass

            # Product Dimension
            if stock_code not in products:
                products[stock_code] = {
                    "stock_code": stock_code,
                    "description": desc,
                    "first_sold_date": date_str[:10] if date_str else '',
                    "last_sold_date": date_str[:10] if date_str else '',
                    "total_units_sold": 0,
                    "total_revenue": 0.0,
                    "unit_prices": []
                }
            prod = products[stock_code]
            if desc and desc != "UNKNOWN DESCRIPTION":
                prod["description"] = desc
            if status == 'COMPLETED':
                prod["total_units_sold"] += qty
                prod["total_revenue"] += line_total
                if price > 0:
                    prod["unit_prices"].append(price)
            if date_str:
                d_val = date_str[:10]
                if d_val and (not prod["first_sold_date"] or d_val < prod["first_sold_date"]):
                    prod["first_sold_date"] = d_val
                if d_val and (not prod["last_sold_date"] or d_val > prod["last_sold_date"]):
                    prod["last_sold_date"] = d_val

            # Customer Dimension (identified customers only for strict entity table)
            if not is_guest and cust_id:
                if cust_id not in customers:
                    customers[cust_id] = {
                        "customer_id": cust_id,
                        "country": country,
                        "first_order_date": date_str[:10] if date_str else '',
                        "last_order_date": date_str[:10] if date_str else '',
                        "completed_orders": set(),
                        "cancelled_orders": set(),
                        "total_spend": 0.0,
                        "total_units": 0
                    }
                cust = customers[cust_id]
                if status == 'COMPLETED':
                    cust["completed_orders"].add(inv_no)
                    cust["total_spend"] += line_total
                    cust["total_units"] += qty
                elif status == 'CANCELLED':
                    cust["cancelled_orders"].add(inv_no)
                if date_str:
                    d_val = date_str[:10]
                    if d_val and (not cust["first_order_date"] or d_val < cust["first_order_date"]):
                        cust["first_order_date"] = d_val
                    if d_val and (not cust["last_order_date"] or d_val > cust["last_order_date"]):
                        cust["last_order_date"] = d_val

            # Country Dimension
            if country not in countries:
                countries[country] = {
                    "country": country,
                    "total_orders": set(),
                    "total_revenue": 0.0,
                    "unique_customers": set(),
                    "total_units": 0
                }
            c_entry = countries[country]
            c_entry["total_orders"].add(inv_no)
            if not is_guest:
                c_entry["unique_customers"].add(cust_id)
            if status == 'COMPLETED':
                c_entry["total_revenue"] += line_total
                c_entry["total_units"] += qty

            fact_records.append({
                "transaction_id": trans_id,
                "invoice_no": inv_no,
                "stock_code": stock_code,
                "customer_id": cust_id,
                "date_key": d_key,
                "country": country,
                "quantity": qty,
                "unit_price": price,
                "line_total": line_total,
                "status": status,
                "is_cancellation": is_cancellation
            })

    print(f"Writing dim_date ({len(dates)} days)...")
    with open(DIM_DATE_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "date_key", "full_date", "year", "quarter", "month",
            "month_name", "day", "day_of_week", "day_name", "is_weekend"
        ])
        writer.writeheader()
        for k in sorted(dates.keys()):
            writer.writerow(dates[k])

    print(f"Writing dim_product ({len(products)} products)...")
    with open(DIM_PRODUCT_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "stock_code", "description", "first_sold_date", "last_sold_date",
            "avg_unit_price", "total_units_sold", "total_revenue"
        ])
        writer.writeheader()
        for p in products.values():
            avg_p = round(sum(p["unit_prices"]) / len(p["unit_prices"]), 2) if p["unit_prices"] else 0.0
            writer.writerow({
                "stock_code": p["stock_code"],
                "description": p["description"],
                "first_sold_date": p["first_sold_date"],
                "last_sold_date": p["last_sold_date"],
                "avg_unit_price": avg_p,
                "total_units_sold": p["total_units_sold"],
                "total_revenue": round(p["total_revenue"], 2)
            })

    print(f"Writing dim_customer ({len(customers)} customers)...")
    with open(DIM_CUSTOMER_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "customer_id", "country", "first_order_date", "last_order_date",
            "total_orders", "cancelled_orders", "total_spend", "total_units"
        ])
        writer.writeheader()
        for c in customers.values():
            writer.writerow({
                "customer_id": c["customer_id"],
                "country": c["country"],
                "first_order_date": c["first_order_date"],
                "last_order_date": c["last_order_date"],
                "total_orders": len(c["completed_orders"]),
                "cancelled_orders": len(c["cancelled_orders"]),
                "total_spend": round(c["total_spend"], 2),
                "total_units": c["total_units"]
            })

    print(f"Writing dim_country ({len(countries)} countries)...")
    with open(DIM_COUNTRY_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "country", "total_orders", "total_revenue", "unique_customers", "total_units"
        ])
        writer.writeheader()
        for c in countries.values():
            writer.writerow({
                "country": c["country"],
                "total_orders": len(c["total_orders"]),
                "total_revenue": round(c["total_revenue"], 2),
                "unique_customers": len(c["unique_customers"]),
                "total_units": c["total_units"]
            })

    print(f"Writing fact_sales ({len(fact_records)} records)...")
    with open(FACT_SALES_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "transaction_id", "invoice_no", "stock_code", "customer_id",
            "date_key", "country", "quantity", "unit_price", "line_total",
            "status", "is_cancellation"
        ])
        writer.writeheader()
        writer.writerows(fact_records)

    print("Star Schema tables created successfully.")


if __name__ == '__main__':
    build_star_schema()
