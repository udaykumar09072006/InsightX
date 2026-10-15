"""InsightX Database Loader Module
Creates standard relational schemas, generates indexes, loads fact and dimension
tables into SQLite (embedded engine for immediate query verification) and provides
PostgreSQL ingestion utilities via psycopg and SQLAlchemy.
"""
import sqlite3
import csv
import os
import sys
from pathlib import Path

from src.config import (
    DATABASE_PATH, FACT_SALES_PATH, DIM_CUSTOMER_PATH,
    DIM_PRODUCT_PATH, DIM_DATE_PATH, DIM_COUNTRY_PATH,
    RFM_CSV_PATH, PROCESSED_DATA_DIR, SQL_DIR
)


def load_sqlite():
    """Loads all dimensional tables and fact sales into data/processed/insightx.db."""
    print(f"Creating and populating database at {DATABASE_PATH}...")
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    if DATABASE_PATH.exists():
        DATABASE_PATH.unlink()

    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()

    # Create tables
    cur.execute("""
    CREATE TABLE dim_date (
        date_key TEXT PRIMARY KEY,
        full_date TEXT NOT NULL,
        year INTEGER NOT NULL,
        quarter INTEGER NOT NULL,
        month INTEGER NOT NULL,
        month_name TEXT NOT NULL,
        day INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        day_name TEXT NOT NULL,
        is_weekend INTEGER NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE dim_country (
        country TEXT PRIMARY KEY,
        total_orders INTEGER NOT NULL,
        total_revenue REAL NOT NULL,
        unique_customers INTEGER NOT NULL,
        total_units INTEGER NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE dim_product (
        stock_code TEXT PRIMARY KEY,
        description TEXT,
        first_sold_date TEXT,
        last_sold_date TEXT,
        avg_unit_price REAL NOT NULL,
        total_units_sold INTEGER NOT NULL,
        total_revenue REAL NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE dim_customer (
        customer_id TEXT PRIMARY KEY,
        country TEXT,
        first_order_date TEXT,
        last_order_date TEXT,
        total_orders INTEGER NOT NULL,
        cancelled_orders INTEGER NOT NULL,
        total_spend REAL NOT NULL,
        total_units INTEGER NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE fact_sales (
        transaction_id INTEGER PRIMARY KEY,
        invoice_no TEXT NOT NULL,
        stock_code TEXT NOT NULL,
        customer_id TEXT,
        date_key TEXT NOT NULL,
        country TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        line_total REAL NOT NULL,
        status TEXT NOT NULL,
        is_cancellation INTEGER NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE customer_rfm (
        customer_id TEXT PRIMARY KEY,
        country TEXT,
        last_order_date TEXT,
        recency INTEGER NOT NULL,
        frequency INTEGER NOT NULL,
        monetary REAL NOT NULL,
        r_score INTEGER NOT NULL,
        f_score INTEGER NOT NULL,
        m_score INTEGER NOT NULL,
        rfm_score TEXT NOT NULL,
        segment TEXT NOT NULL
    );
    """)

    # Load data from CSVs
    print("Loading dim_date...")
    with open(DIM_DATE_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        cur.executemany("INSERT INTO dim_date VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", reader)

    print("Loading dim_country...")
    with open(DIM_COUNTRY_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        cur.executemany("INSERT INTO dim_country VALUES (?, ?, ?, ?, ?)", reader)

    print("Loading dim_product...")
    with open(DIM_PRODUCT_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        cur.executemany("INSERT INTO dim_product VALUES (?, ?, ?, ?, ?, ?, ?)", reader)

    print("Loading dim_customer...")
    with open(DIM_CUSTOMER_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        cur.executemany("INSERT INTO dim_customer VALUES (?, ?, ?, ?, ?, ?, ?, ?)", reader)

    print("Loading fact_sales...")
    with open(FACT_SALES_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        cur.executemany("INSERT INTO fact_sales VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", reader)

    print("Loading customer_rfm...")
    with open(RFM_CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        cur.executemany("INSERT INTO customer_rfm VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", reader)

    # Create indexes
    print("Creating indexes...")
    cur.execute("CREATE INDEX idx_fact_invoice ON fact_sales(invoice_no);")
    cur.execute("CREATE INDEX idx_fact_customer ON fact_sales(customer_id);")
    cur.execute("CREATE INDEX idx_fact_stock ON fact_sales(stock_code);")
    cur.execute("CREATE INDEX idx_fact_date ON fact_sales(date_key);")
    cur.execute("CREATE INDEX idx_fact_status ON fact_sales(status);")
    cur.execute("CREATE INDEX idx_rfm_segment ON customer_rfm(segment);")

    conn.commit()
    conn.close()
    print("Database creation and loading complete.")


if __name__ == '__main__':
    load_sqlite()
