"""InsightX Configuration Module
Defines project paths, reference dates, schema standards, and data policies.
"""
from pathlib import Path
import datetime

# Base Directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
SQL_DIR = BASE_DIR / "sql"
NOTEBOOKS_DIR = BASE_DIR / "notebooks"
REPORTS_DIR = BASE_DIR / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"
TESTS_DIR = BASE_DIR / "tests"
POWERBI_DIR = BASE_DIR / "powerbi"

# Data Files
RAW_XLSX_PATH = RAW_DATA_DIR / "Online Retail.xlsx"
RAW_ZIP_PATH = RAW_DATA_DIR / "online_retail.zip"
RAW_CSV_PATH = RAW_DATA_DIR / "online_retail_raw.csv"

CLEAN_CSV_PATH = PROCESSED_DATA_DIR / "online_retail_clean.csv"
FACT_SALES_PATH = PROCESSED_DATA_DIR / "fact_sales.csv"
DIM_CUSTOMER_PATH = PROCESSED_DATA_DIR / "dim_customer.csv"
DIM_PRODUCT_PATH = PROCESSED_DATA_DIR / "dim_product.csv"
DIM_DATE_PATH = PROCESSED_DATA_DIR / "dim_date.csv"
DIM_COUNTRY_PATH = PROCESSED_DATA_DIR / "dim_country.csv"

RFM_CSV_PATH = PROCESSED_DATA_DIR / "customer_rfm.csv"
COHORT_CSV_PATH = PROCESSED_DATA_DIR / "cohort_retention.csv"
KPI_SUMMARY_PATH = PROCESSED_DATA_DIR / "kpi_summary.json"
DATABASE_PATH = PROCESSED_DATA_DIR / "insightx.db"

# Analysis Reference Date
# Dataset ends on 2011-12-09. We set the RFM snapshot date to 2011-12-10 (the day immediately following the last transaction).
RFM_REFERENCE_DATE = datetime.date(2011, 12, 10)

# Transaction Policies
# Gross Revenue Policy: Valid completed transactions (Quantity > 0, UnitPrice > 0, not starting with 'C')
# Return Policy: Invoices starting with 'C' or Quantity < 0
# Customer Policy: CustomerID present vs Guest/Unregistered (explicitly preserved and flagged)
